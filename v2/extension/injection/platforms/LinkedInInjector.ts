/**
 * LinkedIn Injection Engine - Comprehensive Implementation
 * 
 * Complete LinkedIn injection system using updated selectors and improved targeting.
 * Uses the existing BaseKeyboard component with enhanced LinkedIn-specific targeting.
 */

import { createRoot } from 'react-dom/client';
import { BaseKeyboard } from '../../components/KeyboardUI/BaseKeyboard.js';
import { MutationObserverManager } from '../mutationObserver.js';
import { DOMUtils } from '../domUtils.js';
import { 
  LinkedInSelectorValidator, 
  LINKEDIN_COMPOSE_SELECTORS, 
  LINKEDIN_COMMENT_SELECTORS,
  LINKEDIN_MESSAGE_SELECTORS,
  LINKEDIN_ARTICLE_SELECTORS,
  LINKEDIN_COMPANY_SELECTORS 
} from './LinkedInSelectors.js';
import { 
  LinkedInDOM, 
  type LinkedInTheme, 
  type LinkedInComposeContext 
} from './LinkedInDOM.js';
import { createPlatformDetectionError } from '../types.js';

/**
 * LinkedIn injection state management
 */
interface LinkedInInjectionState {
  isInjecting: boolean;
  styleInjected: boolean;
  observerId?: string;
  injectedElements: Set<HTMLElement>;
  lastUrl: string;
}

/**
 * Global state for LinkedIn injection
 */
let injectionState: LinkedInInjectionState = {
  isInjecting: false,
  styleInjected: false,
  injectedElements: new Set(),
  lastUrl: '',
};

/**
 * Main LinkedIn injection function
 */
export function injectLinkedInKeyboard(): void {
  setupNavigationWatcher();
  startLinkedInObservation();
}

/**
 * Sets up LinkedIn page navigation watching for cleanup
 */
function setupNavigationWatcher(): void {
  const currentUrl = window.location.href;
  injectionState.lastUrl = currentUrl;
  
  // Watch for URL changes in LinkedIn SPA
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    handleNavigationChange();
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    handleNavigationChange();
  };
  
  window.addEventListener('popstate', handleNavigationChange);
}

/**
 * Handles navigation changes and cleanup
 */
function handleNavigationChange(): void {
  const newUrl = window.location.href;
  if (newUrl !== injectionState.lastUrl) {
    injectionState.lastUrl = newUrl;
    cleanupAllInjections();
    // Restart observation after a brief delay for new page to load
    setTimeout(startLinkedInObservation, 300);
  }
}

/**
 * Starts LinkedIn-specific DOM observation
 */
function startLinkedInObservation(): void {
  // Stop any existing observer
  if (injectionState.observerId) {
    MutationObserverManager.stopObserving(injectionState.observerId);
  }
  
  // Start new observer for LinkedIn compose areas
  const observationResult = MutationObserverManager.startObserving(
    {
      platform: 'linkedin',
      target: document.body,
      options: {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-test-ql-editor-contenteditable', 'contenteditable', 'class'],
      },
      debounceMs: 200,
      priority: 'high',
    },
    handleLinkedInMutations
  );
  
  if (observationResult.success) {
    injectionState.observerId = observationResult.observerId;
  }
  
  // Also try immediate injection for any existing elements
  tryImmediateInjection();
}

/**
 * Handles LinkedIn DOM mutations
 */
function handleLinkedInMutations(mutations: readonly MutationRecord[]): void {
  if (injectionState.isInjecting) {
    return; // Prevent concurrent injections
  }
  
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          processElementForInjection(element);
        }
      }
    } else if (mutation.type === 'attributes') {
      const element = mutation.target as HTMLElement;
      if (mutation.attributeName === 'contenteditable' && element.getAttribute('contenteditable') === 'true') {
        processElementForInjection(element);
      }
      if (mutation.attributeName === 'data-test-ql-editor-contenteditable') {
        processElementForInjection(element);
      }
    }
  }
}

/**
 * Processes an element to see if it needs keyboard injection
 */
function processElementForInjection(element: HTMLElement): void {
  // Check if this element or its children contain compose areas
  const composeTargets = findComposeTargets(element);
  
  for (const target of composeTargets) {
    if (shouldInjectKeyboard(target)) {
      injectKeyboardForTarget(target);
    }
  }
}

