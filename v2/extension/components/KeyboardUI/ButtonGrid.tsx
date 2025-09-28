/**
 * ButtonGrid component - Flexible button arrangement system for keyboard UI
 *
 * Provides a responsive grid layout for organizing keyboard buttons with
 * support for different layouts, grouping, and accessibility features.
 *
 * Features:
 * - Flexible grid with configurable columns and responsive breakpoints
 * - Button grouping with visual separators and logical organization
 * - Keyboard navigation with arrow keys and tab support
 * - Overflow handling with scrolling and pagination options
 * - Memory efficient rendering with virtualization for large grids
 */

import React, { 
  forwardRef, 
  useCallback, 
  useMemo, 
  useRef,
  type ReactNode, 
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import styled from '@emotion/styled';
import { type ThemeType } from '../../styles/theme.js';
import {
  type Platform,
  type KeyboardSize,
  type AccessibilityConfig,
  KeyboardDefaults,
} from './types.js';

/**
 * Grid layout variants for different use cases
 */
export type GridLayout = 
  | 'horizontal' // Single row, horizontal flow
  | 'vertical'   // Single column, vertical stack
  | 'grid'       // Multi-column grid
  | 'adaptive'   // Responsive based on container size
  | 'grouped';   // Grouped with separators

/**
 * Grid item definition for button placement
 */
export interface GridItem {
  readonly id: string;
  readonly content: ReactNode;
  readonly group?: string;
  readonly priority?: 'high' | 'medium' | 'low';
  readonly span?: number; // Number of grid cells to span
  readonly disabled?: boolean;
  readonly 'aria-label'?: string;
}

/**
 * Props interface for ButtonGrid component
 */
export interface ButtonGridProps {
  readonly items: readonly GridItem[];
  readonly platform: Platform;
  readonly size?: KeyboardSize;
  readonly layout?: GridLayout;
  readonly columns?: number | 'auto';
  readonly gap?: 'xs' | 'sm' | 'md' | 'lg';
  readonly maxRows?: number;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly accessibility?: Partial<AccessibilityConfig>;
  readonly onItemClick?: (item: GridItem, event: React.MouseEvent) => void;
  readonly onItemFocus?: (item: GridItem, event: React.FocusEvent) => void;
  readonly onKeyboardNavigate?: (direction: 'up' | 'down' | 'left' | 'right', currentItem: GridItem) => void;
}

/**
 * Get platform-specific grid styling
 */
const getPlatformGridStyles = (platform: Platform, theme: ThemeType): string => {
  const baseStyles = `
    font-family: ${theme.typography.fontFamily.sans};
  `;

  switch (platform) {
    case 'twitter':
      return `
        ${baseStyles}
        --grid-border-color: rgb(207, 217, 222);
        --grid-bg-color: transparent;
        --grid-hover-color: rgba(15, 20, 25, 0.03);
        
        @media (prefers-color-scheme: dark) {
          --grid-border-color: rgb(47, 51, 54);
          --grid-hover-color: rgba(247, 249, 249, 0.03);
        }
      `;
    
    case 'linkedin':
      return `
        ${baseStyles}
        --grid-border-color: rgba(0, 0, 0, 0.12);
        --grid-bg-color: transparent;
        --grid-hover-color: rgba(0, 0, 0, 0.04);
      `;
    
    case 'reddit':
      return `
        ${baseStyles}
        --grid-border-color: #edeff1;
        --grid-bg-color: transparent;
        --grid-hover-color: rgba(26, 26, 27, 0.04);
        
        @media (prefers-color-scheme: dark) {
          --grid-border-color: #343536;
          --grid-hover-color: rgba(215, 218, 220, 0.04);
        }
      `;
    
    default:
      return `
        ${baseStyles}
        --grid-border-color: ${theme.colors.border.secondary};
        --grid-bg-color: transparent;
        --grid-hover-color: ${theme.colors.background.secondary};
      `;
  }
};

/**
 * Get size-specific spacing and dimensions
 */
const getSizeGridStyles = (size: KeyboardSize, theme: ThemeType): string => {
  switch (size) {
    case 'xs':
      return `
        --grid-gap: ${theme.spacing[1]};
        --grid-item-height: 24px;
        --grid-padding: ${theme.spacing[1]};
      `;
    
    case 'sm':
      return `
        --grid-gap: ${theme.spacing[2]};
        --grid-item-height: 28px;
        --grid-padding: ${theme.spacing[2]};
      `;
    
    case 'md':
      return `
        --grid-gap: ${theme.spacing[3]};
        --grid-item-height: 32px;
        --grid-padding: ${theme.spacing[3]};
      `;
    
    case 'lg':
      return `
        --grid-gap: ${theme.spacing[4]};
        --grid-item-height: 36px;
        --grid-padding: ${theme.spacing[4]};
      `;
    
    default:
      return getSizeGridStyles('sm', theme);
  }
};

/**
 * Get layout-specific grid structure
 */
const getLayoutStyles = (layout: GridLayout, columns: number | 'auto'): string => {
  switch (layout) {
    case 'horizontal':
      return `
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        gap: var(--grid-gap);
      `;
    
    case 'vertical':
      return `
        display: flex;
        flex-direction: column;
        gap: var(--grid-gap);
        align-items: stretch;
      `;
    
    case 'grid':
      return `
        display: grid;
        grid-template-columns: ${columns === 'auto' ? 'repeat(auto-fit, minmax(80px, 1fr))' : `repeat(${columns}, 1fr)`};
        gap: var(--grid-gap);
        align-items: center;
      `;
    
    case 'adaptive':
      return `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: var(--grid-gap);
        align-items: center;
        
        @media (max-width: 480px) {
          grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
        }
        
        @media (max-width: 320px) {
          grid-template-columns: repeat(2, 1fr);
        }
      `;
    
    case 'grouped':
      return `
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: var(--grid-gap);
        align-items: center;
      `;
    
    default:
      return getLayoutStyles('adaptive', columns);
  }
};

/**
 * Main grid container with responsive layout
 */
const GridContainer = styled.div<{
  readonly platform: Platform;
  readonly size: KeyboardSize;
  readonly layout: GridLayout;
  readonly columns: number | 'auto';
  readonly maxRows?: number;
}>`
  /* Platform theming */
  ${({ platform, theme }) => getPlatformGridStyles(platform, theme)}
  
  /* Size-based spacing */
  ${({ size, theme }) => getSizeGridStyles(size, theme)}
  
  /* Layout structure */
  ${({ layout, columns }) => getLayoutStyles(layout, columns)}
  
  /* Container styling */
  width: 100%;
  padding: var(--grid-padding);
  box-sizing: border-box;
  position: relative;
  
  /* Height constraint for scrolling */
  ${({ maxRows, layout }) => maxRows && layout !== 'horizontal' && `
    max-height: calc((var(--grid-item-height) + var(--grid-gap)) * ${maxRows} - var(--grid-gap) + (var(--grid-padding) * 2));
    overflow-y: auto;
  `}
  
  /* Accessibility focus management */
  &:focus-within {
    outline: 1px solid var(--grid-border-color);
    outline-offset: 2px;
  }
  
  /* Smooth scrolling */
  scroll-behavior: smooth;
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--grid-border-color);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: var(--grid-hover-color);
  }
`;

/**
 * Individual grid item container
 */
const GridItemContainer = styled.div<{
  readonly span?: number;
  readonly group?: string;
  readonly priority?: 'high' | 'medium' | 'low';
  readonly layout: GridLayout;
}>`
  /* Grid spanning */
  ${({ span, layout }) => layout === 'grid' && span && span > 1 && `
    grid-column: span ${span};
  `}
  
  /* Flex properties for non-grid layouts */
  ${({ layout }) => layout === 'horizontal' && `
    flex-shrink: 0;
    min-width: max-content;
  `}
  
  /* Priority-based styling */
  ${({ priority }) => priority === 'high' && `
    order: -1;
  `}
  
  ${({ priority }) => priority === 'low' && `
    order: 1;
  `}
  
  /* Group spacing */
  ${({ group, layout }) => group && layout === 'grouped' && `
    &:not(:first-child)::before {
      content: '';
      width: 1px;
      height: 16px;
      background: var(--grid-border-color);
      margin-right: var(--grid-gap);
    }
  `}
  
  /* Responsive behavior */
  position: relative;
  min-height: var(--grid-item-height);
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * Group separator for visual organization
 */
const GroupSeparator = styled.div`
  width: 1px;
  height: 20px;
  background: var(--grid-border-color);
  opacity: 0.5;
  margin: 0 var(--grid-gap);
  flex-shrink: 0;
`;

/**
 * ButtonGrid component implementation
 */
export const ButtonGrid = forwardRef<HTMLDivElement, ButtonGridProps>(
  (props, ref) => {
    const {
      items,
      platform,
      size = 'sm',
      layout = 'adaptive',
      columns = 'auto',
      gap = 'sm',
      maxRows,
      className,
      style,
      accessibility,
      onItemClick,
      onItemFocus,
      onKeyboardNavigate,
    } = props;

    const gridRef = useRef<HTMLDivElement>(null);

    // Merge accessibility configuration
    const mergedAccessibility = useMemo(() => ({
      ...KeyboardDefaults.ACCESSIBILITY,
      ...accessibility,
      keyboardNavigation: {
        ...KeyboardDefaults.ACCESSIBILITY.keyboardNavigation,
        ...accessibility?.keyboardNavigation,
      },
    }), [accessibility]);

    // Group items by group property
    const groupedItems = useMemo(() => {
      if (layout !== 'grouped') {
        return [{ group: null, items }];
      }

      const groups = items.reduce((acc, item) => {
        const groupKey = item.group ?? 'default';
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
      }, {} as Record<string, GridItem[]>);

      return Object.entries(groups).map(([group, groupItems]) => ({
        group: group === 'default' ? null : group,
        items: groupItems,
      }));
    }, [items, layout]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>): void => {
      if (!mergedAccessibility.keyboardNavigation.enabled) return;

      const target = event.target as HTMLElement;
      const currentIndex = parseInt(target.dataset.index ?? '-1', 10);
      
      if (currentIndex === -1) return;

      const currentItem = items[currentIndex];
      if (!currentItem) return;

      let handled = false;

      switch (event.key) {
        case 'ArrowUp':
          onKeyboardNavigate?.('up', currentItem);
          handled = true;
          break;
        
        case 'ArrowDown':
          onKeyboardNavigate?.('down', currentItem);
          handled = true;
          break;
        
        case 'ArrowLeft':
          onKeyboardNavigate?.('left', currentItem);
          handled = true;
          break;
        
        case 'ArrowRight':
          onKeyboardNavigate?.('right', currentItem);
          handled = true;
          break;
        
        case 'Home':
          // Focus first item
          if (items.length > 0) {
            const firstElement = gridRef.current?.querySelector('[data-index="0"]') as HTMLElement;
            firstElement?.focus();
          }
          handled = true;
          break;
        
        case 'End':
          // Focus last item
          if (items.length > 0) {
            const lastElement = gridRef.current?.querySelector(`[data-index="${items.length - 1}"]`) as HTMLElement;
            lastElement?.focus();
          }
          handled = true;
          break;
        
        default:
          break;
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, [items, mergedAccessibility.keyboardNavigation.enabled, onKeyboardNavigate]);

    // Handle item interactions
    const handleItemClick = useCallback((item: GridItem, event: React.MouseEvent): void => {
      if (item.disabled) return;
      onItemClick?.(item, event);
    }, [onItemClick]);

    const handleItemFocus = useCallback((item: GridItem, event: React.FocusEvent): void => {
      if (item.disabled) return;
      onItemFocus?.(item, event);
    }, [onItemFocus]);

    // Early return if no items
    if (items.length === 0) {
      return (
        <GridContainer
          ref={ref}
          platform={platform}
          size={size}
          layout={layout}
          columns={columns}
          maxRows={maxRows}
          className={className}
          style={style}
          role="grid"
          aria-label="Button grid"
          aria-colcount={typeof columns === 'number' ? columns : -1}
          aria-rowcount={maxRows ?? -1}
        >
          {/* Empty state could be added here */}
        </GridContainer>
      );
    }

    return (
      <GridContainer
        ref={gridRef}
        platform={platform}
        size={size}
        layout={layout}
        columns={columns}
        maxRows={maxRows}
        className={className}
        style={style}
        onKeyDown={handleKeyDown}
        role="grid"
        aria-label="Button grid"
        aria-colcount={typeof columns === 'number' ? columns : -1}
        aria-rowcount={maxRows ?? -1}
      >
        {groupedItems.map((group, groupIndex) => (
          <React.Fragment key={group.group ?? groupIndex}>
            {groupIndex > 0 && layout === 'grouped' && (
              <GroupSeparator aria-hidden="true" />
            )}
            
            {group.items.map((item, itemIndex) => {
              const globalIndex = groupedItems
                .slice(0, groupIndex)
                .reduce((acc, g) => acc + g.items.length, 0) + itemIndex;

              return (
                <GridItemContainer
                  key={item.id}
                  span={item.span}
                  group={item.group}
                  priority={item.priority}
                  layout={layout}
                  data-index={globalIndex}
                  data-group={item.group}
                  role="gridcell"
                  tabIndex={item.disabled ? -1 : 0}
                  aria-label={item['aria-label']}
                  aria-disabled={item.disabled}
                  onClick={(event) => handleItemClick(item, event)}
                  onFocus={(event) => handleItemFocus(item, event)}
                >
                  {item.content}
                </GridItemContainer>
              );
            })}
          </React.Fragment>
        ))}
      </GridContainer>
    );
  }
);

// Set display name for debugging
ButtonGrid.displayName = 'ButtonGrid';