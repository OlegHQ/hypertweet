/**
 * Reddit Injection Engine - Comprehensive Implementation
 * 
 * Complete Reddit injection system supporting both new Reddit (redesign) and old Reddit.
 * Uses updated selectors and improved targeting for all Reddit compose contexts.
 * Uses the existing BaseKeyboard component with enhanced Reddit-specific targeting.
 */

import { createRoot } from 'react-dom/client';
import { BaseKeyboard } from '../../components/KeyboardUI/BaseKeyboard.js';
import { MutationObserverManager } from '../mutationObserver.js';
import { DOMUtils } from '../domUtils.js';
import { 
  RedditSelectorValidator, 
  REDDIT_COMMENT_SELECTORS, 
  REDDIT_POST_SELECTORS,
  REDDIT_OLD_COMMENT_SELECTORS,
  REDDIT_OLD_POST_SELECTORS,
  REDDIT_MESSAGE_SELECTORS,
  REDDIT_REPLY_SELECTORS
} from './RedditSelectors.js';
import { 
  RedditDOM, 
  type RedditTheme, 
  type RedditComposeContext 
} from './RedditDOM.js';
import { createPlatformDetectionError } from '../types.js';

/**
 * Reddit injection state management
 */
interface RedditInjectionState {
  isInjecting: boolean;
  styleInjected: boolean;
  observerId?: string;
  injectedElements: Set<HTMLElement>;
  lastUrl: string;
  retryTimeouts: Set<NodeJS.Timeout>;
  currentRedditVersion: 'new' | 'old' | 'mobile';
}

/**
 * Global state for Reddit injection
 */
let injectionState: RedditInjectionState = {
  isInjecting: false,
  styleInjected: false,
  injectedElements: new Set(),
  lastUrl: '',
  retryTimeouts: new Set(),
  currentRedditVersion: 'new',
};

/**
 * Main Reddit injection function
 */
export function injectRedditKeyboard(): void {
  // Detect Reddit version early
  injectionState.currentRedditVersion = detectRedditVersion();
  
  setupNavigationWatcher();
  startRedditObservation();
}

/**
 * Sets up Reddit page navigation watching for cleanup
 */
function setupNavigationWatcher(): void {
  const currentUrl = window.location.href;
  injectionState.lastUrl = currentUrl;
  
  // Watch for URL changes in Reddit SPA
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
  
  // Reddit-specific navigation events
  window.addEventListener('load', handlePageLoad);
  document.addEventListener('DOMContentLoaded', handlePageLoad);
}

/**
 * Handles navigation changes and cleanup
 */
function handleNavigationChange(): void {
  const newUrl = window.location.href;
  if (newUrl !== injectionState.lastUrl) {
    injectionState.lastUrl = newUrl;
    
    // Clear any pending retries
    clearRetryTimeouts();
    
    // Clean up existing injections
    cleanupAllInjections();
    
    // Update Reddit version detection
    injectionState.currentRedditVersion = detectRedditVersion();
    
    // Restart observation after a delay for new page to load
    // Reddit can be slow to load, especially old Reddit
    const delay = injectionState.currentRedditVersion === 'old' ? 500 : 300;
    setTimeout(startRedditObservation, delay);
  }
}

/**
 * Handles page load events
 */
function handlePageLoad(): void {
  setTimeout(() => {
    if (!injectionState.observerId) {
      startRedditObservation();
    }
  }, 1000);
}

/**
 * Starts Reddit-specific DOM observation
 */
function startRedditObservation(): void {
  // Stop any existing observer
  if (injectionState.observerId) {
    MutationObserverManager.stopObserving(injectionState.observerId);
  }
  
  // Different observation strategies for different Reddit versions
  const observationConfig = getObservationConfig();
  
  const observationResult = MutationObserverManager.startObserving(
    observationConfig,
    handleRedditMutations
  );
  
  if (observationResult.success) {
    injectionState.observerId = observationResult.observerId;
  }
  
  // Also try immediate injection for any existing elements
  tryImmediateInjection();
}

/**
 * Gets observation configuration based on Reddit version
 */
function getObservationConfig() {
  if (injectionState.currentRedditVersion === 'old') {
    return {
      platform: 'reddit' as const,
      target: document.body,
      options: {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'contenteditable'],
      },
      debounceMs: 300,
      priority: 'medium' as const,
    };
  } else {
    return {
      platform: 'reddit' as const,
      target: document.body,
      options: {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-testid', 'contenteditable', 'class'],
      },
      debounceMs: 200,
      priority: 'high' as const,
    };
  }
}