/**
 * Finds potential compose targets in an element
 */
function findComposeTargets(element: HTMLElement): HTMLElement[] {
  const targets: HTMLElement[] = [];
  
  // Check if element itself is a compose area
  if (isComposeElement(element)) {
    targets.push(element);
  }
  
  // Find compose areas with primary selectors
  const selectorConfigs = [
    LINKEDIN_COMPOSE_SELECTORS,
    LINKEDIN_COMMENT_SELECTORS,
    LINKEDIN_MESSAGE_SELECTORS,
    LINKEDIN_ARTICLE_SELECTORS,
    LINKEDIN_COMPANY_SELECTORS,
  ];

  for (const config of selectorConfigs) {
    // Try primary selector
    const primaryTargets = element.querySelectorAll(config.primary);
    for (const target of Array.from(primaryTargets)) {
      if (LinkedInSelectorValidator.validateComposeArea(target)) {
        targets.push(target as HTMLElement);
      }
    }
    
    // Try fallback selectors if no primary matches found
    if (targets.length === 0) {
      for (const fallback of config.fallbacks) {
        const fallbackTargets = element.querySelectorAll(fallback);
        for (const target of Array.from(fallbackTargets)) {
          if (LinkedInSelectorValidator.validateComposeArea(target)) {
            targets.push(target as HTMLElement);
          }
        }
        if (targets.length > 0) break;
      }
    }
  }
  
  // Remove duplicates
  return Array.from(new Set(targets));
}

/**
 * Checks if an element is a compose element
 */
function isComposeElement(element: HTMLElement): boolean {
  return (
    element.hasAttribute('data-test-ql-editor-contenteditable') ||
    (element.getAttribute('contenteditable') === 'true' && 
     (element.classList.contains('ql-editor') ||
      element.closest('.share-creation-state__text-editor') !== null ||
      element.closest('.comments-comment-box__form') !== null ||
      element.closest('.msg-form__container') !== null))
  );
}

/**
 * Determines if keyboard should be injected for a target
 */
function shouldInjectKeyboard(target: HTMLElement): boolean {
  // Skip if already injected
  if (injectionState.injectedElements.has(target)) {
    return false;
  }
  
  // Skip if parent already has injection
  if (target.closest('.hypertweet-keyboard-container')) {
    return false;
  }
  
  // Validate target is ready for injection
  if (!LinkedInSelectorValidator.validateComposeArea(target)) {
    return false;
  }
  
  // Check if target is ready (not in loading state)
  if (!LinkedInSelectorValidator.isReadyForInjection(target)) {
    return false;
  }
  
  // Check if target is in supported context
  const context = LinkedInSelectorValidator.getComposeContext(target);
  if (context === 'unknown') {
    return false;
  }
  
  // Check if target has minimum dimensions
  const rect = target.getBoundingClientRect();
  if (rect.width < 100 || rect.height < 20) {
    return false;
  }
  
  return true;
}

/**
 * Injects keyboard for a specific target
 */
function injectKeyboardForTarget(target: HTMLElement): void {
  injectionState.isInjecting = true;
  
  try {
    // Inject styles if not already done
    if (!injectionState.styleInjected) {
      injectLinkedInStyles();
      injectionState.styleInjected = true;
    }
    
    // Analyze compose context
    const context = LinkedInDOM.analyzeComposeContext(target);
    const theme = LinkedInDOM.detectTheme();
    
    // Create keyboard element
    const keyboard = createLinkedInKeyboard(target, context, theme);
    
    // Position keyboard
    const positioning = LinkedInDOM.positionKeyboard(keyboard, context, theme);
    
    if (positioning.success) {
      // Mark target as injected
      injectionState.injectedElements.add(target);
      
      // Set up cleanup when target is removed
      setupTargetCleanup(target, keyboard);
      
      // Integrate with compose area
      LinkedInDOM.integrateWithCompose(keyboard, target, context);
      
      console.log('✅ LinkedIn keyboard injected successfully', { context: context.type, target });
    } else {
      console.warn('⚠️ LinkedIn keyboard positioning failed', positioning.error);
      DOMUtils.safeRemoveElement(keyboard);
    }
    
  } catch (error) {
    console.error('❌ LinkedIn keyboard injection failed:', error);
  } finally {
    injectionState.isInjecting = false;
  }
}

