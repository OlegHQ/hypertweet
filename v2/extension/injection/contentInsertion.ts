/**
 * Content Insertion Utilities - Safe Content Insertion with Platform Support
 *
 * Provides safe, platform-aware content insertion that respects platform formatting,
 * character limits, and editor types while preserving existing functionality.
 */

import type { Platform } from './types.js';
import {
  textAreaManager,
  type TextAreaType,
  type TextAreaState,
  type TextAreaCapabilities,
} from './textAreaManager.js';

/**
 * Content insertion modes
 */
export type ContentInsertionMode =
  | 'replace'
  | 'append'
  | 'prepend'
  | 'insert'
  | 'smart-replace'
  | 'merge';

/**
 * Content format types
 */
export type ContentFormat =
  | 'plain-text'
  | 'html'
  | 'markdown'
  | 'rich-text'
  | 'auto';

/**
 * Content insertion options
 */
export interface ContentInsertionOptions {
  readonly mode: ContentInsertionMode;
  readonly format: ContentFormat;
  readonly preserveSelection: boolean;
  readonly preserveUndo: boolean;
  readonly respectCharacterLimit: boolean;
  readonly triggerEvents: boolean;
  readonly sanitizeContent: boolean;
  readonly formatForPlatform: boolean;
  readonly addNewlines: boolean;
  readonly trimWhitespace: boolean;
}

/**
 * Content insertion result
 */
export interface ContentInsertionResult {
  readonly success: boolean;
  readonly insertedContent: string;
  readonly finalContent: string;
  readonly charactersInserted: number;
  readonly characterLimitExceeded: boolean;
  readonly wasContentModified: boolean;
  readonly selectionStart: number;
  readonly selectionEnd: number;
  readonly error: Error | null;
  readonly warnings: readonly string[];
}

/**
 * Content formatting configuration
 */
export interface ContentFormattingConfig {
  readonly platform: Platform;
  readonly textAreaType: TextAreaType;
  readonly capabilities: TextAreaCapabilities;
  readonly characterLimit: number | null;
  readonly preserveFormatting: boolean;
  readonly convertLinks: boolean;
  readonly convertMentions: boolean;
  readonly convertHashtags: boolean;
  readonly allowHTML: boolean;
  readonly allowMarkdown: boolean;
}

/**
 * Content sanitization rules
 */
export interface ContentSanitizationRules {
  readonly allowedTags: readonly string[];
  readonly allowedAttributes: readonly string[];
  readonly stripScripts: boolean;
  readonly stripStyles: boolean;
  readonly convertNewlines: boolean;
  readonly escapeSpecialChars: boolean;
  readonly maxLength: number | null;
}

/**
 * Platform-specific character limits
 */
export const PLATFORM_CHARACTER_LIMITS: Record<Platform, number> = {
  twitter: 280,
  linkedin: 3000,
  reddit: 40000,
} as const;

/**
 * Default content insertion options
 */
export const DEFAULT_INSERTION_OPTIONS: ContentInsertionOptions = {
  mode: 'insert',
  format: 'auto',
  preserveSelection: true,
  preserveUndo: true,
  respectCharacterLimit: true,
  triggerEvents: true,
  sanitizeContent: true,
  formatForPlatform: true,
  addNewlines: false,
  trimWhitespace: true,
} as const;

/**
 * Content insertion service for safe, platform-aware content management
 */
export class ContentInsertionService {
  private static instance: ContentInsertionService;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ContentInsertionService {
    if (!ContentInsertionService.instance) {
      ContentInsertionService.instance = new ContentInsertionService();
    }
    return ContentInsertionService.instance;
  }

