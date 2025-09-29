/**
 * Twitter/X Injection Engine - Fixed Implementation
 * 
 * Fixes the broken Twitter injection by using updated selectors and improved targeting.
 * Uses the existing Panel component with enhanced Twitter-specific targeting.
 */

import { createRoot } from 'react-dom/client';
import { BaseKeyboard } from '../../components/KeyboardUI/BaseKeyboard.js';
import { MutationObserverManager } from '../mutationObserver.js';
import { DOMUtils } from '../domUtils.js';
import { TwitterSelectorValidator, TWITTER_COMPOSE_SELECTORS, TWITTER_REPLY_SELECTORS } from './TwitterSelectors.js';
import { TwitterDOM, type TwitterTheme, type TwitterComposeContext } from './TwitterDOM.js';
import { createPlatformDetectionError } from '../types.js';

/**
 * Twitter injection state management
 */
interface TwitterInjectionState {
  isInjecting: boolean;
  styleInjected: boolean;
  observerId?: string;
  injectedElements: Set<HTMLElement>;
  lastUrl: string;
}

/**
 * Global state for Twitter injection
 */
let injectionState: TwitterInjectionState = {
  isInjecting: false,
  styleInjected: false,
  injectedElements: new Set(),
  lastUrl: '',
};

/**
 * Main Twitter injection function - Fixes broken implementation
 */
export function injectTwitterKeyboard(): void {
  setupNavigationWatcher();
  startTwitterObservation();
}

/**
 * Sets up Twitter page navigation watching for cleanup
 */
function setupNavigationWatcher(): void {
  const currentUrl = window.location.href;
  injectionState.lastUrl = currentUrl;
  
  // Watch for URL changes in Twitter SPA
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
    setTimeout(startTwitterObservation, 250);
  }
}

/**
 * Starts Twitter-specific DOM observation
 */
function startTwitterObservation(): void {
  // Stop any existing observer
  if (injectionState.observerId) {
    MutationObserverManager.stopObserving(injectionState.observerId);
  }
  
  // Start new observer for Twitter compose areas
  const observationResult = MutationObserverManager.startObserving(
    {
      platform: 'twitter',
      target: document.body,
      options: {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-testid', 'contenteditable', 'aria-expanded'],
      },
      debounceMs: 150,
      priority: 'high',
    },
    handleTwitterMutations
  );
  
  if (observationResult.success) {
    injectionState.observerId = observationResult.observerId;
  }
  
  // Also try immediate injection for any existing elements
  tryImmediateInjection();
}

/**
 * Handles Twitter DOM mutations
 */
function handleTwitterMutations(mutations: readonly MutationRecord[]): void {
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
  const primaryTargets = element.querySelectorAll(TWITTER_COMPOSE_SELECTORS.primary);
  for (const target of Array.from(primaryTargets)) {
    if (TwitterSelectorValidator.validateComposeArea(target)) {
      targets.push(target as HTMLElement);
    }
  }
  
  // Try fallback selectors if no primary matches
  if (targets.length === 0) {
    for (const fallback of TWITTER_COMPOSE_SELECTORS.fallbacks) {
      const fallbackTargets = element.querySelectorAll(fallback);
      for (const target of Array.from(fallbackTargets)) {
        if (TwitterSelectorValidator.validateComposeArea(target)) {
          targets.push(target as HTMLElement);
        }
      }
      if (targets.length > 0) break; // Stop after finding valid targets
    }
  }
  
  // Also check for reply contexts
  const replyTargets = element.querySelectorAll(TWITTER_REPLY_SELECTORS.primary);
  for (const target of Array.from(replyTargets)) {
    if (TwitterSelectorValidator.validateComposeArea(target) && 
        TwitterSelectorValidator.getComposeContext(target) === 'reply') {
      targets.push(target as HTMLElement);
    }
  }
  
  return targets;
}

/**
 * Checks if an element is a compose element
 */