/**
 * Handles Reddit DOM mutations
 */
function handleRedditMutations(mutations: readonly MutationRecord[]): void {
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
      if (mutation.attributeName === 'data-testid') {
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
      // Reddit can be slow to load, retry with delay if needed
      attemptInjectionWithRetry(target);
    }
  }
}

/**
 * Attempts injection with retry logic for Reddit's dynamic loading
 */
function attemptInjectionWithRetry(target: HTMLElement, attempt: number = 1): void {
  const maxAttempts = 3;
  
  if (shouldInjectKeyboard(target) && RedditSelectorValidator.isReadyForInjection(target)) {
    injectKeyboardForTarget(target);
  } else if (attempt < maxAttempts) {
    // Retry with exponential backoff
    const delay = attempt * 500;
    const timeoutId = setTimeout(() => {
      injectionState.retryTimeouts.delete(timeoutId);
      attemptInjectionWithRetry(target, attempt + 1);
    }, delay);
    
    injectionState.retryTimeouts.add(timeoutId);
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
  
  // Find compose areas with version-specific selectors
  const selectorConfigs = getSelectorConfigsForVersion();

  for (const config of selectorConfigs) {
    // Try primary selector
    const primaryTargets = element.querySelectorAll(config.primary);
    for (const target of Array.from(primaryTargets)) {
      if (RedditSelectorValidator.validateComposeArea(target)) {
        targets.push(target as HTMLElement);
      }
    }
    
    // Try fallback selectors if no primary matches found
    if (targets.length === 0) {
      for (const fallback of config.fallbacks) {
        const fallbackTargets = element.querySelectorAll(fallback);
        for (const target of Array.from(fallbackTargets)) {
          if (RedditSelectorValidator.validateComposeArea(target)) {
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
 * Gets selector configurations based on Reddit version
 */
function getSelectorConfigsForVersion() {
  if (injectionState.currentRedditVersion === 'old') {
    return [
      REDDIT_OLD_COMMENT_SELECTORS,
      REDDIT_OLD_POST_SELECTORS,
    ];
  } else {
    return [
      REDDIT_COMMENT_SELECTORS,
      REDDIT_POST_SELECTORS,
      REDDIT_REPLY_SELECTORS,
      REDDIT_MESSAGE_SELECTORS,
    ];
  }
}

/**
 * Checks if an element is a compose element
 */
function isComposeElement(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  
  // New Reddit web components
  if (tagName.includes('shreddit') && tagName.includes('composer')) {
    return true;
  }
  
  // New Reddit contenteditable
  if (element.getAttribute('contenteditable') === 'true') {
    const hasNewRedditContext = 
      element.closest('shreddit-composer') !== null ||
      element.closest('[data-testid*="submission-form"]') !== null ||
      element.closest('.CommentBox') !== null ||
      element.closest('.RichTextEditor-root') !== null;
    
    if (hasNewRedditContext) {
      return true;
    }
  }
  
  // Old Reddit textareas
  if (tagName === 'textarea') {
    const hasOldRedditContext = 
      element.getAttribute('name') === 'text' ||
      element.closest('.usertext-edit') !== null ||
      element.closest('form.usertext') !== null;
    
    if (hasOldRedditContext) {
      return true;
    }
  }
  
  return false;
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
  if (!RedditSelectorValidator.validateComposeArea(target)) {
    return false;
  }
  
  // Check if target is ready (not in loading state)
  if (!RedditSelectorValidator.isReadyForInjection(target)) {
    return false;
  }
  
  // Check if target is in supported context
  const context = RedditSelectorValidator.getComposeContext(target);
  if (context === 'unknown') {
    return false;
  }
  
  // Check if we're on a supported page
  if (!isOnSupportedPage()) {
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
 * Checks if we're on a Reddit page that supports injection
 */
function isOnSupportedPage(): boolean {
  const pathname = window.location.pathname;
  
  // Support post pages (comments)
  if (pathname.includes('/comments/')) {
    return true;
  }
  
  // Support submit pages
  if (pathname.includes('/submit')) {
    return true;
  }
  
  // Support subreddit pages with compose forms
  if (pathname.match(/\/r\/[^/]+\/?$/) && 
      document.querySelector('shreddit-composer, textarea[name="text"]')) {
    return true;
  }
  
  // Support message/chat pages
  if (pathname.includes('/message/') || pathname.includes('/chat/')) {
    return true;
  }
  
  return false;
}

/**
 * Injects keyboard for a specific target
 */
function injectKeyboardForTarget(target: HTMLElement): void {
  injectionState.isInjecting = true;
  
  try {
    // Inject styles if not already done
    if (!injectionState.styleInjected) {
      injectRedditStyles();
      injectionState.styleInjected = true;
    }
    
    // Analyze compose context
    const context = RedditDOM.analyzeComposeContext(target);
    const theme = RedditDOM.detectTheme();
    
    // Create keyboard element
    const keyboard = createRedditKeyboard(target, context, theme);
    
    // Position keyboard
    const positioning = RedditDOM.positionKeyboard(keyboard, context, theme);
    
    if (positioning.success) {
      // Mark target as injected
      injectionState.injectedElements.add(target);
      
      // Set up cleanup when target is removed
      setupTargetCleanup(target, keyboard);
      
      // Integrate with compose area
      RedditDOM.integrateWithCompose(keyboard, target, context);
      
      console.log('✅ Reddit keyboard injected successfully', { 
        context: context.type, 
        version: context.redditVersion, 
        subreddit: context.subreddit,
        target 
      });
    } else {
      console.warn('⚠️ Reddit keyboard positioning failed', positioning.error);
      DOMUtils.safeRemoveElement(keyboard);
    }
    
  } catch (error) {
    console.error('❌ Reddit keyboard injection failed:', error);
  } finally {
    injectionState.isInjecting = false;
  }
}

/**
 * Creates a Reddit-themed keyboard element
 */
function createRedditKeyboard(
  target: HTMLElement, 
  context: RedditComposeContext, 
  theme: RedditTheme
): HTMLElement {
  // Create container
  const container = document.createElement('div');
  container.className = 'hypertweet-keyboard-container';
  container.setAttribute('data-hypertweet-injection', 'true');
  container.setAttribute('data-platform', 'reddit');
  
  // Apply Reddit-specific styling
  const styles = RedditDOM.getRedditStyling(theme, context);
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
      platform: 'reddit',
      targetElement: {
        element: target,
        platform: 'reddit',
        textArea: target,
        container: context.container,
      },
      visible: true,
      onToneSelect: async ({ tone, mode, targetElement }) => {
        // TODO: Generate text based on tone and mode
        await Promise.resolve();
        const generatedText = context.supportsMarkdown 
          ? `Sample **${tone}** text for Reddit with *markdown*`
          : `Sample ${tone} text for Reddit`;
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
  context: RedditComposeContext
): void {
  try {
    // Focus the target
    target.focus();
    
    // Handle different Reddit editor types
    if (context.redditVersion === 'old' && target.tagName.toLowerCase() === 'textarea') {
      insertTextIntoTextarea(target as HTMLTextAreaElement, text);
    } else if (target.getAttribute('contenteditable') === 'true') {
      insertTextIntoContentEditable(target, text);
    } else {
      // Fallback
      insertTextIntoContentEditable(target, text);
    }
    
    // Trigger Reddit-specific events
    triggerRedditEvents(target, text, context);
    
    // Keep focus on target
    target.focus();
    
  } catch (error) {
    console.error('Failed to insert text into Reddit target:', error);
  }
}

/**
 * Inserts text into old Reddit textarea
 */
function insertTextIntoTextarea(textarea: HTMLTextAreaElement, text: string): void {
  const startPos = textarea.selectionStart;
  const endPos = textarea.selectionEnd;
  const currentValue = textarea.value;
  
  if (text === '') {
    // Clear all text
    textarea.value = '';
  } else {
    // Insert at cursor position or replace selection
    textarea.value = currentValue.substring(0, startPos) + text + currentValue.substring(endPos);
    
    // Set cursor after inserted text
    const newPos = startPos + text.length;
    textarea.setSelectionRange(newPos, newPos);
  }
}

/**
 * Inserts text into new Reddit contenteditable element
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
 * Triggers Reddit-specific events for text insertion
 */
function triggerRedditEvents(target: HTMLElement, text: string, context: RedditComposeContext): void {
  // Trigger input events for Reddit's listeners
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
  
  // For old Reddit textareas
  if (target.tagName.toLowerCase() === 'textarea') {
    const keyupEvent = new KeyboardEvent('keyup', {
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(keyupEvent);
  }
  
  // Trigger Reddit-specific events if needed
  const customEvent = new CustomEvent('reddit:textchange', {
    bubbles: true,
    detail: { text, target, context },
  });
  target.dispatchEvent(customEvent);
}

/**
 * Copies text from target element
 */
function copyTextFromTarget(target: HTMLElement): void {
  try {
    let text = '';
    
    if (target.tagName.toLowerCase() === 'textarea') {
      text = (target as HTMLTextAreaElement).value;
    } else {
      text = target.textContent ?? '';
    }
    
    navigator.clipboard.writeText(text).then(() => {
      console.log('Text copied to clipboard');
    }).catch(error => {
      console.warn('Failed to copy text to clipboard:', error);
    });
  } catch (error) {
    console.error('Failed to copy text from Reddit target:', error);
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
  // Delay based on Reddit version
  const delay = injectionState.currentRedditVersion === 'old' ? 200 : 150;
  
  setTimeout(() => {
    const existingTargets = findComposeTargets(document.body);
    for (const target of existingTargets) {
      if (shouldInjectKeyboard(target)) {
        attemptInjectionWithRetry(target);
      }
    }
  }, delay);
}

/**
 * Detects Reddit version
 */
function detectRedditVersion(): 'new' | 'old' | 'mobile' {
  // Check for new Reddit indicators
  if (document.querySelector('shreddit-app') ||
      document.querySelector('[data-testid*="post"]') ||
      document.querySelector('.App__container')) {
    return window.innerWidth < 768 ? 'mobile' : 'new';
  }

  // Check for old Reddit indicators
  if (document.querySelector('#siteTable') ||
      document.querySelector('.content[role="main"]') ||
      document.querySelector('.thing.link')) {
    return 'old';
  }

  // Default to new Reddit
  return window.innerWidth < 768 ? 'mobile' : 'new';
}

/**
 * Injects Reddit-specific styles
 */
function injectRedditStyles(): void {
  const style = document.createElement('style');
  style.setAttribute('data-hypertweet-styles', 'reddit');
  
  const theme = RedditDOM.detectTheme();
  
  style.textContent = `
    .hypertweet-keyboard-container {
      font-family: ${theme.version === 'old' 
        ? 'Verdana, Geneva, sans-serif' 
        : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'};
      font-size: ${theme.version === 'old' ? '12px' : '14px'};
      line-height: ${theme.version === 'old' ? '1.3' : '1.5'};
      transition: all 200ms ease-in-out;
    }
    
    .hypertweet-keyboard-container .hypertweet-button {
      background-color: ${theme.backgroundColor};
      border: 1px solid ${theme.borderColor};
      color: ${theme.textColor};
      border-radius: ${theme.version === 'old' ? '3px' : '4px'};
      padding: ${theme.version === 'old' ? '4px 8px' : '6px 12px'};
      font-size: ${theme.version === 'old' ? '11px' : '13px'};
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
    
    /* Reddit version-specific styles */
    [data-old-reddit="true"] .hypertweet-keyboard-container {
      font-family: Verdana, Geneva, sans-serif;
      font-size: 12px;
      border: 1px solid #c7c7c7;
      border-radius: 3px;
    }
    
    [data-new-reddit="true"] .hypertweet-keyboard-container {
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    /* Reddit mobile adjustments */
    @media (max-width: 768px) {
      .hypertweet-keyboard-container {
        font-size: 13px;
        padding: 8px;
        margin: 4px 0;
      }
      
      .hypertweet-keyboard-container .hypertweet-button {
        padding: 6px 10px;
        font-size: 12px;
      }
    }
    
    /* Dark theme adjustments */
    ${theme.isDark ? `
      .hypertweet-keyboard-container {
        background-color: #1a1a1b;
        border-color: #343536;
        color: #d7dadc;
      }
    ` : ''}
    
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
 * Clears all retry timeouts
 */
function clearRetryTimeouts(): void {
  for (const timeoutId of injectionState.retryTimeouts) {
    clearTimeout(timeoutId);
  }
  injectionState.retryTimeouts.clear();
}

/**
 * Cleans up all injected elements
 */
function cleanupAllInjections(): void {
  // Clear retry timeouts
  clearRetryTimeouts();
  
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
export function shutdownRedditInjection(): void {
  cleanupAllInjections();
  injectionState = {
    isInjecting: false,
    styleInjected: false,
    injectedElements: new Set(),
    lastUrl: '',
    retryTimeouts: new Set(),
    currentRedditVersion: 'new',
  };
}