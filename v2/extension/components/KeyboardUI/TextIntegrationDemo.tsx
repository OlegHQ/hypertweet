/**
 * Text Integration Demo - Task D1 Integration Demonstration
 * 
 * Showcases the integration of text area management, content insertion,
 * and cursor management utilities with the keyboard UI system.
 */

import React, { useEffect, useRef, useState, useCallback, forwardRef } from 'react';
import type { Platform } from '../../injection/types.js';
import type { 
  TargetElement, 
  ToneActionHandler, 
  QuickActionHandler,
  BaseKeyboardProps,
} from './types.js';
import {
  textAreaManager,
  contentInsertionService,
  cursorManager,
  type TextAreaState,
  type ContentInsertionResult,
  type CursorPosition,
  type TextAreaDetectionResult,
} from '../../injection/index.js';

/**
 * Text integration configuration
 */
export interface TextIntegrationConfig {
  readonly enableAutomaticDetection: boolean;
  readonly preserveCursorPosition: boolean;
  readonly respectCharacterLimits: boolean;
  readonly formatForPlatform: boolean;
  readonly enableUndoRedo: boolean;
  readonly monitorChanges: boolean;
}

/**
 * Text integration metrics
 */
export interface TextIntegrationMetrics {
  readonly textAreasDetected: number;
  readonly insertionsPerformed: number;
  readonly averageInsertionTime: number;
  readonly cursorOperations: number;
  readonly undoRedoOperations: number;
  readonly detectionTime: number;
}

/**
 * Text integration demo props
 */
