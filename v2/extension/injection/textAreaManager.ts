/**
 * Text Area Manager - Platform-Agnostic Text Area Management
 *
 * Provides comprehensive text area detection, management, and interaction
 * utilities that work across all supported platforms (Twitter, LinkedIn, Reddit).
 */

import type { Platform } from './types.js';
import { DOMUtils } from './domUtils.js';
import { PlatformConfigManager } from './platformConfig.js';

/**
 * Text area types across different platforms
 */
export type TextAreaType =
  | 'input'
  | 'textarea'
  | 'contenteditable'
  | 'quill'
  | 'draft'
  | 'rich-text'
  | 'markdown';

/**
 * Text area state for tracking and management
 */
export interface TextAreaState {
  readonly id: string;
  readonly element: HTMLElement;
  readonly type: TextAreaType;
  readonly platform: Platform;
  readonly isActive: boolean;
  readonly isFocused: boolean;
  readonly hasContent: boolean;
  readonly characterCount: number;
  readonly characterLimit: number | null;
  readonly selectionStart: number;
  readonly selectionEnd: number;
  readonly content: string;
  readonly undoStack: readonly string[];
  readonly redoStack: readonly string[];
  readonly lastModified: number;
}

/**
 * Text area capabilities for different editor types
 */
export interface TextAreaCapabilities {
  readonly supportsHTML: boolean;
  readonly supportsMarkdown: boolean;
  readonly supportsRichText: boolean;
  readonly supportsUndo: boolean;
  readonly supportsSelection: boolean;
  readonly supportsCursor: boolean;
  readonly supportsMultiline: boolean;
  readonly hasCharacterLimit: boolean;
  readonly allowsFormatting: boolean;
}

/**
 * Text area detection configuration
 */
export interface TextAreaDetectionConfig {
  readonly platform: Platform;
  readonly includeInactive: boolean;
  readonly includeReadonly: boolean;
  readonly includeDisabled: boolean;
  readonly maxResults: number;
  readonly timeout: number;
}

/**
 * Text area detection result
 */
export interface TextAreaDetectionResult {
  readonly success: boolean;
  readonly textAreas: readonly TextAreaState[];
  readonly activeTextArea: TextAreaState | null;
  readonly detectionTime: number;
  readonly error: Error | null;
}

/**
 * Text area event types
 */
export type TextAreaEventType =
  | 'focus'
  | 'blur'
  | 'input'
  | 'change'
  | 'keydown'
  | 'keyup'
  | 'paste'
  | 'cut'
  | 'copy'
  | 'select';

/**
 * Text area event listener
 */
export interface TextAreaEventListener {
  readonly type: TextAreaEventType;
  readonly handler: (event: Event, textArea: TextAreaState) => void;
  readonly options?: AddEventListenerOptions;
}

/**
 * Text area validation result
 */
export interface TextAreaValidationResult {
  readonly isValid: boolean;
  readonly isWritable: boolean;
  readonly isVisible: boolean;
  readonly isInViewport: boolean;
  readonly capabilities: TextAreaCapabilities;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

/**
 * Text area manager for cross-platform text area operations
 */
export class TextAreaManager {
  private static instance: TextAreaManager;
  private readonly textAreas = new Map<string, TextAreaState>();
  private readonly eventListeners = new Map<
    string,
    readonly TextAreaEventListener[]
  >();
  private readonly wrappedHandlers = new Map<
    string,
    Map<TextAreaEventListener, EventListener>
  >();
  private readonly observers = new Map<string, MutationObserver>();
  private activeTextAreaId: string | null = null;
  private readonly undoStacks = new Map<string, string[]>();
  private readonly redoStacks = new Map<string, string[]>();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TextAreaManager {
    if (!TextAreaManager.instance) {
      TextAreaManager.instance = new TextAreaManager();
    }
    return TextAreaManager.instance;
  }