/**
 * Creates a LinkedIn-themed keyboard element
 */
function createLinkedInKeyboard(
  target: HTMLElement, 
  context: LinkedInComposeContext, 
  theme: LinkedInTheme
): HTMLElement {
  // Create container
  const container = document.createElement('div');
  container.className = 'hypertweet-keyboard-container';
  container.setAttribute('data-hypertweet-injection', 'true');
  container.setAttribute('data-platform', 'linkedin');
  
  // Apply LinkedIn-specific styling
  const styles = LinkedInDOM.getLinkedInStyling(theme, context);
  Object.assign(container.style, {
    ...styles,
    position: 'relative',
    width: '100%',
    'box-sizing': 'border-box',
    'z-index': '1000',
  });
  
  // Create React root and render keyboard
  const root = createRoot(container);
  
  root.render(
    BaseKeyboard({
      platform: 'linkedin',
      targetElement: {
        element: target,
        platform: 'linkedin',
        textArea: target,
        container: context.container,
      },
      visible: true,
      onToneSelect: async ({ tone, mode, targetElement }) => {
        // TODO: Generate text based on tone and mode
        const generatedText = `Sample ${tone} text for LinkedIn`;
        insertTextIntoTarget(target, generatedText, context);
      },
      onQuickAction: async ({ action, targetElement }) => {
        switch (action) {
          case 'clear':
            insertTextIntoTarget(target, '', context);
            break;
          case 'copy':
            // TODO: Copy current text to clipboard
            copyTextFromTarget(target);
            break;
          case 'toggle':
            DOMUtils.safeRemoveElement(container);
            injectionState.injectedElements.delete(target);
            break;
          default:
            // Handle other actions
            break;
        }
      },
    })
  );
  
  return container;
}

/**
 * Inserts text into the target compose area
 */
function insertTextIntoTarget(
  target: HTMLElement, 
  text: string, 
  context: LinkedInComposeContext
): void {
  try {
    // Focus the target
    target.focus();
    
    // Handle Quill editor specifically
    if (context.isQuillEditor) {
      insertTextIntoQuillEditor(target, text);
    } else {
      // Handle regular contenteditable
      insertTextIntoContentEditable(target, text);
    }
    
    // Trigger LinkedIn-specific events
    triggerLinkedInEvents(target, text);
    
    // Keep focus on target
    target.focus();
    
  } catch (error) {
    console.error('Failed to insert text into LinkedIn target:', error);
  }
}

/**
 * Inserts text into Quill editor
 */
function insertTextIntoQuillEditor(target: HTMLElement, text: string): void {
  // Try to access Quill instance
  const quillContainer = target.closest('.ql-container');
  if (quillContainer && (quillContainer as any).__quill) {
    const quill = (quillContainer as any).__quill;
    quill.setText(text);
    return;
  }
  
  // Fallback to contenteditable approach
  insertTextIntoContentEditable(target, text);
}

/**
 * Inserts text into regular contenteditable element
 */
function insertTextIntoContentEditable(target: HTMLElement, text: string): void {
  // Clear existing content if replacing
  if (text !== '' && target.textContent) {
    // Select all and replace
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(target);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  
  // Insert new text
  if (target.getAttribute('contenteditable') === 'true') {
    // For contenteditable elements
    document.execCommand('insertText', false, text);
  } else {
    // Fallback for other input types
    target.textContent = text;
  }
}

/**
 * Triggers LinkedIn-specific events for text insertion
 */
function triggerLinkedInEvents(target: HTMLElement, text: string): void {
  // Trigger input events for LinkedIn's listeners
  const inputEvent = new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    data: text,
  });
  target.dispatchEvent(inputEvent);
  
  // Trigger change event
  const changeEvent = new Event('change', {
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(changeEvent);
  
  // Trigger LinkedIn-specific events if needed
  const customEvent = new CustomEvent('linkedin:textchange', {
    bubbles: true,
    detail: { text, target },
  });
  target.dispatchEvent(customEvent);
}

/**
 * Copies text from target element
 */
function copyTextFromTarget(target: HTMLElement): void {
  try {
    const text = target.textContent ?? '';
    navigator.clipboard.writeText(text).then(() => {
      console.log('Text copied to clipboard');
    }).catch(error => {
      console.warn('Failed to copy text to clipboard:', error);
    });
  } catch (error) {
    console.error('Failed to copy text from LinkedIn target:', error);
  }
}

/**
 * Sets up cleanup when target element is removed
 */
function setupTargetCleanup(target: HTMLElement, keyboard: HTMLElement): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of Array.from(mutation.removedNodes)) {
          if (node === target || (node as Element).contains?.(target)) {
            DOMUtils.safeRemoveElement(keyboard);
            injectionState.injectedElements.delete(target);
            observer.disconnect();
            return;
          }
        }
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Tries immediate injection for existing elements
 */
