/**
 * Cursor Management Utilities - Advanced Cursor Position Handling
 *
 * Provides comprehensive cursor position management, selection handling,
 * and restoration capabilities across different text area types and platforms.
 */

import type { Platform } from './types.js';
import {
  textAreaManager,
  type TextAreaType,
  type TextAreaState,
} from './textAreaManager.js';

/**
 * Cursor position information
 */
export interface CursorPosition {
  readonly start: number;
  readonly end: number;
  readonly direction: 'forward' | 'backward' | 'none';
  readonly isCollapsed: boolean;
  readonly selectedText: string;
}

/**
 * Enhanced cursor position with DOM information
 */
export interface EnhancedCursorPosition extends CursorPosition {
  readonly textAreaId: string;
  readonly element: HTMLElement;
  readonly type: TextAreaType;
  readonly platform: Platform;
  readonly absoluteStart: number;
  readonly absoluteEnd: number;
  readonly lineNumber: number;
  readonly columnNumber: number;
  readonly wordBoundary: {
    readonly wordStart: number;
    readonly wordEnd: number;
    readonly word: string;
  } | null;
  readonly timestamp: number;
}

/**
 * Cursor movement direction
 */
export type CursorMovementDirection =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'home'
  | 'end'
  | 'word-left'
  | 'word-right'
  | 'line-start'
  | 'line-end'
  | 'document-start'
  | 'document-end';

/**
 * Selection operation types
 */
export type SelectionOperation =
  | 'select-all'
  | 'select-word'
  | 'select-line'
  | 'select-paragraph'
  | 'select-range'
  | 'extend-selection'
  | 'clear-selection';

/**
 * Cursor restoration options
 */
export interface CursorRestorationOptions {
  readonly preserveSelection: boolean;
  readonly adjustForContentChanges: boolean;
  readonly fallbackToEnd: boolean;
  readonly respectBoundaries: boolean;
  readonly animateTransition: boolean;
}

/**
 * Selection range
 */
export interface SelectionRange {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/**
 * Word boundary detection result
 */
export interface WordBoundary {
  readonly start: number;
  readonly end: number;
  readonly word: string;
  readonly isWhitespace: boolean;
  readonly isAlphanumeric: boolean;
  readonly isPunctuation: boolean;
}

/**
 * Line information
 */
export interface LineInfo {
  readonly lineNumber: number;
  readonly lineStart: number;
  readonly lineEnd: number;
  readonly lineText: string;
  readonly columnNumber: number;
  readonly totalLines: number;
}

/**
 * Cursor operation result
 */
export interface CursorOperationResult {
  readonly success: boolean;
  readonly previousPosition: CursorPosition | null;
  readonly newPosition: CursorPosition | null;
  readonly wasPositionChanged: boolean;
  readonly error: Error | null;
}

/**
 * Default cursor restoration options
 */
export const DEFAULT_RESTORATION_OPTIONS: CursorRestorationOptions = {
  preserveSelection: true,
  adjustForContentChanges: true,
  fallbackToEnd: true,
  respectBoundaries: true,
  animateTransition: false,
} as const;

/**
 * Cursor management service for advanced cursor position handling
 */
export class CursorManager {
  private static instance: CursorManager;
  private readonly savedPositions = new Map<string, EnhancedCursorPosition>();
  private readonly positionHistory = new Map<
    string,
    readonly EnhancedCursorPosition[]
  >();
  private readonly maxHistorySize = 50;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CursorManager {
    if (!CursorManager.instance) {
      CursorManager.instance = new CursorManager();
    }
    return CursorManager.instance;
  }

  /**
   * Get current cursor position
   */
  public getCursorPosition(textAreaId: string): CursorPosition | null {
    const textArea = textAreaManager.getTextArea(textAreaId);
    if (!textArea) {
      return null;
    }

    return this.extractCursorPosition(textArea);
  }