  /**
   * Detect all text areas on the current page
   */
  public detectTextAreas(
    config: Partial<TextAreaDetectionConfig> = {}
  ): TextAreaDetectionResult {
    const startTime = performance.now();
    const finalConfig: TextAreaDetectionConfig = {
      platform: this.detectCurrentPlatform(),
      includeInactive: false,
      includeReadonly: false,
      includeDisabled: false,
      maxResults: 10,
      timeout: 5000,
      ...config,
    };

    try {
      const textAreas = this.findTextAreas(finalConfig);
      const activeTextArea =
        textAreas.find(ta => ta.isActive && ta.isFocused) ?? null;

      // Update internal state
      for (const textArea of textAreas) {
        this.textAreas.set(textArea.id, textArea);
        if (textArea.isActive && textArea.isFocused) {
          this.activeTextAreaId = textArea.id;
        }
      }

      return {
        success: true,
        textAreas,
        activeTextArea,
        detectionTime: performance.now() - startTime,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        textAreas: [],
        activeTextArea: null,
        detectionTime: performance.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Get text area by ID
   */
  public getTextArea(id: string): TextAreaState | null {
    return this.textAreas.get(id) ?? null;
  }

  /**
   * Get currently active text area
   */
  public getActiveTextArea(): TextAreaState | null {
    if (!this.activeTextAreaId) {
      return null;
    }
    return this.getTextArea(this.activeTextAreaId);
  }

  /**
   * Set active text area
   */
  public setActiveTextArea(id: string): boolean {
    const textArea = this.getTextArea(id);
    if (!textArea) {
      return false;
    }

    this.activeTextAreaId = id;
    this.focusTextArea(id);
    return true;
  }

  /**
   * Focus a text area
   */
  public focusTextArea(id: string): boolean {
    const textArea = this.getTextArea(id);
    if (!textArea) {
      return false;
    }

    try {
      textArea.element.focus();
      this.activeTextAreaId = id;
      this.updateTextAreaState(id, { isFocused: true, isActive: true });
      return true;
    } catch (error) {
      console.error('Failed to focus text area:', error);
      return false;
    }
  }

  /**
   * Blur a text area
   */
  public blurTextArea(id: string): boolean {
    const textArea = this.getTextArea(id);
    if (!textArea) {
      return false;
    }

    try {
      textArea.element.blur();
      this.updateTextAreaState(id, { isFocused: false });
      if (this.activeTextAreaId === id) {
        this.activeTextAreaId = null;
      }
      return true;
    } catch (error) {
      console.error('Failed to blur text area:', error);
      return false;
    }
  }

  /**
   * Get text content from text area
   */
  public getContent(id: string): string | null {
    const textArea = this.getTextArea(id);
    if (!textArea) {
      return null;
    }

    return this.extractContent(textArea.element, textArea.type);
  }

  /**
   * Set text content in text area
   */
  public setContent(id: string, content: string, preserveUndo = true): boolean {
    const textArea = this.getTextArea(id);
    if (!textArea) {
      return false;
    }

    if (preserveUndo) {
      this.saveToUndoStack(id, textArea.content);
    }

    const success = this.insertContent(
      textArea.element,
      content,
      textArea.type,
      'replace'
    );
    if (success) {
      this.updateTextAreaState(id, {
        content,
        hasContent: content.length > 0,
        characterCount: content.length,
        lastModified: Date.now(),
      });
    }

    return success;
  }

  /**
   * Insert content at cursor position
   */
  public insertAtCursor(
    id: string,
    content: string,
    preserveUndo = true
  ): boolean {
    const textArea = this.getTextArea(id);
    if (!textArea) {
      return false;
    }

    if (preserveUndo) {
      this.saveToUndoStack(id, textArea.content);
    }

    const success = this.insertContent(
      textArea.element,
      content,
      textArea.type,
      'insert'
    );
    if (success) {
      const newContent = this.extractContent(textArea.element, textArea.type);
      this.updateTextAreaState(id, {
        content: newContent,
        hasContent: newContent.length > 0,
        characterCount: newContent.length,
        lastModified: Date.now(),
      });
    }

    return success;
  }

  /**
   * Clear text area content
   */
  public clearContent(id: string, preserveUndo = true): boolean {
    return this.setContent(id, '', preserveUndo);
  }

  /**
   * Undo last content change
   */
  public undo(id: string): boolean {
    const undoStack = this.undoStacks.get(id);
    const redoStack = this.redoStacks.get(id) ?? [];

    if (!undoStack || undoStack.length === 0) {
      return false;
    }

    const textArea = this.getTextArea(id);
    if (!textArea) {
      return false;
    }

    // Save current content to redo stack
    redoStack.push(textArea.content);
    this.redoStacks.set(id, redoStack);

    // Restore previous content
    const previousContent = undoStack.pop();
    if (previousContent === undefined) {
      return false;
    }
    this.undoStacks.set(id, undoStack);

    return this.setContent(id, previousContent, false);
  }

  /**
   * Redo last undone change
   */
  public redo(id: string): boolean {
    const redoStack = this.redoStacks.get(id);

    if (!redoStack || redoStack.length === 0) {
      return false;
    }

    const nextContent = redoStack.pop();
    if (nextContent === undefined) {
      return false;
    }
    this.redoStacks.set(id, redoStack);

    return this.setContent(id, nextContent, true);
  }

  /**
   * Get character count for text area
   */
  public getCharacterCount(id: string): number {
    const textArea = this.getTextArea(id);
    return textArea?.characterCount ?? 0;
  }

  /**
   * Get character limit for text area
   */
  public getCharacterLimit(id: string): number | null {
    const textArea = this.getTextArea(id);
    return textArea?.characterLimit ?? null;
  }

  /**
   * Check if text area is at character limit
   */
  public isAtCharacterLimit(id: string): boolean {
    const textArea = this.getTextArea(id);
    if (!textArea?.characterLimit) {
      return false;
    }
    return textArea.characterCount >= textArea.characterLimit;
  }

  /**
   * Get remaining characters
   */
  public getRemainingCharacters(id: string): number | null {
    const textArea = this.getTextArea(id);
    if (!textArea?.characterLimit) {
      return null;
    }
    return Math.max(0, textArea.characterLimit - textArea.characterCount);
  }

  /**
   * Validate text area for operations
   */
  public validateTextArea(id: string): TextAreaValidationResult {
    const textArea = this.getTextArea(id);
    if (!textArea) {
      return {
        isValid: false,
        isWritable: false,
        isVisible: false,
        isInViewport: false,
        capabilities: this.getDefaultCapabilities(),
        warnings: [],
        errors: ['Text area not found'],
      };
    }

    const element = textArea.element;
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check if element is still in DOM
    if (!document.contains(element)) {
      errors.push('Text area element is no longer in DOM');
    }

    // Check if element is visible
    const isVisible = DOMUtils.isElementVisible(element);
    if (!isVisible) {
      warnings.push('Text area is not visible');
    }

    // Check if element is in viewport
    const isInViewport = this.isElementInViewport(element);
    if (!isInViewport) {
      warnings.push('Text area is not in viewport');
    }

    // Check if element is writable
    const isWritable =
      !element.hasAttribute('readonly') &&
      !element.hasAttribute('disabled') &&
      element.getAttribute('contenteditable') !== 'false';

    if (!isWritable) {
      warnings.push('Text area is not writable');
    }

    const capabilities = this.getTextAreaCapabilities(
      textArea.type,
      textArea.platform
    );

    return {
      isValid: errors.length === 0,
      isWritable,
      isVisible,
      isInViewport,
      capabilities,
      warnings,
      errors,
    };
  }

  /**
   * Add event listener to text area
   */
  public addEventListener(
    id: string,
    listener: TextAreaEventListener
  ): boolean {
    const textArea = this.getTextArea(id);
    if (!textArea) {
      return false;
    }

    const currentListeners = this.eventListeners.get(id) ?? [];
    this.eventListeners.set(id, [...currentListeners, listener]);

    const wrappedHandler = (event: Event): void => {
      listener.handler(event, textArea);
    };

    // Store wrapped handler for later removal
    const handlerMap = this.wrappedHandlers.get(id) ?? new Map();
    handlerMap.set(listener, wrappedHandler);
    this.wrappedHandlers.set(id, handlerMap);

    textArea.element.addEventListener(
      listener.type,
      wrappedHandler,
      listener.options
    );
    return true;
  }

  /**
   * Remove event listener from text area
   */
  public removeEventListener(
    id: string,
    listener: TextAreaEventListener
  ): boolean {
    const textArea = this.getTextArea(id);
    if (!textArea) {
      return false;
    }

    const currentListeners = this.eventListeners.get(id) ?? [];
    const updatedListeners = currentListeners.filter(l => l !== listener);
    this.eventListeners.set(id, updatedListeners);

    // Get the stored wrapped handler
    const handlerMap = this.wrappedHandlers.get(id);
    const wrappedHandler = handlerMap?.get(listener);

    if (wrappedHandler && handlerMap) {
      textArea.element.removeEventListener(
        listener.type,
        wrappedHandler,
        listener.options
      );
      handlerMap.delete(listener);
      return true;
    }

    return false;
  }

  /**
   * Start monitoring text area for changes
   */
  public startMonitoring(id: string): boolean {
    const textArea = this.getTextArea(id);
    if (!textArea) {
      return false;
    }

    // Create mutation observer for content changes
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'childList' ||
          mutation.type === 'characterData'
        ) {
          this.updateTextAreaContent(id);
        }
      }
    });

