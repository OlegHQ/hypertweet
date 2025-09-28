/**
 * ToneCard component for displaying individual tone previews
 * Features action buttons, usage statistics, favorite toggle, and responsive design
 */

import React, { useState, forwardRef } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../../styles/theme';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { type Tone, type ToneCategory, toneCategories } from '../types';

/**
 * Tone card props interface
 */
export interface ToneCardProps {
  readonly tone: Tone;
  readonly viewMode?: 'grid' | 'list';
  readonly showStats?: boolean;
  readonly showPreview?: boolean;
  readonly selected?: boolean;
  readonly onEdit?: (tone: Tone) => void;
  readonly onDelete?: (tone: Tone) => void;
  readonly onToggleFavorite?: (tone: Tone) => void;
  readonly onPreview?: (tone: Tone) => void;
  readonly onSelect?: (tone: Tone, selected: boolean) => void;
  readonly className?: string;
}

/**
 * Card container styles
 */
const cardContainerStyles = (
  theme: ThemeType,
  viewMode: 'grid' | 'list',
  selected: boolean
) => css`
  position: relative;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border: 2px solid
    ${selected ? theme.colors.interactive.primary : 'transparent'};

  ${viewMode === 'list' &&
  `
    display: flex;
    align-items: center;
    padding: ${theme.spacing[4]};
  `}

  &:hover {
    transform: ${viewMode === 'grid' ? 'translateY(-2px)' : 'none'};
    box-shadow: ${theme.shadows.md};
  }

  &:focus-within {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
  }
`;

/**
 * Card content styles for list view
 */
const listContentStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  width: 100%;
  gap: ${theme.spacing[4]};
`;

/**
 * Header section styles
 */
const headerStyles = (theme: ThemeType, viewMode: 'grid' | 'list') => css`
  display: flex;
  align-items: ${viewMode === 'list' ? 'center' : 'flex-start'};
  justify-content: space-between;
  margin-bottom: ${viewMode === 'grid' ? theme.spacing[3] : theme.spacing[1]};
  gap: ${theme.spacing[2]};
  ${viewMode === 'list' && 'flex: 1;'}
`;

/**
 * Title section styles
 */
const titleSectionStyles = (theme: ThemeType, viewMode: 'grid' | 'list') => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  flex: 1;
  min-width: 0;
  ${viewMode === 'list' && 'flex-direction: row;'}
`;

/**
 * Category badge styles
 */
const categoryBadgeStyles = (theme: ThemeType, category: ToneCategory) => css`
  display: inline-flex;
  align-items: center;
  padding: ${theme.spacing[1]} ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.medium};
  background-color: ${toneCategories[category].color}20;
  color: ${toneCategories[category].color};
  border: 1px solid ${toneCategories[category].color}40;
  flex-shrink: 0;
`;

/**
 * Title styles
 */
const titleStyles = (theme: ThemeType, viewMode: 'grid' | 'list') => css`
  font-size: ${viewMode === 'grid'
    ? theme.typography.fontSize.lg
    : theme.typography.fontSize.base};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin: 0;
  line-height: ${theme.typography.lineHeight.snug};
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * Action buttons container styles
 */
const actionsStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[1]};
  flex-shrink: 0;
`;

/**
 * Favorite button styles
 */