export interface TextIntegrationDemoProps extends Omit<BaseKeyboardProps, 'onToneSelect' | 'onQuickAction'> {
  readonly config?: Partial<TextIntegrationConfig>;
  readonly onTextAreaDetected?: (textAreas: readonly TextAreaState[]) => void;
  readonly onContentInserted?: (result: ContentInsertionResult) => void;
  readonly onCursorMoved?: (position: CursorPosition) => void;
  readonly onToneSelect?: ToneActionHandler;
  readonly onQuickAction?: QuickActionHandler;
  readonly showMetrics?: boolean;
  readonly autoDetectInterval?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: TextIntegrationConfig = {
  enableAutomaticDetection: true,
  preserveCursorPosition: true,
  respectCharacterLimits: true,
  formatForPlatform: true,
  enableUndoRedo: true,
  monitorChanges: true,
};

/**
 * Text Integration Demo Component showcasing Task D1 capabilities
 */
export const TextIntegrationDemo = forwardRef<HTMLDivElement, TextIntegrationDemoProps>(({
  platform,
  targetElement,
  visible = false,
  config = {},
  onTextAreaDetected,
  onContentInserted,
  onCursorMoved,
  onToneSelect,
  onQuickAction,
  showMetrics = false,
  autoDetectInterval = 2000,
  onError: keyboardOnError,
  ...props
}, ref) => {
  // Configuration with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Refs and state
  const containerRef = useRef<HTMLDivElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsRef = useRef<TextIntegrationMetrics>({
    textAreasDetected: 0,
    insertionsPerformed: 0,
    averageInsertionTime: 0,
    cursorOperations: 0,
    undoRedoOperations: 0,
    detectionTime: 0,
  });
  
  const [detectedTextAreas, setDetectedTextAreas] = useState<readonly TextAreaState[]>([]);
  const [activeTextArea, setActiveTextArea] = useState<TextAreaState | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<TextIntegrationMetrics>(metricsRef.current);
  const [detectionResult, setDetectionResult] = useState<TextAreaDetectionResult | null>(null);
  const [lastInsertionResult, setLastInsertionResult] = useState<ContentInsertionResult | null>(null);
  const [currentCursorPosition, setCurrentCursorPosition] = useState<CursorPosition | null>(null);
  
  /**
   * Detect text areas on the page
   */
  const detectTextAreas = useCallback(() => {
    const startTime = performance.now();
    
    try {
      const result = textAreaManager.detectTextAreas({
        platform,
        includeInactive: false,
        includeReadonly: false,
        includeDisabled: false,
        maxResults: 5,
        timeout: 5000,
      });
      
      setDetectionResult(result);
      
      if (result.success) {
        setDetectedTextAreas(result.textAreas);
        setActiveTextArea(result.activeTextArea);
        
        // Update metrics
        const detectionTime = performance.now() - startTime;
        metricsRef.current = {
          ...metricsRef.current,
          textAreasDetected: result.textAreas.length,
          detectionTime,
        };
        
        if (showMetrics) {
          setCurrentMetrics({ ...metricsRef.current });
        }
        
        // Notify parent
        onTextAreaDetected?.(result.textAreas);
        
        // Start monitoring if enabled
        if (finalConfig.monitorChanges) {
          for (const textArea of result.textAreas) {
            textAreaManager.startMonitoring(textArea.id);
          }
        }
      }
    } catch (error) {
      console.error('Text area detection failed:', error);
    }
  }, [platform, finalConfig.monitorChanges, onTextAreaDetected, showMetrics]);
  
  /**
   * Enhanced tone select handler with text integration
   */
  const handleToneSelect: ToneActionHandler = useCallback(async (action) => {
    const { tone, mode, targetElement: target } = action;
    
    if (!activeTextArea) {
      console.warn('No active text area for tone insertion');
      return;
    }
    
    const startTime = performance.now();
    
    try {
      // Save cursor position if preservation is enabled
      if (finalConfig.preserveCursorPosition) {
        cursorManager.savePosition(activeTextArea.id, 'before-tone-insert');
      }
      
      // Generate sample content based on tone
      const sampleContent = generateSampleContent(tone, platform);
      
      // Insert content with platform-specific formatting
      const insertionResult = contentInsertionService.insertContent(
        activeTextArea.id,
        sampleContent,
        {
          mode: mode === 'quick' ? 'insert' : 'replace',
          format: 'auto',
          preserveSelection: finalConfig.preserveCursorPosition,
          preserveUndo: finalConfig.enableUndoRedo,
          respectCharacterLimit: finalConfig.respectCharacterLimits,
          formatForPlatform: finalConfig.formatForPlatform,
          triggerEvents: true,
          sanitizeContent: true,
        }
      );
      
      setLastInsertionResult(insertionResult);
      onContentInserted?.(insertionResult);
      
      // Update metrics
      const insertionTime = performance.now() - startTime;
      metricsRef.current = {
        ...metricsRef.current,
        insertionsPerformed: metricsRef.current.insertionsPerformed + 1,
        averageInsertionTime: (metricsRef.current.averageInsertionTime + insertionTime) / 2,
      };
      
      if (showMetrics) {
        setCurrentMetrics({ ...metricsRef.current });
      }
      
      // Call original handler
      await onToneSelect?.(action);
      
    } catch (error) {
      console.error('Tone insertion failed:', error);
    }
  }, [activeTextArea, finalConfig, platform, onContentInserted, onToneSelect, showMetrics]);
  
  /**
   * Enhanced quick action handler with text operations
   */
  const handleQuickAction: QuickActionHandler = useCallback(async (action) => {
    const { action: actionType, targetElement: target } = action;
    
    if (!activeTextArea) {
      console.warn('No active text area for quick action');
      return;
    }
    
    try {
      switch (actionType) {
        case 'clear':
          contentInsertionService.replaceContent(activeTextArea.id, '', {
            preserveUndo: finalConfig.enableUndoRedo,
          });
          break;
        
        case 'copy': {
          const selectedText = cursorManager.getSelectedText(activeTextArea.id);
          if (selectedText) {
            await navigator.clipboard.writeText(selectedText);
          }
          break;
        }
        
        case 'undo':
          if (finalConfig.enableUndoRedo) {
            textAreaManager.undo(activeTextArea.id);
            metricsRef.current = {
              ...metricsRef.current,
              undoRedoOperations: metricsRef.current.undoRedoOperations + 1,
            };
          }
          break;
        
        case 'redo':
          if (finalConfig.enableUndoRedo) {
            textAreaManager.redo(activeTextArea.id);
            metricsRef.current = {
              ...metricsRef.current,
              undoRedoOperations: metricsRef.current.undoRedoOperations + 1,
            };
          }
          break;
        
        case 'select-all':
          cursorManager.performSelection(activeTextArea.id, 'select-all');
          metricsRef.current = {
            ...metricsRef.current,
            cursorOperations: metricsRef.current.cursorOperations + 1,
          };
          break;
      }
      
      if (showMetrics) {
        setCurrentMetrics({ ...metricsRef.current });
      }
      
      // Call original handler
      await onQuickAction?.(action);
      
    } catch (error) {
      console.error('Quick action failed:', error);
    }
  }, [activeTextArea, finalConfig, onQuickAction, showMetrics]);
  
  /**
   * Update cursor position display
   */
  const updateCursorPosition = useCallback(() => {
    if (!activeTextArea) {
      return;
    }
    
    const position = cursorManager.getCursorPosition(activeTextArea.id);
    if (position) {
      setCurrentCursorPosition(position);
      onCursorMoved?.(position);
    }
  }, [activeTextArea, onCursorMoved]);
  
  /**
   * Initialize automatic detection
   */
  useEffect(() => {
    if (finalConfig.enableAutomaticDetection && visible) {
      // Initial detection
      void detectTextAreas();
      
      // Set up periodic detection
      detectionIntervalRef.current = setInterval(() => {
        void detectTextAreas();
      }, autoDetectInterval);
      
      return () => {
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
        }
      };
    }
  }, [finalConfig.enableAutomaticDetection, visible, detectTextAreas, autoDetectInterval]);
  
  /**
   * Monitor cursor position changes
   */
  useEffect(() => {
    if (!activeTextArea) {
      return;
    }
    
    const interval = setInterval(updateCursorPosition, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [activeTextArea, updateCursorPosition]);
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Stop monitoring all text areas
      for (const textArea of detectedTextAreas) {
        textAreaManager.stopMonitoring(textArea.id);
      }
      
      // Clear intervals
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [detectedTextAreas]);
  
  /**
   * Generate sample content based on tone and platform
   */
  const generateSampleContent = (tone: string, platform: Platform): string => {
    const samples = {
      twitter: {
        professional: 'Sharing insights on the latest industry developments. #ThoughtLeadership',
        friendly: 'Hope everyone is having a great day! 😊',
        casual: 'Just my two cents on this topic...',
        formal: 'I would like to formally address this matter.',
      },
      linkedin: {
        professional: 'I am pleased to share my perspective on this important industry topic. Looking forward to engaging with fellow professionals.',
        friendly: 'Great to connect with like-minded professionals in our industry!',
        casual: 'Interesting thoughts on this - would love to hear what others think.',
        formal: 'I would like to formally present my analysis of the current market conditions.',
      },
      reddit: {
        professional: 'Based on my experience in this field, I believe this approach has merit.',
        friendly: 'Thanks for sharing! This is really helpful.',
        casual: 'This is pretty cool, thanks for posting!',
        formal: 'I would like to respectfully present an alternative viewpoint.',
      },
    };
    
    return samples[platform]?.[tone as keyof typeof samples[typeof platform]] ?? 
           `Sample ${tone} content for ${platform}`;
  };
  
  if (!visible) {
    return null;
  }
  
  return (
    <div
      ref={ref ?? containerRef}
      className={`text-integration-demo text-integration-demo--${platform}`}
      data-platform={platform}
      {...props}
    >
      <div className="text-integration-demo__header">
        <h3>Text Integration Demo (Task D1)</h3>
        <p>Platform: {platform} | Text Areas: {detectedTextAreas.length}</p>
      </div>
      
      <div className="text-integration-demo__content">
        {/* Detection Status */}
        <div className="text-integration-demo__section">
          <h4>Detection Status</h4>
          <div>
            <strong>Success:</strong> {detectionResult?.success ? 'Yes' : 'No'}
          </div>
          {detectionResult?.error && (
            <div className="error">
              <strong>Error:</strong> {detectionResult.error.message}
            </div>
          )}
          <div>
            <strong>Detection Time:</strong> {detectionResult?.detectionTime.toFixed(2)}ms
          </div>
        </div>
        
        {/* Active Text Area Info */}
        {activeTextArea && (
          <div className="text-integration-demo__section">
            <h4>Active Text Area</h4>
            <div><strong>ID:</strong> {activeTextArea.id}</div>
            <div><strong>Type:</strong> {activeTextArea.type}</div>
            <div><strong>Characters:</strong> {activeTextArea.characterCount}</div>
            {activeTextArea.characterLimit && (
              <div><strong>Limit:</strong> {activeTextArea.characterLimit}</div>
            )}
            <div><strong>Has Content:</strong> {activeTextArea.hasContent ? 'Yes' : 'No'}</div>
          </div>
        )}
        
        {/* Cursor Position */}
        {currentCursorPosition && (
          <div className="text-integration-demo__section">
            <h4>Cursor Position</h4>
            <div><strong>Start:</strong> {currentCursorPosition.start}</div>
            <div><strong>End:</strong> {currentCursorPosition.end}</div>
            <div><strong>Selected:</strong> {currentCursorPosition.selectedText || 'None'}</div>
            <div><strong>Collapsed:</strong> {currentCursorPosition.isCollapsed ? 'Yes' : 'No'}</div>
          </div>
        )}
        
        {/* Last Insertion Result */}
        {lastInsertionResult && (
          <div className="text-integration-demo__section">
            <h4>Last Insertion</h4>
            <div><strong>Success:</strong> {lastInsertionResult.success ? 'Yes' : 'No'}</div>
            <div><strong>Characters Inserted:</strong> {lastInsertionResult.charactersInserted}</div>
            <div><strong>Content Modified:</strong> {lastInsertionResult.wasContentModified ? 'Yes' : 'No'}</div>
            {lastInsertionResult.error && (
              <div className="error">
                <strong>Error:</strong> {lastInsertionResult.error.message}
              </div>
            )}
          </div>
        )}
        
        {/* Metrics */}
        {showMetrics && (
          <div className="text-integration-demo__section">
            <h4>Performance Metrics</h4>
            <div><strong>Text Areas Detected:</strong> {currentMetrics.textAreasDetected}</div>
            <div><strong>Insertions Performed:</strong> {currentMetrics.insertionsPerformed}</div>
            <div><strong>Avg Insertion Time:</strong> {currentMetrics.averageInsertionTime.toFixed(2)}ms</div>
            <div><strong>Cursor Operations:</strong> {currentMetrics.cursorOperations}</div>
            <div><strong>Undo/Redo Operations:</strong> {currentMetrics.undoRedoOperations}</div>
          </div>
        )}
        
        {/* Demo Actions */}
        <div className="text-integration-demo__actions">
          <button
            type="button"
            onClick={() => void detectTextAreas()}
          >
            Detect Text Areas
          </button>
          
          <button
            type="button"
            onClick={() => void handleToneSelect({
              tone: 'professional',
              mode: 'quick',
              targetElement,
            })}
            disabled={!activeTextArea}
          >
            Insert Professional Tone
          </button>
          
          <button
            type="button"
            onClick={() => void handleQuickAction({
              action: 'clear',
              targetElement,
            })}
            disabled={!activeTextArea}
          >
            Clear Content
          </button>
          
          <button
            type="button"
            onClick={() => void handleQuickAction({
              action: 'undo',
              targetElement,
            })}
            disabled={!activeTextArea}
          >
            Undo
          </button>
          
          <button
            type="button"
            onClick={() => void handleQuickAction({
              action: 'select-all',
              targetElement,
            })}
            disabled={!activeTextArea}
          >
            Select All
          </button>
        </div>
      </div>
    </div>
  );
});

TextIntegrationDemo.displayName = 'TextIntegrationDemo';

/**
 * Hook for managing text area integration
 */
export function useTextAreaIntegration(platform: Platform) {
  const [textAreas, setTextAreas] = useState<readonly TextAreaState[]>([]);
  const [activeTextArea, setActiveTextArea] = useState<TextAreaState | null>(null);
  
  const detectTextAreas = useCallback(() => {
    const result = textAreaManager.detectTextAreas({
      platform,
      includeInactive: false,
      includeReadonly: false,
      includeDisabled: false,
      maxResults: 10,
      timeout: 5000,
    });
    
    if (result.success) {
      setTextAreas(result.textAreas);
      setActiveTextArea(result.activeTextArea);
    }
    
    return result;
  }, [platform]);
  
  const insertContent = useCallback((
    textAreaId: string,
    content: string,
    options?: Partial<Parameters<typeof contentInsertionService.insertContent>[2]>
  ) => {
    return contentInsertionService.insertContent(textAreaId, content, options);
  }, []);
  
  const moveCursor = useCallback((
    textAreaId: string,
    direction: Parameters<typeof cursorManager.moveCursor>[1]
  ) => {
    return cursorManager.moveCursor(textAreaId, direction);
  }, []);
  
  return {
    textAreas,
    activeTextArea,
    detectTextAreas,
    insertContent,
    moveCursor,
    textAreaManager,
    contentInsertionService,
    cursorManager,
  };
}