  /**
   * Insert content into text area with comprehensive options
   */
  public insertContent(
    textAreaId: string,
    content: string,
    options: Partial<ContentInsertionOptions> = {}
  ): ContentInsertionResult {
    const finalOptions = { ...DEFAULT_INSERTION_OPTIONS, ...options };
    const warnings: string[] = [];

    try {
      // Get text area state
      const textArea = textAreaManager.getTextArea(textAreaId);
      if (!textArea) {
        return this.createErrorResult('Text area not found', []);
      }

      // Validate text area
      const validation = textAreaManager.validateTextArea(textAreaId);
      if (!validation.isValid) {
        return this.createErrorResult(
          `Text area validation failed: ${validation.errors.join(', ')}`,
          validation.warnings
        );
      }

      if (!validation.isWritable) {
        return this.createErrorResult(
          'Text area is not writable',
          validation.warnings
        );
      }

      warnings.push(...validation.warnings);

      // Format content for platform and text area type
      const formattingConfig = this.createFormattingConfig(
        textArea,
        finalOptions
      );
      let processedContent = content;

      if (finalOptions.formatForPlatform) {
        processedContent = this.formatContentForPlatform(
          content,
          formattingConfig
        );
      }

      if (finalOptions.sanitizeContent) {
        const sanitizationRules =
          this.createSanitizationRules(formattingConfig);
        processedContent = this.sanitizeContent(
          processedContent,
          sanitizationRules
        );
      }

      if (finalOptions.trimWhitespace) {
        processedContent = processedContent.trim();
      }

      // Check character limit
      const currentContent = textArea.content;
      let finalContent = this.calculateFinalContent(
        currentContent,
        processedContent,
        finalOptions.mode,
        textArea
      );

      if (finalOptions.respectCharacterLimit && textArea.characterLimit) {
        if (finalContent.length > textArea.characterLimit) {
          const maxInsertLength =
            textArea.characterLimit -
            this.getContentLengthAfterInsertion(
              currentContent,
              '',
              finalOptions.mode,
              textArea
            );

          if (maxInsertLength <= 0) {
            return this.createErrorResult(
              'Character limit would be exceeded',
              warnings
            );
          }

          processedContent = processedContent.slice(0, maxInsertLength);
          finalContent = this.calculateFinalContent(
            currentContent,
            processedContent,
            finalOptions.mode,
            textArea
          );
          warnings.push('Content was truncated to respect character limit');
        }
      }

      // Preserve current selection if requested
      const originalSelectionStart = textArea.selectionStart;
      const originalSelectionEnd = textArea.selectionEnd;

      // Insert content using appropriate method
      const insertionSuccess = this.performInsertion(
        textArea,
        processedContent,
        finalOptions
      );

      if (!insertionSuccess) {
        return this.createErrorResult(
          'Failed to insert content into text area',
          warnings
        );
      }

      // Calculate new selection position
      const newSelectionStart = this.calculateNewSelectionStart(
        originalSelectionStart,
        processedContent.length,
        finalOptions.mode
      );
      const newSelectionEnd = finalOptions.preserveSelection
        ? newSelectionStart
        : newSelectionStart;

      // Update selection if needed
      if (finalOptions.preserveSelection) {
        this.setTextAreaSelection(textArea, newSelectionStart, newSelectionEnd);
      }

      return {
        success: true,
        insertedContent: processedContent,
        finalContent,
        charactersInserted: processedContent.length,
        characterLimitExceeded: false,
        wasContentModified: processedContent !== content,
        selectionStart: newSelectionStart,
        selectionEnd: newSelectionEnd,
        error: null,
        warnings,
      };
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : String(error),
        warnings
      );
    }
  }

  /**
   * Replace all content in text area
   */
  public replaceContent(
    textAreaId: string,
    content: string,
    options: Partial<ContentInsertionOptions> = {}
  ): ContentInsertionResult {
    return this.insertContent(textAreaId, content, {
      ...options,
      mode: 'replace',
    });
  }

  /**
   * Append content to text area
   */
  public appendContent(
    textAreaId: string,
    content: string,
    options: Partial<ContentInsertionOptions> = {}
  ): ContentInsertionResult {
    return this.insertContent(textAreaId, content, {
      ...options,
      mode: 'append',
    });
  }

  /**
   * Prepend content to text area
   */
  public prependContent(
    textAreaId: string,
    content: string,
    options: Partial<ContentInsertionOptions> = {}
  ): ContentInsertionResult {
    return this.insertContent(textAreaId, content, {
      ...options,
      mode: 'prepend',
    });
  }

  /**
   * Insert content at cursor position
   */
  public insertAtCursor(
    textAreaId: string,
    content: string,
    options: Partial<ContentInsertionOptions> = {}
  ): ContentInsertionResult {
    return this.insertContent(textAreaId, content, {
      ...options,
      mode: 'insert',
    });
  }

  /**
   * Smart replace content (preserves mentions, hashtags, etc.)
   */
  public smartReplace(
    textAreaId: string,
    content: string,
    options: Partial<ContentInsertionOptions> = {}
  ): ContentInsertionResult {
    return this.insertContent(textAreaId, content, {
      ...options,
      mode: 'smart-replace',
    });
  }

  /**
   * Format content specifically for a platform
   */
  public formatForPlatform(
    content: string,
    platform: Platform,
    textAreaType: TextAreaType = 'contenteditable'
  ): string {
    const capabilities = this.getDefaultCapabilities(textAreaType);
    const config: ContentFormattingConfig = {
      platform,
      textAreaType,
      capabilities,
      characterLimit: PLATFORM_CHARACTER_LIMITS[platform],
      preserveFormatting: capabilities.supportsRichText,
      convertLinks: true,
      convertMentions: true,
      convertHashtags: true,
      allowHTML: capabilities.supportsHTML,
      allowMarkdown: capabilities.supportsMarkdown,
    };

    return this.formatContentForPlatform(content, config);
  }

  /**
   * Sanitize content for safe insertion
   */
  public sanitizeForPlatform(
    content: string,
    platform: Platform,
    textAreaType: TextAreaType = 'contenteditable'
  ): string {
    const capabilities = this.getDefaultCapabilities(textAreaType);
    const config: ContentFormattingConfig = {
      platform,
      textAreaType,
      capabilities,
      characterLimit: PLATFORM_CHARACTER_LIMITS[platform],
      preserveFormatting: false,
      convertLinks: false,
      convertMentions: false,
      convertHashtags: false,
      allowHTML: capabilities.supportsHTML,
      allowMarkdown: capabilities.supportsMarkdown,
    };

    const rules = this.createSanitizationRules(config);
    return this.sanitizeContent(content, rules);
  }

  /**
   * Check if content would exceed character limit
   */
  public wouldExceedLimit(
    textAreaId: string,
    content: string,
    mode: ContentInsertionMode = 'insert'
  ): boolean {
    const textArea = textAreaManager.getTextArea(textAreaId);
    if (!textArea?.characterLimit) {
      return false;
    }

    const finalLength = this.getContentLengthAfterInsertion(
      textArea.content,
      content,
      mode,
      textArea
    );

    return finalLength > textArea.characterLimit;
  }

  /**
   * Get remaining character count after insertion
   */
  public getRemainingCharacters(
    textAreaId: string,
    content: string,
    mode: ContentInsertionMode = 'insert'
  ): number | null {
    const textArea = textAreaManager.getTextArea(textAreaId);
    if (!textArea?.characterLimit) {
      return null;
    }

    const finalLength = this.getContentLengthAfterInsertion(
      textArea.content,
      content,
      mode,
      textArea
    );

    return Math.max(0, textArea.characterLimit - finalLength);
  }

  // Private helper methods

  private createErrorResult(
    message: string,
    warnings: readonly string[]
  ): ContentInsertionResult {
    return {
      success: false,
      insertedContent: '',
      finalContent: '',
      charactersInserted: 0,
      characterLimitExceeded: false,
      wasContentModified: false,
      selectionStart: 0,
      selectionEnd: 0,
      error: new Error(message),
      warnings,
    };
  }

  private createFormattingConfig(
    textArea: TextAreaState,
    options: ContentInsertionOptions
  ): ContentFormattingConfig {
    const validation = textAreaManager.validateTextArea(textArea.id);

    return {
      platform: textArea.platform,
      textAreaType: textArea.type,
      capabilities: validation.capabilities,
      characterLimit: textArea.characterLimit,
      preserveFormatting: validation.capabilities.supportsRichText,
      convertLinks: options.formatForPlatform,
      convertMentions: options.formatForPlatform,
      convertHashtags: options.formatForPlatform,
      allowHTML: validation.capabilities.supportsHTML,
      allowMarkdown: validation.capabilities.supportsMarkdown,
    };
  }

  private createSanitizationRules(
    config: ContentFormattingConfig
  ): ContentSanitizationRules {
    const allowedTags = config.allowHTML
      ? ['b', 'i', 'strong', 'em', 'u', 'a', 'br', 'p']
      : [];
    const allowedAttributes = config.allowHTML ? ['href', 'target'] : [];

    return {
      allowedTags,
      allowedAttributes,
      stripScripts: true,
      stripStyles: !config.preserveFormatting,
      convertNewlines: config.textAreaType !== 'textarea',
      escapeSpecialChars: !config.allowHTML,
      maxLength: config.characterLimit,
    };
  }

  private formatContentForPlatform(
    content: string,
    config: ContentFormattingConfig
  ): string {
    let formatted = content;

    // Platform-specific formatting
    switch (config.platform) {
      case 'twitter':
        formatted = this.formatForTwitter(formatted, config);
        break;
      case 'linkedin':
        formatted = this.formatForLinkedIn(formatted, config);
        break;
      case 'reddit':
        formatted = this.formatForReddit(formatted, config);
        break;
    }

    return formatted;
  }

  private formatForTwitter(
    content: string,
    config: ContentFormattingConfig
  ): string {
    let formatted = content;

    // Convert newlines to spaces for Twitter (single line)
    if (config.textAreaType === 'contenteditable') {
      formatted = formatted.replace(/\n+/g, ' ').replace(/\s+/g, ' ');
    }

    // Ensure hashtags and mentions are properly formatted
    if (config.convertHashtags) {
      formatted = formatted.replace(/#([a-zA-Z0-9_]+)/g, '#$1');
    }

    if (config.convertMentions) {
      formatted = formatted.replace(/@([a-zA-Z0-9_]+)/g, '@$1');
    }

    // Handle links
    if (config.convertLinks && !config.allowHTML) {
      // Keep links as plain text for Twitter
      formatted = formatted.replace(
        /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g,
        '$2 $1'
      );
    }

    return formatted;
  }

  private formatForLinkedIn(
    content: string,
    config: ContentFormattingConfig
  ): string {
    let formatted = content;

    // LinkedIn supports rich text and multiple lines
    if (config.textAreaType === 'quill' && config.allowHTML) {
      // Convert markdown-style formatting to HTML
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/\n/g, '<br>');
    }

    // Handle mentions
    if (config.convertMentions) {
      formatted = formatted.replace(/@([a-zA-Z0-9-]+)/g, '@$1');
    }

    return formatted;
  }

  private formatForReddit(
    content: string,
    config: ContentFormattingConfig
  ): string {
    let formatted = content;

    // Reddit supports markdown
    if (config.allowMarkdown) {
      // Preserve markdown formatting
      // No changes needed as Reddit natively supports markdown
    } else if (config.textAreaType === 'contenteditable') {
      // Convert markdown to HTML if needed
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/\n/g, '<br>');
    }

    // Handle Reddit-specific formatting
    formatted = formatted.replace(/r\/([a-zA-Z0-9_]+)/g, 'r/$1');
    formatted = formatted.replace(/u\/([a-zA-Z0-9_-]+)/g, 'u/$1');

    return formatted;
  }

  private sanitizeContent(
    content: string,
    rules: ContentSanitizationRules
  ): string {
    let sanitized = content;

    // Strip scripts and dangerous content
    if (rules.stripScripts) {
      sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gis, '');
      sanitized = sanitized.replace(/javascript:/gi, '');
      sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    }

    // Strip styles if not allowed
    if (rules.stripStyles) {
      sanitized = sanitized.replace(/<style[^>]*>.*?<\/style>/gis, '');
      sanitized = sanitized.replace(/style\s*=/gi, '');
    }

    // Filter allowed tags
    if (rules.allowedTags.length === 0) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    } else {
      const allowedTagsRegex = new RegExp(
        `<(?!/?(?:${rules.allowedTags.join('|')})\b)[^>]*>`,
        'gi'
      );
      sanitized = sanitized.replace(allowedTagsRegex, '');
    }

    // Escape special characters if needed
    if (rules.escapeSpecialChars) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }

    // Convert newlines
    if (rules.convertNewlines) {
      sanitized = sanitized.replace(/\n/g, '<br>');
    }

    // Enforce max length
    if (rules.maxLength && sanitized.length > rules.maxLength) {
      sanitized = sanitized.slice(0, rules.maxLength);
    }

    return sanitized;
  }

  private calculateFinalContent(
    currentContent: string,
    newContent: string,
    mode: ContentInsertionMode,
    textArea: TextAreaState
  ): string {
    switch (mode) {
      case 'replace':
        return newContent;

      case 'append':
        return currentContent + newContent;

      case 'prepend':
        return newContent + currentContent;

      case 'insert': {
        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        return (
          currentContent.slice(0, start) +
          newContent +
          currentContent.slice(end)
        );
      }

      case 'smart-replace': {
        // Preserve mentions, hashtags, and links
        const preserved = this.extractPreservedElements(currentContent);
        return this.mergeContentWithPreserved(newContent, preserved);
      }

      case 'merge': {
        // Intelligent merge that avoids duplication
        return this.mergeContent(currentContent, newContent);
      }

      default:
        return currentContent + newContent;
    }
  }

  private getContentLengthAfterInsertion(
    currentContent: string,
    newContent: string,
    mode: ContentInsertionMode,
    textArea: TextAreaState
  ): number {
    const finalContent = this.calculateFinalContent(
      currentContent,
      newContent,
      mode,
      textArea
    );
    return finalContent.length;
  }

  private performInsertion(
    textArea: TextAreaState,
    content: string,
    options: ContentInsertionOptions
  ): boolean {
    try {
      switch (options.mode) {
        case 'replace':
          return textAreaManager.setContent(
            textArea.id,
            content,
            options.preserveUndo
          );

        case 'append': {
          const currentContent = textAreaManager.getContent(textArea.id) ?? '';
          return textAreaManager.setContent(
            textArea.id,
            currentContent + content,
            options.preserveUndo
          );
        }

        case 'prepend': {
          const currentContent = textAreaManager.getContent(textArea.id) ?? '';
          return textAreaManager.setContent(
            textArea.id,
            content + currentContent,
            options.preserveUndo
          );
        }

        case 'insert':
          return textAreaManager.insertAtCursor(
            textArea.id,
            content,
            options.preserveUndo
          );

        case 'smart-replace':
        case 'merge': {
          const finalContent = this.calculateFinalContent(
            textArea.content,
            content,
            options.mode,
            textArea
          );
          return textAreaManager.setContent(
            textArea.id,
            finalContent,
            options.preserveUndo
          );
        }

        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to perform content insertion:', error);
      return false;
    }
  }

  private calculateNewSelectionStart(
    originalStart: number,
    insertedLength: number,
    mode: ContentInsertionMode
  ): number {
    switch (mode) {
      case 'replace':
        return insertedLength;

      case 'prepend':
        return originalStart + insertedLength;

      case 'insert':
        return originalStart + insertedLength;

      default:
        return originalStart;
    }
  }

  private setTextAreaSelection(
    textArea: TextAreaState,
    start: number,
    end: number
  ): void {
    try {
      const element = textArea.element;

      if (textArea.type === 'input' || textArea.type === 'textarea') {
        const input = element as HTMLInputElement | HTMLTextAreaElement;
        input.selectionStart = start;
        input.selectionEnd = end;
      } else {
        // For contenteditable elements
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.setStart(
            element.firstChild ?? element,
            Math.min(start, element.textContent?.length ?? 0)
          );
          range.setEnd(
            element.firstChild ?? element,
            Math.min(end, element.textContent?.length ?? 0)
          );
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    } catch (error) {
      console.error('Failed to set text area selection:', error);
    }
  }

  private extractPreservedElements(content: string): readonly string[] {
    const preserved: string[] = [];

    // Extract mentions
    const mentions = content.match(/@[a-zA-Z0-9_]+/g);
    if (mentions) {
      preserved.push(...mentions);
    }

    // Extract hashtags
    const hashtags = content.match(/#[a-zA-Z0-9_]+/g);
    if (hashtags) {
      preserved.push(...hashtags);
    }

    // Extract links
    const links = content.match(/https?:\/\/[^\s]+/g);
    if (links) {
      preserved.push(...links);
    }

    return preserved;
  }

  private mergeContentWithPreserved(
    newContent: string,
    preserved: readonly string[]
  ): string {
    let merged = newContent;

    // Append preserved elements that aren't already in the new content
    for (const element of preserved) {
      if (!merged.includes(element)) {
        merged += ` ${element}`;
      }
    }

    return merged.trim();
  }

  private mergeContent(currentContent: string, newContent: string): string {
    // Simple merge logic - can be enhanced based on requirements
    const currentWords = new Set(currentContent.toLowerCase().split(/\s+/));
    const newWords = newContent.split(/\s+/);

    const uniqueNewWords = newWords.filter(
      word => !currentWords.has(word.toLowerCase())
    );

    if (uniqueNewWords.length === 0) {
      return currentContent;
    }

    return currentContent + ' ' + uniqueNewWords.join(' ');
  }

  private getDefaultCapabilities(type: TextAreaType): TextAreaCapabilities {
    return {
      supportsHTML:
        type === 'contenteditable' || type === 'quill' || type === 'rich-text',
      supportsMarkdown: type === 'markdown' || type === 'draft',
      supportsRichText:
        type === 'contenteditable' || type === 'quill' || type === 'rich-text',
      supportsUndo: true,
      supportsSelection: true,
      supportsCursor: true,
      supportsMultiline: type !== 'input',
      hasCharacterLimit: true,
      allowsFormatting: type !== 'input' && type !== 'textarea',
    };
  }
}

/**
 * Export singleton instance
 */
export const contentInsertionService = ContentInsertionService.getInstance();