const favoriteButtonStyles = (theme: ThemeType, isFavorite: boolean) => css`
  background: none;
  border: none;
  padding: ${theme.spacing[1]};
  cursor: pointer;
  border-radius: ${theme.borderRadius.sm};
  color: ${isFavorite
    ? theme.colors.status.warning
    : theme.colors.text.tertiary};
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: ${theme.colors.background.secondary};
    color: ${theme.colors.status.warning};
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

/**
 * Description styles
 */
const descriptionStyles = (theme: ThemeType, viewMode: 'grid' | 'list') => css`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  margin: 0 0 ${viewMode === 'grid' ? theme.spacing[4] : theme.spacing[2]} 0;
  line-height: ${theme.typography.lineHeight.relaxed};

  ${viewMode === 'grid' &&
  `
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}

  ${viewMode === 'list' &&
  `
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `}
`;

/**
 * Stats section styles
 */
const statsStyles = (theme: ThemeType, viewMode: 'grid' | 'list') => css`
  display: ${viewMode === 'list' ? 'flex' : 'grid'};
  ${viewMode === 'grid' &&
  `
    grid-template-columns: repeat(2, 1fr);
    gap: ${theme.spacing[3]};
    margin-bottom: ${theme.spacing[4]};
  `}
  ${viewMode === 'list' &&
  `
    align-items: center;
    gap: ${theme.spacing[4]};
    flex-shrink: 0;
  `}
`;

/**
 * Stat item styles
 */
const statItemStyles = (viewMode: 'grid' | 'list') => css`
  text-align: ${viewMode === 'grid' ? 'center' : 'left'};
`;

/**
 * Stat value styles
 */
const statValueStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin: 0;
  line-height: ${theme.typography.lineHeight.none};
`;

/**
 * Stat label styles
 */
const statLabelStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.xs};
  color: ${theme.colors.text.tertiary};
  margin: 0;
  margin-top: ${theme.spacing[1]};
`;

/**
 * Footer actions styles
 */
const footerActionsStyles = (
  theme: ThemeType,
  viewMode: 'grid' | 'list'
) => css`
  display: flex;
  gap: ${theme.spacing[2]};
  ${viewMode === 'list' && 'flex-shrink: 0;'}
`;

/**
 * Status indicators styles
 */
const statusIndicatorsStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  margin-bottom: ${theme.spacing[2]};
`;

/**
 * Status badge styles
 */
const statusBadgeStyles = (
  theme: ThemeType,
  type: 'default' | 'inactive'
) => css`
  display: inline-flex;
  align-items: center;
  padding: ${theme.spacing[1]} ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.medium};

  ${type === 'default' &&
  `
    background-color: ${theme.colors.interactive.primary}20;
    color: ${theme.colors.interactive.primary};
    border: 1px solid ${theme.colors.interactive.primary}40;
  `}

  ${type === 'inactive' &&
  `
    background-color: ${theme.colors.text.tertiary}20;
    color: ${theme.colors.text.tertiary};
    border: 1px solid ${theme.colors.text.tertiary}40;
  `}
`;

/**
 * Selection checkbox styles
 */
const checkboxStyles = (theme: ThemeType) => css`
  position: absolute;
  top: ${theme.spacing[2]};
  left: ${theme.spacing[2]};
  z-index: 1;