  /**
   * Get enhanced cursor position with additional metadata
   */
  public getEnhancedCursorPosition(
    textAreaId: string
  ): EnhancedCursorPosition | null {
    const textArea = textAreaManager.getTextArea(textAreaId);
    if (!textArea) {
      return null;
    }

    const basicPosition = this.extractCursorPosition(textArea);
    if (!basicPosition) {
      return null;
    }

    const lineInfo = this.getLineInfo(textArea, basicPosition.start);
    const wordBoundary = this.getWordBoundary(textArea, basicPosition.start);

    return {
      ...basicPosition,
      textAreaId,
      element: textArea.element,
      type: textArea.type,
      platform: textArea.platform,
      absoluteStart: basicPosition.start,
      absoluteEnd: basicPosition.end,
      lineNumber: lineInfo.lineNumber,
      columnNumber: lineInfo.columnNumber,
      wordBoundary: wordBoundary
        ? {
            wordStart: wordBoundary.start,
            wordEnd: wordBoundary.end,
            word: wordBoundary.word,
          }
        : null,
      timestamp: Date.now(),
    };
  }

  /**
   * Set cursor position
   */
  public setCursorPosition(
    textAreaId: string,
    position: number | CursorPosition,
    options: Partial<CursorRestorationOptions> = {}
  ): CursorOperationResult {
    const textArea = textAreaManager.getTextArea(textAreaId);
    if (!textArea) {
      return this.createErrorResult('Text area not found');
    }

    const finalOptions = { ...DEFAULT_RESTORATION_OPTIONS, ...options };
    const previousPosition = this.extractCursorPosition(textArea);

    try {
      let targetStart: number;
      let targetEnd: number;

      if (typeof position === 'number') {
        targetStart = targetEnd = position;
      } else {
        targetStart = position.start;
        targetEnd = position.end;
      }

      // Respect boundaries
      if (finalOptions.respectBoundaries) {
        const contentLength = textArea.content.length;
        targetStart = Math.max(0, Math.min(targetStart, contentLength));
        targetEnd = Math.max(0, Math.min(targetEnd, contentLength));
      }

      const success = this.performCursorPositioning(
        textArea,
        targetStart,
        targetEnd
      );

      if (success) {
        const newPosition = this.extractCursorPosition(textArea);
        this.savePositionToHistory(textAreaId);

        return {
          success: true,
          previousPosition,
          newPosition,
          wasPositionChanged: true,
          error: null,
        };
      } else {
        return this.createErrorResult('Failed to set cursor position');
      }
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Move cursor in specified direction
   */
  public moveCursor(
    textAreaId: string,
    direction: CursorMovementDirection,
    extend = false
  ): CursorOperationResult {
    const textArea = textAreaManager.getTextArea(textAreaId);
    if (!textArea) {
      return this.createErrorResult('Text area not found');
    }

    const currentPosition = this.extractCursorPosition(textArea);
    if (!currentPosition) {
      return this.createErrorResult('Could not get current cursor position');
    }

    const newPosition = this.calculateNewPosition(
      textArea,
      currentPosition,
      direction,
      extend
    );
    return this.setCursorPosition(textAreaId, newPosition);
  }

  /**
   * Perform selection operation
   */
  public performSelection(
    textAreaId: string,
    operation: SelectionOperation,
    range?: SelectionRange
  ): CursorOperationResult {
    const textArea = textAreaManager.getTextArea(textAreaId);
    if (!textArea) {
      return this.createErrorResult('Text area not found');
    }

    const currentPosition = this.extractCursorPosition(textArea);
    if (!currentPosition) {
      return this.createErrorResult('Could not get current cursor position');
    }

    try {
      let newPosition: CursorPosition;

      switch (operation) {
        case 'select-all':
          newPosition = {
            start: 0,
            end: textArea.content.length,
            direction: 'forward',
            isCollapsed: false,
            selectedText: textArea.content,
          };
          break;

        case 'select-word': {
          const wordBoundary = this.getWordBoundary(
            textArea,
            currentPosition.start
          );
          if (wordBoundary) {
            newPosition = {
              start: wordBoundary.start,
              end: wordBoundary.end,
              direction: 'forward',
              isCollapsed: false,
              selectedText: wordBoundary.word,
            };
          } else {
            return this.createErrorResult('Could not find word boundary');
          }
          break;
        }

        case 'select-line': {
          const lineInfo = this.getLineInfo(textArea, currentPosition.start);
          newPosition = {
            start: lineInfo.lineStart,
            end: lineInfo.lineEnd,
            direction: 'forward',
            isCollapsed: false,
            selectedText: lineInfo.lineText,
          };
          break;
        }

        case 'select-paragraph': {
          const paragraphBounds = this.getParagraphBounds(
            textArea,
            currentPosition.start
          );
          newPosition = {
            start: paragraphBounds.start,
            end: paragraphBounds.end,
            direction: 'forward',
            isCollapsed: false,
            selectedText: textArea.content.slice(
              paragraphBounds.start,
              paragraphBounds.end
            ),
          };
          break;
        }

        case 'select-range':
          if (!range) {
            return this.createErrorResult(
              'Range required for select-range operation'
            );
          }
          newPosition = {
            start: range.start,
            end: range.end,
            direction: 'forward',
            isCollapsed: range.start === range.end,
            selectedText: range.text,
          };
          break;

        case 'extend-selection': {
          const extendedEnd = Math.min(
            currentPosition.end + 1,
            textArea.content.length
          );
          newPosition = {
            start: currentPosition.start,
            end: extendedEnd,
            direction: 'forward',
            isCollapsed: false,
            selectedText: textArea.content.slice(
              currentPosition.start,
              extendedEnd
            ),
          };
          break;
        }

        case 'clear-selection':
          newPosition = {
            start: currentPosition.start,
            end: currentPosition.start,
            direction: 'none',
            isCollapsed: true,
            selectedText: '',
          };
          break;

        default:
          return this.createErrorResult(
            `Unknown selection operation: ${operation}`
          );
      }

      return this.setCursorPosition(textAreaId, newPosition);
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Save current cursor position
   */
  public savePosition(textAreaId: string, key?: string): boolean {
    const enhanced = this.getEnhancedCursorPosition(textAreaId);
    if (!enhanced) {
      return false;
    }

    const saveKey = key ?? `saved-${textAreaId}`;
    this.savedPositions.set(saveKey, enhanced);
    return true;
  }

  /**
   * Restore saved cursor position
   */
  public restorePosition(
    textAreaId: string,
    key?: string,
    options: Partial<CursorRestorationOptions> = {}
  ): CursorOperationResult {
    const saveKey = key ?? `saved-${textAreaId}`;
    const savedPosition = this.savedPositions.get(saveKey);

    if (!savedPosition) {
      return this.createErrorResult('No saved position found');
    }

    const finalOptions = { ...DEFAULT_RESTORATION_OPTIONS, ...options };

    // Adjust position if content has changed
    let targetPosition = savedPosition;
    if (finalOptions.adjustForContentChanges) {
      targetPosition = this.adjustPositionForContentChanges(
        textAreaId,
        savedPosition
      );
    }

    return this.setCursorPosition(textAreaId, targetPosition, finalOptions);
  }

  /**
   * Get position history
   */
  public getPositionHistory(
    textAreaId: string
  ): readonly EnhancedCursorPosition[] {
    return this.positionHistory.get(textAreaId) ?? [];
  }

  /**
   * Go back to previous position
   */
  public goToPreviousPosition(textAreaId: string): CursorOperationResult {
    const history = this.positionHistory.get(textAreaId) ?? [];
    if (history.length < 2) {
      return this.createErrorResult('No previous position available');
    }

    // Get the second-to-last position (last is current)
    const previousPosition = history[history.length - 2];
    return this.setCursorPosition(textAreaId, previousPosition);
  }

  /**
   * Get selected text
   */
  public getSelectedText(textAreaId: string): string | null {
    const position = this.getCursorPosition(textAreaId);
    return position?.selectedText ?? null;
  }

  /**
   * Check if text is selected
   */
  public hasSelection(textAreaId: string): boolean {
    const position = this.getCursorPosition(textAreaId);
    return position ? !position.isCollapsed : false;
  }

  /**
   * Get word at cursor position
   */
  public getWordAtCursor(textAreaId: string): string | null {
    const textArea = textAreaManager.getTextArea(textAreaId);
    if (!textArea) {
      return null;
    }

    const position = this.getCursorPosition(textAreaId);
    if (!position) {
      return null;
    }

    const wordBoundary = this.getWordBoundary(textArea, position.start);
    return wordBoundary?.word ?? null;
  }

  /**
   * Get line at cursor position
   */
  public getLineAtCursor(textAreaId: string): string | null {
    const textArea = textAreaManager.getTextArea(textAreaId);
    if (!textArea) {
      return null;
    }

    const position = this.getCursorPosition(textAreaId);
    if (!position) {
      return null;
    }

    const lineInfo = this.getLineInfo(textArea, position.start);
    return lineInfo.lineText;
  }

  /**
   * Clear saved positions for text area
   */
  public clearSavedPositions(textAreaId: string): void {
    const keys = Array.from(this.savedPositions.keys()).filter(key =>
      key.includes(textAreaId)
    );

    for (const key of keys) {
      this.savedPositions.delete(key);
    }

    this.positionHistory.delete(textAreaId);
  }

  /**
   * Clear all saved positions
   */
  public clearAllSavedPositions(): void {
    this.savedPositions.clear();
    this.positionHistory.clear();
  }

  // Private helper methods

  private extractCursorPosition(
    textArea: TextAreaState
  ): CursorPosition | null {
    try {
      const element = textArea.element;

      if (textArea.type === 'input' || textArea.type === 'textarea') {
        const input = element as HTMLInputElement | HTMLTextAreaElement;
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;
        const selectedText = input.value.slice(start, end);

        return {
          start,
          end,
          direction:
            input.selectionDirection === 'backward' ? 'backward' : 'forward',
          isCollapsed: start === end,
          selectedText,
        };
      } else {
        // For contenteditable elements
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          return {
            start: 0,
            end: 0,
            direction: 'none',
            isCollapsed: true,
            selectedText: '',
          };
        }

        const range = selection.getRangeAt(0);
        const content = textArea.content;

        // Calculate character positions within the element
        const start = this.getCharacterPosition(
          element,
          range.startContainer,
          range.startOffset
        );
        const end = this.getCharacterPosition(
          element,
          range.endContainer,
          range.endOffset
        );

        return {
          start,
          end,
          direction: start > end ? 'backward' : 'forward',
          isCollapsed: start === end,
          selectedText: content.slice(
            Math.min(start, end),
            Math.max(start, end)
          ),
        };
      }
    } catch (error) {
      console.error('Failed to extract cursor position:', error);
      return null;
    }
  }

  private performCursorPositioning(
    textArea: TextAreaState,
    start: number,
    end: number
  ): boolean {
    try {
      const element = textArea.element;

      if (textArea.type === 'input' || textArea.type === 'textarea') {
        const input = element as HTMLInputElement | HTMLTextAreaElement;
        input.setSelectionRange(start, end);
        return true;
      } else {
        // For contenteditable elements
        const selection = window.getSelection();
        if (!selection) {
          return false;
        }

        const range = document.createRange();
        const startPosition = this.getNodeAndOffsetFromCharacterPosition(
          element,
          start
        );
        const endPosition = this.getNodeAndOffsetFromCharacterPosition(
          element,
          end
        );

        if (!startPosition || !endPosition) {
          return false;
        }

        range.setStart(startPosition.node, startPosition.offset);
        range.setEnd(endPosition.node, endPosition.offset);

        selection.removeAllRanges();
        selection.addRange(range);

        return true;
      }
    } catch (error) {
      console.error('Failed to set cursor position:', error);
      return false;
    }
  }

  private calculateNewPosition(
    textArea: TextAreaState,
    currentPosition: CursorPosition,
    direction: CursorMovementDirection,
    extend: boolean
  ): CursorPosition {
    const content = textArea.content;
    const contentLength = content.length;
    let newStart = currentPosition.start;
    let newEnd = extend ? currentPosition.end : currentPosition.start;

    switch (direction) {
      case 'left':
        newStart = Math.max(0, newStart - 1);
        if (!extend) newEnd = newStart;
        break;

      case 'right':
        newStart = Math.min(contentLength, newStart + 1);
        if (!extend) newEnd = newStart;
        break;

      case 'word-left': {
        const wordBoundary = this.findPreviousWordBoundary(textArea, newStart);
        newStart = wordBoundary;
        if (!extend) newEnd = newStart;
        break;
      }

      case 'word-right': {
        const wordBoundary = this.findNextWordBoundary(textArea, newStart);
        newStart = wordBoundary;
        if (!extend) newEnd = newStart;
        break;
      }

      case 'line-start': {
        const lineInfo = this.getLineInfo(textArea, newStart);
        newStart = lineInfo.lineStart;
        if (!extend) newEnd = newStart;
        break;
      }

      case 'line-end': {
        const lineInfo = this.getLineInfo(textArea, newStart);
        newStart = lineInfo.lineEnd;
        if (!extend) newEnd = newStart;
        break;
      }

      case 'document-start':
        newStart = 0;
        if (!extend) newEnd = newStart;
        break;

      case 'document-end':
        newStart = contentLength;
        if (!extend) newEnd = newStart;
        break;

      case 'up':
      case 'down': {
        // For line-based movement, calculate target line
        const lineInfo = this.getLineInfo(textArea, newStart);
        const targetLine =
          direction === 'up'
            ? lineInfo.lineNumber - 1
            : lineInfo.lineNumber + 1;
        const targetPosition = this.getPositionFromLineAndColumn(
          textArea,
          targetLine,
          lineInfo.columnNumber
        );
        newStart = targetPosition;
        if (!extend) newEnd = newStart;
        break;
      }
    }

    // Ensure valid range
    newStart = Math.max(0, Math.min(newStart, contentLength));
    newEnd = Math.max(0, Math.min(newEnd, contentLength));

    return {
      start: newStart,
      end: newEnd,
      direction: newStart <= newEnd ? 'forward' : 'backward',
      isCollapsed: newStart === newEnd,
      selectedText: content.slice(
        Math.min(newStart, newEnd),
        Math.max(newStart, newEnd)
      ),
    };
  }

  private getCharacterPosition(
    container: HTMLElement,
    node: Node,
    offset: number
  ): number {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    let position = 0;
    let currentNode = walker.nextNode();

    while (currentNode && currentNode !== node) {
      position += currentNode.textContent?.length ?? 0;
      currentNode = walker.nextNode();
    }

    return position + offset;
  }

  private getNodeAndOffsetFromCharacterPosition(
    container: HTMLElement,
    position: number
  ): { node: Node; offset: number } | null {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentPosition = 0;
    let currentNode = walker.nextNode();

    while (currentNode) {
      const nodeLength = currentNode.textContent?.length ?? 0;

      if (currentPosition + nodeLength >= position) {
        return {
          node: currentNode,
          offset: position - currentPosition,
        };
      }

      currentPosition += nodeLength;
      currentNode = walker.nextNode();
    }

    // Fallback to container end
    return {
      node: container,
      offset: container.childNodes.length,
    };
  }

  private getWordBoundary(
    textArea: TextAreaState,
    position: number
  ): WordBoundary | null {
    const content = textArea.content;
    const wordRegex = /\b\w+\b/g;
    let match;

    while ((match = wordRegex.exec(content)) !== null) {
      if (
        position >= match.index &&
        position <= match.index + match[0].length
      ) {
        return {
          start: match.index,
          end: match.index + match[0].length,
          word: match[0],
          isWhitespace: false,
          isAlphanumeric: /^[a-zA-Z0-9]+$/.test(match[0]),
          isPunctuation: /^[^\w\s]+$/.test(match[0]),
        };
      }
    }

    return null;
  }

  private findPreviousWordBoundary(
    textArea: TextAreaState,
    position: number
  ): number {
    const content = textArea.content;
    const beforeText = content.slice(0, position);
    const match = beforeText.match(/\b\w+\b(?=\s*$)/);

    return match ? beforeText.lastIndexOf(match[0]) : 0;
  }

  private findNextWordBoundary(
    textArea: TextAreaState,
    position: number
  ): number {
    const content = textArea.content;
    const afterText = content.slice(position);
    const match = afterText.match(/\b\w+\b/);

    return match
      ? position + afterText.indexOf(match[0]) + match[0].length
      : content.length;
  }

  private getLineInfo(textArea: TextAreaState, position: number): LineInfo {
    const content = textArea.content;
    const lines = content.split('\n');
    let currentPosition = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length;

      if (currentPosition + lineLength >= position) {
        return {
          lineNumber: i + 1,
          lineStart: currentPosition,
          lineEnd: currentPosition + lineLength,
          lineText: lines[i],
          columnNumber: position - currentPosition + 1,
          totalLines: lines.length,
        };
      }

      currentPosition += lineLength + 1; // +1 for newline character
    }

    // Fallback to last line
    const lastLineStart =
      currentPosition - (lines[lines.length - 1].length + 1);
    return {
      lineNumber: lines.length,
      lineStart: lastLineStart,
      lineEnd: content.length,
      lineText: lines[lines.length - 1],
      columnNumber: position - lastLineStart + 1,
      totalLines: lines.length,
    };
  }

  private getParagraphBounds(
    textArea: TextAreaState,
    position: number
  ): { start: number; end: number } {
    const content = textArea.content;

    // Find previous double newline or start of content
    let start = content.lastIndexOf('\n\n', position);
    start = start === -1 ? 0 : start + 2;

    // Find next double newline or end of content
    let end = content.indexOf('\n\n', position);
    end = end === -1 ? content.length : end;

    return { start, end };
  }

  private getPositionFromLineAndColumn(
    textArea: TextAreaState,
    lineNumber: number,
    columnNumber: number
  ): number {
    const content = textArea.content;
    const lines = content.split('\n');

    if (lineNumber < 1 || lineNumber > lines.length) {
      return lineNumber < 1 ? 0 : content.length;
    }

    let position = 0;
    for (let i = 0; i < lineNumber - 1; i++) {
      position += lines[i].length + 1; // +1 for newline
    }

    const line = lines[lineNumber - 1];
    const targetColumn = Math.min(columnNumber - 1, line.length);

    return position + targetColumn;
  }

  private adjustPositionForContentChanges(
    textAreaId: string,
    savedPosition: EnhancedCursorPosition
  ): EnhancedCursorPosition {
    const textArea = textAreaManager.getTextArea(textAreaId);
    if (!textArea) {
      return savedPosition;
    }

    const currentContent = textArea.content;
    const contentLength = currentContent.length;

    // Simple adjustment - clamp to current content bounds
    const adjustedStart = Math.max(
      0,
      Math.min(savedPosition.start, contentLength)
    );
    const adjustedEnd = Math.max(0, Math.min(savedPosition.end, contentLength));

    return {
      ...savedPosition,
      start: adjustedStart,
      end: adjustedEnd,
      isCollapsed: adjustedStart === adjustedEnd,
      selectedText: currentContent.slice(adjustedStart, adjustedEnd),
      timestamp: Date.now(),
    };
  }

  private savePositionToHistory(textAreaId: string): void {
    const enhanced = this.getEnhancedCursorPosition(textAreaId);
    if (!enhanced) {
      return;
    }

    const currentHistory = this.positionHistory.get(textAreaId) ?? [];
    const updatedHistory = [...currentHistory, enhanced];

    // Limit history size
    if (updatedHistory.length > this.maxHistorySize) {
      updatedHistory.shift();
    }

    this.positionHistory.set(textAreaId, updatedHistory);
  }

  private createErrorResult(message: string): CursorOperationResult {
    return {
      success: false,
      previousPosition: null,
      newPosition: null,
      wasPositionChanged: false,
      error: new Error(message),
    };
  }
}

/**
 * Export singleton instance
 */
export const cursorManager = CursorManager.getInstance();