    observer.observe(textArea.element, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    this.observers.set(id, observer);

    // Add input event listener
    const inputListener: TextAreaEventListener = {
      type: 'input',
      handler: () => this.updateTextAreaContent(id),
    };

    this.addEventListener(id, inputListener);
    return true;
  }

  /**
   * Stop monitoring text area
   */
  public stopMonitoring(id: string): boolean {
    const observer = this.observers.get(id);
    if (observer) {
      observer.disconnect();
      this.observers.delete(id);
    }

    // Remove event listeners
    const listeners = this.eventListeners.get(id) ?? [];
    for (const listener of listeners) {
      this.removeEventListener(id, listener);
    }

    return true;
  }

  /**
   * Cleanup resources for text area
   */
  public cleanup(id: string): void {
    this.stopMonitoring(id);
    this.textAreas.delete(id);
    this.eventListeners.delete(id);
    this.undoStacks.delete(id);
    this.redoStacks.delete(id);

    if (this.activeTextAreaId === id) {
      this.activeTextAreaId = null;
    }
  }

  /**
   * Cleanup all text areas
   */
  public cleanupAll(): void {
    const ids = Array.from(this.textAreas.keys());
    for (const id of ids) {
      this.cleanup(id);
    }
  }

  // Private helper methods

  private detectCurrentPlatform(): Platform {
    const hostname = window.location.hostname.toLowerCase();

    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter';
    }
    if (hostname.includes('linkedin.com')) {
      return 'linkedin';
    }
    if (hostname.includes('reddit.com')) {
      return 'reddit';
    }