function tryImmediateInjection(): void {
  setTimeout(() => {
    const existingTargets = findComposeTargets(document.body);
    for (const target of existingTargets) {
      if (shouldInjectKeyboard(target)) {
        injectKeyboardForTarget(target);
      }
    }
  }, 150);
}

/**
 * Injects LinkedIn-specific styles
 */
function injectLinkedInStyles(): void {
  const style = document.createElement('style');
  style.setAttribute('data-hypertweet-styles', 'linkedin');
  
  const theme = LinkedInDOM.detectTheme();
  
  style.textContent = `
    .hypertweet-keyboard-container {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
      font-size: 14px;
      line-height: 1.42857;
      transition: all 200ms ease-in-out;
    }
    
    .hypertweet-keyboard-container .hypertweet-button {
      background-color: ${theme.backgroundColor};
      border: 1px solid ${theme.borderColor};
      color: ${theme.textColor};
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms ease-in-out;
    }
    
    .hypertweet-keyboard-container .hypertweet-button:hover {
      background-color: ${theme.hoverColor};
      border-color: ${theme.accentColor};
    }
    
    .hypertweet-keyboard-container .hypertweet-button:active {
      background-color: ${theme.focusColor};
      transform: scale(0.98);
    }
    
    .hypertweet-keyboard-container .hypertweet-button.primary {
      background-color: ${theme.accentColor};
      color: white;
      border-color: ${theme.accentColor};
    }
    
    .hypertweet-keyboard-container .hypertweet-button.primary:hover {
      background-color: ${theme.accentColor}dd;
    }
    
    /* LinkedIn-specific responsive adjustments */
    @media (max-width: 768px) {
      .hypertweet-keyboard-container {
        font-size: 13px;
        padding: 8px;
        margin: 4px 0;
      }
      
      .hypertweet-keyboard-container .hypertweet-button {
        padding: 6px 12px;
        font-size: 12px;
      }
    }
    
    /* LinkedIn modal adjustments */
    .artdeco-modal .hypertweet-keyboard-container {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
    }
    
    /* LinkedIn comment adjustments */
    .comments-comment-box__form .hypertweet-keyboard-container {
      margin-left: 8px;
      border-radius: 4px;
    }
    
    /* LinkedIn message adjustments */
    .msg-form__container .hypertweet-keyboard-container {
      border-radius: 20px;
      padding: 8px 16px;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .hypertweet-keyboard-container,
      .hypertweet-keyboard-container .hypertweet-button {
        transition: none;
      }
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Cleans up all injected elements
 */
function cleanupAllInjections(): void {
  // Remove all injected keyboards
  const keyboards = document.querySelectorAll('[data-hypertweet-injection="true"]');
  for (const keyboard of Array.from(keyboards)) {
    DOMUtils.safeRemoveElement(keyboard as HTMLElement);
  }
  
  // Clear state
  injectionState.injectedElements.clear();
  
  // Stop observation
  if (injectionState.observerId) {
    MutationObserverManager.stopObserving(injectionState.observerId);
    injectionState.observerId = undefined;
  }
}

/**
 * Shutdown function for cleanup
 */
export function shutdownLinkedInInjection(): void {
  cleanupAllInjections();
  injectionState = {
    isInjecting: false,
    styleInjected: false,
    injectedElements: new Set(),
    lastUrl: '',
  };
}