`;

/**
 * Star icon component
 */
const StarIcon: React.FC<{ readonly filled?: boolean }> = ({
  filled = false,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={2}
  >
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

/**
 * Edit icon component
 */
const EditIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

/**
 * Trash icon component
 */
const TrashIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="3,6 5,6 21,6" />
    <path d="M19,6V20a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6M8,6V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2V6" />
  </svg>
);

/**
 * Eye icon component
 */
const EyeIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/**
 * Format number with suffix
 */
const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

/**
 * Format percentage
 */
const formatPercentage = (num: number): string => `${num}%`;

/**
 * Tone card component with comprehensive tone preview and management features
 */
export const ToneCard = forwardRef<HTMLDivElement, ToneCardProps>(
  (
    {
      tone,
      viewMode = 'grid',
      showStats = true,
      showPreview = true,
      selected = false,
      onEdit,
      onDelete,
      onToggleFavorite,
      onPreview,
      onSelect,
      className,
    },
    ref
  ) => {
    const theme = defaultTheme;
    const [isActionsVisible, setIsActionsVisible] = useState(false);

    const handleCardClick = (e: React.MouseEvent): void => {
      // Don't trigger card click if clicking on action buttons
      if ((e.target as HTMLElement).closest('button')) {
        return;
      }

      if (onSelect) {
        onSelect(tone, !selected);
      } else if (onPreview) {
        onPreview(tone);
      }
    };

    const handleFavoriteClick = (e: React.MouseEvent): void => {
      e.stopPropagation();
      onToggleFavorite?.(tone);
    };

    const handleEditClick = (e: React.MouseEvent): void => {
      e.stopPropagation();
      onEdit?.(tone);
    };

    const handleDeleteClick = (e: React.MouseEvent): void => {
      e.stopPropagation();
      onDelete?.(tone);
    };

    const handlePreviewClick = (e: React.MouseEvent): void => {
      e.stopPropagation();
      onPreview?.(tone);
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (onPreview) {
          onPreview(tone);
        }
      }
    };

    const cardContent = (
      <div
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsActionsVisible(true)}
        onMouseLeave={() => setIsActionsVisible(false)}
        tabIndex={0}
        role="button"
        aria-label={`Tone: ${tone.name} - ${tone.description}`}
      >
        {onSelect && (
          <div css={checkboxStyles(theme)}>
            <input
              type="checkbox"
              checked={selected}
              onChange={e => onSelect(tone, e.target.checked)}
              onClick={e => e.stopPropagation()}
              aria-label={`Select ${tone.name}`}
            />
          </div>
        )}

        {viewMode === 'grid' ? (
          <>
            {/* Grid View Layout */}
            <div css={statusIndicatorsStyles(theme)}>
              <div css={categoryBadgeStyles(theme, tone.category)}>
                {toneCategories[tone.category].label}
              </div>
              {tone.isDefault && (
                <div css={statusBadgeStyles(theme, 'default')}>Default</div>
              )}
              {!tone.isActive && (
                <div css={statusBadgeStyles(theme, 'inactive')}>Inactive</div>
              )}
            </div>

            <div css={headerStyles(theme, viewMode)}>
              <div css={titleSectionStyles(theme, viewMode)}>
                <h3 css={titleStyles(theme, viewMode)}>{tone.name}</h3>
              </div>
              <div css={actionsStyles(theme)}>
                <button
                  type="button"
                  css={favoriteButtonStyles(theme, tone.isFavorite)}
                  onClick={handleFavoriteClick}
                  aria-label={
                    tone.isFavorite
                      ? 'Remove from favorites'
                      : 'Add to favorites'
                  }
                  title={
                    tone.isFavorite
                      ? 'Remove from favorites'
                      : 'Add to favorites'
                  }
                >
                  <StarIcon filled={tone.isFavorite} />
                </button>
              </div>
            </div>

            <p css={descriptionStyles(theme, viewMode)}>{tone.description}</p>

            {showStats && (
              <div css={statsStyles(theme, viewMode)}>
                <div css={statItemStyles(viewMode)}>
                  <p css={statValueStyles(theme)}>
                    {formatNumber(tone.stats.totalUses)}
                  </p>
                  <p css={statLabelStyles(theme)}>Uses</p>
                </div>
                <div css={statItemStyles(viewMode)}>
                  <p css={statValueStyles(theme)}>
                    {formatPercentage(tone.stats.successRate)}
                  </p>
                  <p css={statLabelStyles(theme)}>Success</p>
                </div>
              </div>
            )}

            <div css={footerActionsStyles(theme, viewMode)}>
              {onEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEditClick}
                  icon={<EditIcon />}
                  iconPosition="left"
                >
                  Edit
                </Button>
              )}
              {onPreview && showPreview && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePreviewClick}
                  icon={<EyeIcon />}
                  iconPosition="left"
                >
                  Preview
                </Button>
              )}
              {onDelete && isActionsVisible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteClick}
                  icon={<TrashIcon />}
                  iconPosition="left"
                  aria-label="Delete tone"
                >
                  Delete
                </Button>
              )}
            </div>
          </>
        ) : (
          /* List View Layout */
          <div css={listContentStyles(theme)}>
            <div css={headerStyles(theme, viewMode)}>
              <div css={titleSectionStyles(theme, viewMode)}>
                <div css={categoryBadgeStyles(theme, tone.category)}>
                  {toneCategories[tone.category].label}
                </div>
                <h3 css={titleStyles(theme, viewMode)}>{tone.name}</h3>
              </div>
              <button
                type="button"
                css={favoriteButtonStyles(theme, tone.isFavorite)}
                onClick={handleFavoriteClick}
                aria-label={
                  tone.isFavorite ? 'Remove from favorites' : 'Add to favorites'
                }
              >
                <StarIcon filled={tone.isFavorite} />
              </button>
            </div>

            <p css={descriptionStyles(theme, viewMode)}>{tone.description}</p>

            {showStats && (
              <div css={statsStyles(theme, viewMode)}>
                <div css={statItemStyles(viewMode)}>
                  <p css={statValueStyles(theme)}>
                    {formatNumber(tone.stats.totalUses)}
                  </p>
                  <p css={statLabelStyles(theme)}>Uses</p>
                </div>
                <div css={statItemStyles(viewMode)}>
                  <p css={statValueStyles(theme)}>
                    {formatPercentage(tone.stats.successRate)}
                  </p>
                  <p css={statLabelStyles(theme)}>Success</p>
                </div>
              </div>
            )}

            <div css={footerActionsStyles(theme, viewMode)}>
              {onEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEditClick}
                  icon={<EditIcon />}
                  iconPosition="left"
                >
                  Edit
                </Button>
              )}
              {onPreview && showPreview && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePreviewClick}
                  icon={<EyeIcon />}
                  iconPosition="left"
                >
                  Preview
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteClick}
                  icon={<TrashIcon />}
                  iconPosition="left"
                  aria-label="Delete tone"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );

    return (
      <div
        ref={ref}
        css={cardContainerStyles(theme, viewMode, selected)}
        className={className}
      >
        <Card variant="elevated" size="md">
          {cardContent}
        </Card>
      </div>
    );
  }
);

ToneCard.displayName = 'ToneCard';
