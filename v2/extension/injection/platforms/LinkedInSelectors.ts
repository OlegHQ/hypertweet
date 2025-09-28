/**
 * LinkedIn DOM Selectors - Comprehensive 2024 Implementation
 * 
 * Updated selectors for LinkedIn's current DOM structure with robust fallback strategies.
 * Supports post composition, comments, messaging, and various LinkedIn interfaces.
 */

import { createSelectorConfig, type SelectorConfig } from '../platformConfig.js';

/**
 * LinkedIn compose area selectors for post creation
 */
export const LINKEDIN_COMPOSE_SELECTORS = createSelectorConfig(
  '[data-test-ql-editor-contenteditable="true"]',
  [
    '.ql-editor[contenteditable="true"]',
    '[data-placeholder="Share your thoughts..."]',
    '.share-creation-state__text-editor [contenteditable="true"]',
    '.mentions-texteditor [contenteditable="true"]',
    '.compose-publisher__editor [contenteditable="true"]',
    '.feed-shared-update-v2__comments-container .ql-editor',
  ],
  {
    validation: {
      minWidth: 200,
      minHeight: 40,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * LinkedIn comment box selectors
 */
export const LINKEDIN_COMMENT_SELECTORS = createSelectorConfig(
  'form.comments-comment-box__form [data-test-ql-editor-contenteditable="true"]',
  [
    '.comments-comment-box__form .ql-editor[contenteditable="true"]',
    '.comments-comment-texteditor [contenteditable="true"]',
    '.comment-form .ql-editor',
    '.feed-shared-update-v2__comments-container .ql-editor[contenteditable="true"]',
    '.comments-comment-box .mentions-texteditor',
    '[data-test-id="comment-texteditor"] [contenteditable="true"]',
  ],
  {
    validation: {
      minWidth: 150,
      minHeight: 30,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * LinkedIn messaging selectors
 */
export const LINKEDIN_MESSAGE_SELECTORS = createSelectorConfig(
  '.msg-form__contenteditable[contenteditable="true"]',
  [
    '.msg-form__msg-content-container [contenteditable="true"]',
    '.messaging-compose-box [contenteditable="true"]',
    '.msg-form .ql-editor[contenteditable="true"]',
    '.msg-compose-send-button-container [contenteditable="true"]',
    '.message-editor [contenteditable="true"]',
    '.conversation-compose .ql-editor',
  ],
  {
    validation: {
      minWidth: 200,
      minHeight: 40,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * LinkedIn article/newsletter selectors
 */
export const LINKEDIN_ARTICLE_SELECTORS = createSelectorConfig(
  '.editor-content[contenteditable="true"]',
  [
    '.article-editor [contenteditable="true"]',
    '.newsletter-editor [contenteditable="true"]',
    '.long-form-editor [contenteditable="true"]',
    '.publishing-editor .ql-editor',
    '.content-editor [contenteditable="true"]',
  ],
  {
    validation: {
      minWidth: 300,
      minHeight: 100,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * LinkedIn company page selectors
 */
export const LINKEDIN_COMPANY_SELECTORS = createSelectorConfig(
  '.org-admin-share-update-form [data-test-ql-editor-contenteditable="true"]',
  [
    '.company-page-share-form .ql-editor[contenteditable="true"]',
    '.org-admin-share-form [contenteditable="true"]',
    '.organization-share-update [contenteditable="true"]',
    '.company-update-form .ql-editor',
  ],
  {
    validation: {
      minWidth: 200,
      minHeight: 40,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * LinkedIn form container selectors (for positioning)
 */
export const LINKEDIN_FORM_SELECTORS = createSelectorConfig(
  'form.comments-comment-box__form',
  [
    '.share-creation-state__share-form',
    '.msg-form__container',
    '.compose-publisher-container',
    '.feed-shared-update-v2__comments-container',
    '.share-box-feed-entry__container',
    '.compose-box-container',
    '.artdeco-card',
  ],
  {
    validation: {
      minWidth: 200,
      minHeight: 50,
      mustBeVisible: true,
    },
  }
);

/**
 * LinkedIn toolbar/button area selectors
 */
export const LINKEDIN_TOOLBAR_SELECTORS = createSelectorConfig(
  '.comments-comment-box__form .comments-comment-box-comment__main-content',
  [
    '.share-actions__primary-actions',
    '.msg-form__send-button-container',
    '.compose-publisher__actions',
    '.share-creation-state__footer',
    '.comments-comment-box-comment__button-group',
    '.editor-toolbar',
    '.artdeco-button-group',
  ],
  {
    validation: {
      minWidth: 100,
      mustBeVisible: true,
    },
  }
);

/**
 * LinkedIn navigation and modal selectors
 */
export const LINKEDIN_NAVIGATION_SELECTORS = createSelectorConfig(
  '.share-box-feed-entry',
  [
    '.scaffold-layout__main',
    '.global-nav',
    '.artdeco-modal',
    '.msg-overlay-conversation-bubble',
    '.org-admin-share-update-modal',
    '.share-creation-state-modal',
  ],
  {
    validation: {
      mustBeVisible: true,
    },
  }
);

/**
 * LinkedIn feed selectors for context detection
 */
export const LINKEDIN_FEED_SELECTORS = createSelectorConfig(
  '.feed-container-theme',
  [
    '.scaffold-finite-scroll__content',
    '.core-rail',
    '.feed-shared-update-v2',
    '.feed-outlet',
    '.content-outlet',
  ],
  {
    validation: {
      mustBeVisible: true,
    },
  }
);

/**
 * LinkedIn profile selectors
 */
export const LINKEDIN_PROFILE_SELECTORS = createSelectorConfig(
  '.profile-rail-card',
  [
    '.pv-top-card',
    '.profile-header',
    '.profile-overview',
    '.profile-rail',
    '.identity-headline',
  ],
  {
    validation: {
      mustBeVisible: true,
    },
  }
);

/**
 * Simple validation context interface for LinkedIn selectors
 */
interface SelectorValidationContext {
  readonly expectedContext?: string;
}

/**
 * LinkedIn-specific selector validation with enhanced context detection
 */
export namespace LinkedInSelectorValidator {
  
  /**
   * Validates if an element is a valid LinkedIn compose area
   */
  export function validateComposeArea(element: Element): boolean {
    if (!element || !(element instanceof HTMLElement)) {
      return false;
    }

    // Check basic editability
    if (!element.hasAttribute('contenteditable') || element.getAttribute('contenteditable') !== 'true') {
      return false;
    }

    // Check LinkedIn-specific attributes
    const hasLinkedInAttributes = 
      element.hasAttribute('data-test-ql-editor-contenteditable') ||
      element.classList.contains('ql-editor') ||
      element.closest('.share-creation-state__text-editor') !== null ||
      element.closest('.comments-comment-box__form') !== null ||
      element.closest('.msg-form__container') !== null;

    if (!hasLinkedInAttributes) {
      return false;
    }

    // Check visibility and dimensions
    const rect = element.getBoundingClientRect();
    if (rect.width < 100 || rect.height < 20) {
      return false;
    }

    // Check if element is actually visible
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }

    return true;
  }

  /**
   * Determines the compose context for a LinkedIn element
   */
  export function getComposeContext(element: Element): 'post' | 'comment' | 'message' | 'article' | 'company' | 'unknown' {
    if (!element) return 'unknown';

    // Check for post composition
    if (element.closest('.share-creation-state__text-editor') ||
        element.closest('.compose-publisher') ||
        element.closest('.share-box-feed-entry')) {
      return 'post';
    }

    // Check for comment composition
    if (element.closest('.comments-comment-box__form') ||
        element.closest('.feed-shared-update-v2__comments-container') ||
        element.closest('.comment-form')) {
      return 'comment';
    }

    // Check for messaging
    if (element.closest('.msg-form__container') ||
        element.closest('.messaging-compose-box') ||
        element.closest('.conversation-compose')) {
      return 'message';
    }

    // Check for article/newsletter
    if (element.closest('.article-editor') ||
        element.closest('.newsletter-editor') ||
        element.closest('.publishing-editor')) {
      return 'article';
    }

    // Check for company page
    if (element.closest('.org-admin-share-update-form') ||
        element.closest('.company-page-share-form') ||
        element.closest('.organization-share-update')) {
      return 'company';
    }

    return 'unknown';
  }

  /**
   * Validates selectors with LinkedIn-specific criteria
   */
  export function validateWithContext(
    element: Element,
    context: SelectorValidationContext
  ): { readonly isValid: boolean; readonly confidence: number; readonly issues: readonly string[] } {
    const issues: string[] = [];
    let confidence = 1.0;

    // Basic validation
    if (!validateComposeArea(element)) {
      issues.push('Element is not a valid LinkedIn compose area');
      confidence -= 0.5;
    }

    // Context-specific validation
    const detectedContext = getComposeContext(element);
    if (context.expectedContext && detectedContext !== context.expectedContext) {
      issues.push(`Expected context '${context.expectedContext}' but detected '${detectedContext}'`);
      confidence -= 0.3;
    }

    // Check for LinkedIn-specific DOM structure
    const hasLinkedInStructure = 
      element.closest('.scaffold-layout') !== null ||
      element.closest('.artdeco-card') !== null ||
      document.querySelector('.global-nav') !== null;

    if (!hasLinkedInStructure) {
      issues.push('LinkedIn DOM structure not detected');
      confidence -= 0.2;
    }

    // Check for Quill editor presence (common in LinkedIn)
    const isQuillEditor = 
      element.classList.contains('ql-editor') ||
      element.closest('.ql-container') !== null;

    if (!isQuillEditor && detectedContext !== 'message') {
      issues.push('Quill editor structure not found (expected for most LinkedIn editors)');
      confidence -= 0.1;
    }

    return {
      isValid: issues.length === 0 || confidence > 0.6,
      confidence: Math.max(0, confidence),
      issues,
    };
  }

  /**
   * Finds the best injection target near a compose element
   */
  export function findInjectionTarget(composeElement: HTMLElement): HTMLElement | null {
    // Try to find form container
    const formContainer = composeElement.closest('form') as HTMLElement;
    if (formContainer) {
      return formContainer;
    }

    // Try to find card container
    const cardContainer = composeElement.closest('.artdeco-card') as HTMLElement;
    if (cardContainer) {
      return cardContainer;
    }

    // Try to find share creation container
    const shareContainer = composeElement.closest('.share-creation-state') as HTMLElement;
    if (shareContainer) {
      return shareContainer;
    }

    // Try to find comment container
    const commentContainer = composeElement.closest('.comments-comment-box__form') as HTMLElement;
    if (commentContainer) {
      return commentContainer;
    }

    // Fall back to parent element
    return composeElement.parentElement;
  }

  /**
   * Checks if an element is ready for injection (not in a loading state)
   */
  export function isReadyForInjection(element: HTMLElement): boolean {
    // Check if element is in a loading state
    if (element.hasAttribute('aria-busy') && element.getAttribute('aria-busy') === 'true') {
      return false;
    }

    // Check for loading indicators
    if (element.querySelector('.loading') || element.querySelector('.spinner')) {
      return false;
    }

    // Check if form is disabled
    const form = element.closest('form');
    if (form?.hasAttribute('disabled')) {
      return false;
    }

    // Check if parent container is in transition
    const parent = element.closest('.artdeco-card, .share-creation-state');
    if (parent) {
      const style = window.getComputedStyle(parent);
      if (style.pointerEvents === 'none') {
        return false;
      }
    }

    return true;
  }
}