    return 'twitter'; // Default fallback
  }

  private findTextAreas(
    config: TextAreaDetectionConfig
  ): readonly TextAreaState[] {
    const selectors = this.getPlatformSelectors(config.platform);
    const textAreas: TextAreaState[] = [];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector.query);

      for (const element of Array.from(elements)) {
        if (textAreas.length >= config.maxResults) {
          break;
        }

        const htmlElement = element as HTMLElement;

        // Validate element
        if (!this.isValidTextAreaElement(htmlElement, config)) {
          continue;
        }

        const textAreaState = this.createTextAreaState(
          htmlElement,
          selector.type,
          config.platform
        );
        textAreas.push(textAreaState);
      }
    }

    return textAreas;
  }

  private getPlatformSelectors(
    platform: Platform
  ): readonly { query: string; type: TextAreaType }[] {
    switch (platform) {
      case 'twitter':
        return [
          { query: '[data-testid="tweetTextarea_0"]', type: 'contenteditable' },
          {
            query: '[role="textbox"][contenteditable="true"]',
            type: 'contenteditable',
          },
          { query: '.DraftEditor-root', type: 'draft' },
          { query: 'textarea[placeholder*="tweet"]', type: 'textarea' },
        ];

      case 'linkedin':
        return [
          { query: '.ql-editor', type: 'quill' },
          { query: '[contenteditable="true"]', type: 'contenteditable' },
          { query: 'textarea[name="commentary"]', type: 'textarea' },
          { query: '.mentions-texteditor__content', type: 'rich-text' },
        ];

      case 'reddit':
        return [
          { query: '.DraftEditor-root', type: 'draft' },
          { query: '[contenteditable="true"]', type: 'contenteditable' },
          { query: 'textarea[name="text"]', type: 'textarea' },
          { query: '.md-editor-input', type: 'markdown' },
        ];

      default:
        return [
          { query: 'textarea', type: 'textarea' },
          { query: 'input[type="text"]', type: 'input' },
          { query: '[contenteditable="true"]', type: 'contenteditable' },
        ];
    }
  }

  private isValidTextAreaElement(
    element: HTMLElement,
    config: TextAreaDetectionConfig
  ): boolean {
    // Check if disabled
    if (!config.includeDisabled && element.hasAttribute('disabled')) {
      return false;
    }

    // Check if readonly
    if (!config.includeReadonly && element.hasAttribute('readonly')) {
      return false;
    }

    // Check if contenteditable is false
    if (element.getAttribute('contenteditable') === 'false') {
      return false;
    }

    // Check visibility
    if (!config.includeInactive && !DOMUtils.isElementVisible(element)) {
      return false;
    }

    return true;
  }

  private createTextAreaState(
    element: HTMLElement,
    type: TextAreaType,
    platform: Platform
  ): TextAreaState {
    const id = this.generateTextAreaId(element);
    const content = this.extractContent(element, type);
    const characterLimit = this.getElementCharacterLimit(element, platform);

    return {
      id,
      element,
      type,
      platform,
      isActive: document.activeElement === element,
      isFocused: document.activeElement === element,
      hasContent: content.length > 0,
      characterCount: content.length,
      characterLimit,
      selectionStart: this.getSelectionStart(element, type),
      selectionEnd: this.getSelectionEnd(element, type),
      content,
      undoStack: [],
      redoStack: [],
      lastModified: Date.now(),
    };
  }

  private generateTextAreaId(element: HTMLElement): string {
    // Try to use existing ID
    if (element.id) {
      return `textarea-${element.id}`;
    }

    // Generate based on attributes
    const attributes = [
      element.getAttribute('data-testid'),
      element.getAttribute('name'),
      element.getAttribute('class'),
      element.tagName.toLowerCase(),
    ].filter(Boolean);

    const hash = this.hashString(attributes.join('-'));
    return `textarea-${hash}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private extractContent(element: HTMLElement, type: TextAreaType): string {
    switch (type) {
      case 'input':
      case 'textarea':
        return (element as HTMLInputElement | HTMLTextAreaElement).value ?? '';

      case 'contenteditable':
      case 'quill':
      case 'draft':
      case 'rich-text':
        return element.textContent ?? '';

      case 'markdown':
        return element.textContent ?? '';

      default:
        return element.textContent ?? '';
    }
  }

  private insertContent(
    element: HTMLElement,
    content: string,
    type: TextAreaType,
    mode: 'insert' | 'replace'
  ): boolean {
    try {
      switch (type) {
        case 'input':
        case 'textarea': {
          const input = element as HTMLInputElement | HTMLTextAreaElement;
          if (mode === 'replace') {
            input.value = content;
          } else {
            const start = input.selectionStart ?? 0;
            const end = input.selectionEnd ?? 0;
            const currentValue = input.value;
            input.value =
              currentValue.slice(0, start) + content + currentValue.slice(end);
            input.selectionStart = input.selectionEnd = start + content.length;
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          break;
        }

        case 'contenteditable':
        case 'quill':
        case 'draft':
        case 'rich-text': {
          element.focus();
          if (mode === 'replace') {
            element.textContent = content;
          } else {
            document.execCommand('insertText', false, content);
          }
          element.dispatchEvent(new Event('input', { bubbles: true }));
          break;
        }

        case 'markdown': {
          if (mode === 'replace') {
            element.textContent = content;
          } else {
            // Insert at cursor position or append
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(document.createTextNode(content));
            } else {
              element.textContent = (element.textContent ?? '') + content;
            }
          }
          element.dispatchEvent(new Event('input', { bubbles: true }));
          break;
        }

        default:
          return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to insert content:', error);
      return false;
    }
  }

  private getSelectionStart(element: HTMLElement, type: TextAreaType): number {
    switch (type) {
      case 'input':
      case 'textarea':
        return (
          (element as HTMLInputElement | HTMLTextAreaElement).selectionStart ??
          0
        );

      default: {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          return range.startOffset;
        }
        return 0;
      }
    }
  }

  private getSelectionEnd(element: HTMLElement, type: TextAreaType): number {
    switch (type) {
      case 'input':
      case 'textarea':
        return (
          (element as HTMLInputElement | HTMLTextAreaElement).selectionEnd ?? 0
        );

      default: {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          return range.endOffset;
        }
        return 0;
      }
    }
  }

  private getElementCharacterLimit(
    element: HTMLElement,
    platform: Platform
  ): number | null {
    // Check for explicit maxlength attribute
    const maxLength = element.getAttribute('maxlength');
    if (maxLength) {
      const limit = parseInt(maxLength, 10);
      if (!isNaN(limit)) {
        return limit;
      }
    }

    // Platform-specific character limits
    switch (platform) {
      case 'twitter':
        return 280;
      case 'linkedin':
        return 3000;
      case 'reddit':
        return 40000;
      default:
        return null;
    }
  }

  private getTextAreaCapabilities(
    type: TextAreaType,
    platform: Platform
  ): TextAreaCapabilities {
    const baseCapabilities = {
      supportsUndo: true,
      supportsSelection: true,
      supportsCursor: true,
      supportsMultiline: true,
      hasCharacterLimit: true,
      allowsFormatting: false,
    };

    switch (type) {
      case 'input':
        return {
          ...baseCapabilities,
          supportsHTML: false,
          supportsMarkdown: false,
          supportsRichText: false,
          supportsMultiline: false,
        };

      case 'textarea':
        return {
          ...baseCapabilities,
          supportsHTML: false,
          supportsMarkdown: platform === 'reddit',
          supportsRichText: false,
        };

      case 'contenteditable':
        return {
          ...baseCapabilities,
          supportsHTML: true,
          supportsMarkdown: platform === 'reddit',
          supportsRichText: true,
          allowsFormatting: true,
        };

      case 'quill':
        return {
          ...baseCapabilities,
          supportsHTML: true,
          supportsMarkdown: false,
          supportsRichText: true,
          allowsFormatting: true,
        };

      case 'draft':
        return {
          ...baseCapabilities,
          supportsHTML: true,
          supportsMarkdown: platform === 'reddit',
          supportsRichText: true,
          allowsFormatting: true,
        };

      case 'rich-text':
        return {
          ...baseCapabilities,
          supportsHTML: true,
          supportsMarkdown: false,
          supportsRichText: true,
          allowsFormatting: true,
        };

      case 'markdown':
        return {
          ...baseCapabilities,
          supportsHTML: false,
          supportsMarkdown: true,
          supportsRichText: false,
          allowsFormatting: true,
        };

      default:
        return this.getDefaultCapabilities();
    }
  }

  private getDefaultCapabilities(): TextAreaCapabilities {
    return {
      supportsHTML: false,
      supportsMarkdown: false,
      supportsRichText: false,
      supportsUndo: false,
      supportsSelection: false,
      supportsCursor: false,
      supportsMultiline: false,
      hasCharacterLimit: false,
      allowsFormatting: false,
    };
  }

  private isElementInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  private updateTextAreaState(
    id: string,
    updates: Partial<TextAreaState>
  ): void {
    const current = this.textAreas.get(id);
    if (!current) {
      return;
    }

    const updated = { ...current, ...updates };
    this.textAreas.set(id, updated);
  }

  private updateTextAreaContent(id: string): void {
    const textArea = this.getTextArea(id);
    if (!textArea) {
      return;
    }

    const newContent = this.extractContent(textArea.element, textArea.type);
    this.updateTextAreaState(id, {
      content: newContent,
      hasContent: newContent.length > 0,
      characterCount: newContent.length,
      lastModified: Date.now(),
    });
  }

  private saveToUndoStack(id: string, content: string): void {
    const undoStack = this.undoStacks.get(id) ?? [];
    undoStack.push(content);

    // Limit undo stack size
    if (undoStack.length > 50) {
      undoStack.shift();
    }

    this.undoStacks.set(id, undoStack);

    // Clear redo stack when new content is added
    this.redoStacks.set(id, []);
  }
}

/**
 * Export singleton instance
 */
export const textAreaManager = TextAreaManager.getInstance();