function isComposeElement(element: HTMLElement): boolean {
  return element.matches('[data-testid="tweetTextarea_0"]') ||
         (element.getAttribute('contenteditable') === 'true' && 
          element.hasAttribute('data-text')) ||
         element.matches('[role="textbox"][contenteditable="true"]');
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
  if (!TwitterSelectorValidator.validateComposeArea(target)) {
    return false;
  }
  
  // Check if target is in supported context
  const context = TwitterSelectorValidator.getComposeContext(target);
  if (context === 'unknown') {
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
      injectTwitterStyles();
      injectionState.styleInjected = true;
    }
    
    // Analyze compose context
    const context = TwitterDOM.analyzeComposeContext(target);
    const theme = TwitterDOM.detectTheme();
    
    // Create keyboard element
    const keyboard = createTwitterKeyboard(target, context, theme);
    
    // Position keyboard
    const positioning = TwitterDOM.positionKeyboard(keyboard, context, theme);
    
    if (positioning.success) {
      // Mark target as injected
      injectionState.injectedElements.add(target);
      
      // Set up cleanup when target is removed
      setupTargetCleanup(target, keyboard);
      
      // Integrate with compose area
      TwitterDOM.integrateWithCompose(keyboard, target, context);
      
      console.log('✅ Twitter keyboard injected successfully', { context: context.type, target });
    } else {
      console.warn('⚠️ Twitter keyboard positioning failed', positioning.error);
      DOMUtils.safeRemoveElement(keyboard);
    }
    
  } catch (error) {
    console.error('❌ Twitter keyboard injection failed:', error);
  } finally {
    injectionState.isInjecting = false;
  }
}

/**
 * Creates a Twitter-themed keyboard element
 */
function createTwitterKeyboard(
  target: HTMLElement, 
  context: TwitterComposeContext, 
  theme: TwitterTheme
): HTMLElement {
  // Create container
  const container = document.createElement('div');
  container.className = 'hypertweet-keyboard-container';
  container.setAttribute('data-hypertweet-injection', 'true');
  container.setAttribute('data-platform', 'twitter');
  
  // Apply Twitter-specific styling
  const styles = TwitterDOM.getTwitterStyling(theme, context);
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
      platform: 'twitter',
      targetElement: {
        element: target,
        platform: 'twitter',
        textArea: target,
        container: context.container,
      },
      visible: true,
      onToneSelect: async ({ tone, mode, targetElement }) => {
        // TODO: Generate text based on tone and mode
        await Promise.resolve();
        const generatedText = `Sample ${tone} text`;
        insertTextIntoTarget(target, generatedText, context);
      },
      onQuickAction: async ({ action, targetElement }) => {
        await Promise.resolve();
        switch (action) {
          case 'clear':
            insertTextIntoTarget(target, '', context);
            break;
          case 'copy':
            // TODO: Copy current text to clipboard
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
  context: TwitterComposeContext
): void {
  try {
    // Focus the target
    target.focus();
    
    // Clear existing content
    if (target.textContent) {
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
    
    // Trigger input events for Twitter's listeners
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      data: text,
    });
    target.dispatchEvent(inputEvent);
    
    // Keep focus on target
    target.focus();
    
  } catch (error) {
    console.error('Failed to insert text into Twitter target:', error);
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
  }, 100);
}

/**
 * Injects Twitter-specific styles
 */
function injectTwitterStyles(): void {
  const style = document.createElement('style');
  style.setAttribute('data-hypertweet-styles', 'twitter');
  
  const theme = TwitterDOM.detectTheme();
  
  style.textContent = `
    .hypertweet-keyboard-container {
      font-family: TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 20px;
      transition: all 200ms ease-in-out;
    }
    
    .hypertweet-keyboard-container .hypertweet-button {
      background-color: ${theme.backgroundColor};
      border: 1px solid ${theme.borderColor};
      color: ${theme.textColor};
      border-radius: 20px;
      padding: 6px 16px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms ease-in-out;
    }
    
    .hypertweet-keyboard-container .hypertweet-button:hover {
      background-color: ${theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
      border-color: ${theme.accentColor};
    }
    
    .hypertweet-keyboard-container .hypertweet-button:active {
      background-color: ${theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
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
export function shutdownTwitterInjection(): void {
  cleanupAllInjections();
  injectionState = {
    isInjecting: false,
    styleInjected: false,
    injectedElements: new Set(),
    lastUrl: '',
  };
}