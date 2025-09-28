/**
 * TonePreview component for displaying tone previews with sample generation
 * Features modal display, sample text generation, effectiveness metrics, and editing integration
 */

import React, { useState, useEffect, forwardRef } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../../styles/theme';
import { Button } from '../../../components/common/Button';
import { Loading } from '../../../components/common/Loading';
import {
  type Tone,
  type ToneEffectivenessMetrics,
  type ToneCategory,
  toneCategories,
  sampleTexts,
} from '../types';

/**
 * Tone preview props interface
 */
export interface TonePreviewProps {
  readonly tone: Tone;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onEdit?: (tone: Tone) => void;
  readonly onDelete?: (tone: Tone) => void;
  readonly onToggleFavorite?: (tone: Tone) => void;
  readonly className?: string;
}

/**
 * Modal overlay styles
 */
const overlayStyles = (theme: ThemeType, isOpen: boolean) => css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${theme.zIndex.modal};
  opacity: ${isOpen ? 1 : 0};
  visibility: ${isOpen ? 'visible' : 'hidden'};
  transition: all 0.2s ease-in-out;
  padding: ${theme.spacing[4]};
`;

/**
 * Modal content styles
 */
const modalStyles = (theme: ThemeType) => css`
  background-color: ${theme.colors.background.primary};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.xl};
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
`;

/**
 * Modal header styles
 */
const headerStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing[6]};
  border-bottom: 1px solid ${theme.colors.border.primary};
  flex-shrink: 0;
`;

/**
 * Header content styles
 */
const headerContentStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  flex: 1;
`;

/**
 * Title styles
 */
const titleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin: 0;
`;

/**
 * Category badge styles
 */
const categoryBadgeStyles = (theme: ThemeType, category: ToneCategory) => css`
  display: inline-flex;
  align-items: center;
  padding: ${theme.spacing[1]} ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  background-color: ${toneCategories[category].color}20;
  color: ${toneCategories[category].color};
  border: 1px solid ${toneCategories[category].color}40;
`;

/**
 * Close button styles
 */
const closeButtonStyles = (theme: ThemeType) => css`
  background: none;
  border: none;
  padding: ${theme.spacing[2]};
  cursor: pointer;
  border-radius: ${theme.borderRadius.sm};
  color: ${theme.colors.text.secondary};
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: ${theme.colors.background.secondary};
    color: ${theme.colors.text.primary};
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

/**
 * Modal body styles
 */
const bodyStyles = (theme: ThemeType) => css`
  flex: 1;
  overflow-y: auto;
  padding: ${theme.spacing[6]};
`;

/**
 * Section styles
 */
const sectionStyles = (theme: ThemeType) => css`
  margin-bottom: ${theme.spacing[6]};

  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Section title styles
 */
const sectionTitleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin: 0 0 ${theme.spacing[3]} 0;
`;

/**
 * Description styles
 */
const descriptionStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.base};
  color: ${theme.colors.text.secondary};
  line-height: ${theme.typography.lineHeight.relaxed};
  margin: 0 0 ${theme.spacing[4]} 0;
`;

/**
 * Content styles
 */
const contentStyles = (theme: ThemeType) => css`
  background-color: ${theme.colors.background.secondary};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing[4]};
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  line-height: ${theme.typography.lineHeight.relaxed};
  white-space: pre-wrap;
`;

/**
 * Platform selector styles
 */
const platformSelectorStyles = (theme: ThemeType) => css`
  display: flex;
  gap: ${theme.spacing[2]};
  margin-bottom: ${theme.spacing[4]};
`;

/**
 * Platform button styles
 */
const platformButtonStyles = (theme: ThemeType, isActive: boolean) => css`
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border: 1px solid
    ${isActive ? theme.colors.interactive.primary : theme.colors.border.primary};
  background-color: ${isActive
    ? theme.colors.interactive.primary
    : theme.colors.background.primary};
  color: ${isActive ? theme.colors.text.inverse : theme.colors.text.secondary};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.sm};
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: ${theme.colors.interactive.primary};
    color: ${isActive
      ? theme.colors.text.inverse
      : theme.colors.interactive.primary};
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
  }
`;

/**
 * Preview container styles
 */
const previewContainerStyles = (theme: ThemeType) => css`
  background-color: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing[4]};
  position: relative;
  min-height: 120px;
`;

/**
 * Preview text styles
 */
const previewTextStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.base};
  color: ${theme.colors.text.primary};
  line-height: ${theme.typography.lineHeight.relaxed};
  margin: 0;
`;

/**
 * Metrics grid styles
 */
const metricsGridStyles = (theme: ThemeType) => css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${theme.spacing[4]};
`;

/**
 * Metric item styles
 */
const metricItemStyles = (theme: ThemeType) => css`
  text-align: center;
  padding: ${theme.spacing[3]};
  background-color: ${theme.colors.background.secondary};
  border-radius: ${theme.borderRadius.md};
`;

/**
 * Metric value styles
 */
const metricValueStyles = (theme: ThemeType, score: number) => css`
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.bold};
  margin: 0 0 ${theme.spacing[1]} 0;

  color: ${score >= 80
    ? theme.colors.status.success
    : score >= 60
      ? theme.colors.status.warning
      : theme.colors.status.error};
`;

/**
 * Metric label styles
 */
const metricLabelStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  margin: 0;
`;

/**
 * Actions footer styles
 */
const actionsStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing[6]};
  border-top: 1px solid ${theme.colors.border.primary};
  flex-shrink: 0;
`;

/**
 * Action group styles
 */
const actionGroupStyles = (theme: ThemeType) => css`
  display: flex;
  gap: ${theme.spacing[2]};
`;

/**
 * Stats display styles
 */
const statsDisplayStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[4]};
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
`;

/**
 * Close icon component
 */
const CloseIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

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
 * Generate mock preview text based on tone and platform
 */
const generatePreviewText = (tone: Tone, sampleText: string): string => {
  // This is a mock implementation - in real app this would call the API
  const baseText = sampleText;

  // Simple tone application based on category
  switch (tone.category) {
    case 'professional':
      return `${baseText} I appreciate your consideration and look forward to discussing this further.`;
    case 'casual':
      return `${baseText} Let me know what you think!`;
    case 'friendly':
      return `${baseText} Hope this helps, and feel free to reach out if you have any questions!`;
    case 'formal':
      return `${baseText} Thank you for your time and consideration.`;
    case 'humorous':
      return `${baseText} 😄 Life's too short to take everything seriously!`;
    case 'persuasive':
      return `${baseText} This is a game-changer that you won't want to miss out on.`;
    case 'empathetic':
      return `${baseText} I understand this can be challenging, and I'm here to help however I can.`;
    default:
      return baseText;
  }
};

/**
 * Generate mock effectiveness metrics
 */
const generateMetrics = (tone: Tone): ToneEffectivenessMetrics => {
  // Mock implementation - real app would call API
  const base = tone.stats.successRate;
  return {
    clarity: Math.min(100, base + Math.random() * 10 - 5),
    engagement: Math.min(
      100,
      tone.stats.averageEngagement + Math.random() * 10 - 5
    ),
    appropriateness: Math.min(100, base + Math.random() * 8 - 4),
    uniqueness: Math.min(100, 70 + Math.random() * 20),
    overallScore: Math.min(100, base + Math.random() * 8 - 4),
  };
};

/**
 * Platform options
 */
const platforms = [
  { id: 'twitter', label: 'Twitter' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'generic', label: 'Generic' },
] as const;

/**
 * Tone preview component with comprehensive preview and analysis features
 */
export const TonePreview = forwardRef<HTMLDivElement, TonePreviewProps>(
  (
    { tone, isOpen, onClose, onEdit, onDelete, onToggleFavorite, className },
    ref
  ) => {
    const theme = defaultTheme;
    const [selectedPlatform, setSelectedPlatform] = useState<string>('twitter');
    const [previewText, setPreviewText] = useState<string>('');
    const [metrics, setMetrics] = useState<ToneEffectivenessMetrics | null>(
      null
    );
    const [isGenerating, setIsGenerating] = useState(false);

    // Generate preview when tone or platform changes
    useEffect(() => {
      if (isOpen) {
        setIsGenerating(true);

        // Simulate API call delay
        const timer = setTimeout(() => {
          const sample =
            sampleTexts[selectedPlatform] ??
            sampleTexts['generic'] ??
            'Default sample text for tone preview.';
          const generated = generatePreviewText(tone, sample);
          const generatedMetrics = generateMetrics(tone);

          setPreviewText(generated);
          setMetrics(generatedMetrics);
          setIsGenerating(false);
        }, 800);

        return () => clearTimeout(timer);
      }
      // Return undefined explicitly when not isOpen
      return undefined;
    }, [tone, selectedPlatform, isOpen]);

    // Handle escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent): void => {
        if (e.key === 'Escape' && isOpen) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent): void => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    const handleFavoriteClick = (): void => {
      onToggleFavorite?.(tone);
    };

    const handleEditClick = (): void => {
      onEdit?.(tone);
      onClose();
    };

    const handleDeleteClick = (): void => {
      onDelete?.(tone);
      onClose();
    };

    if (!isOpen) {
      return null;
    }

    return (
      <div
        css={overlayStyles(theme, isOpen)}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tone-preview-title"
      >
        <div ref={ref} css={modalStyles(theme)} className={className}>
          {/* Header */}
          <div css={headerStyles(theme)}>
            <div css={headerContentStyles(theme)}>
              <h2 id="tone-preview-title" css={titleStyles(theme)}>
                {tone.name}
              </h2>
              <div css={categoryBadgeStyles(theme, tone.category)}>
                {toneCategories[tone.category].label}
              </div>
            </div>
            <button
              type="button"
              css={closeButtonStyles(theme)}
              onClick={onClose}
              aria-label="Close preview"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Body */}
          <div css={bodyStyles(theme)}>
            {/* Description */}
            <div css={sectionStyles(theme)}>
              <h3 css={sectionTitleStyles(theme)}>Description</h3>
              <p css={descriptionStyles(theme)}>{tone.description}</p>
            </div>

            {/* Tone Content */}
            <div css={sectionStyles(theme)}>
              <h3 css={sectionTitleStyles(theme)}>Tone Instructions</h3>
              <div css={contentStyles(theme)}>{tone.content}</div>
            </div>

            {/* Preview Section */}
            <div css={sectionStyles(theme)}>
              <h3 css={sectionTitleStyles(theme)}>Sample Response</h3>

              {/* Platform Selector */}
              <div css={platformSelectorStyles(theme)}>
                {platforms.map(platform => (
                  <button
                    key={platform.id}
                    type="button"
                    css={platformButtonStyles(
                      theme,
                      selectedPlatform === platform.id
                    )}
                    onClick={() => setSelectedPlatform(platform.id)}
                  >
                    {platform.label}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div css={previewContainerStyles(theme)}>
                {isGenerating ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100px',
                    }}
                  >
                    <Loading size="lg" />
                  </div>
                ) : (
                  <p css={previewTextStyles(theme)}>{previewText}</p>
                )}
              </div>
            </div>

            {/* Effectiveness Metrics */}
            {metrics && !isGenerating && (
              <div css={sectionStyles(theme)}>
                <h3 css={sectionTitleStyles(theme)}>Effectiveness Analysis</h3>
                <div css={metricsGridStyles(theme)}>
                  <div css={metricItemStyles(theme)}>
                    <p css={metricValueStyles(theme, metrics.clarity)}>
                      {Math.round(metrics.clarity)}
                    </p>
                    <p css={metricLabelStyles(theme)}>Clarity</p>
                  </div>
                  <div css={metricItemStyles(theme)}>
                    <p css={metricValueStyles(theme, metrics.engagement)}>
                      {Math.round(metrics.engagement)}
                    </p>
                    <p css={metricLabelStyles(theme)}>Engagement</p>
                  </div>
                  <div css={metricItemStyles(theme)}>
                    <p css={metricValueStyles(theme, metrics.appropriateness)}>
                      {Math.round(metrics.appropriateness)}
                    </p>
                    <p css={metricLabelStyles(theme)}>Appropriate</p>
                  </div>
                  <div css={metricItemStyles(theme)}>
                    <p css={metricValueStyles(theme, metrics.uniqueness)}>
                      {Math.round(metrics.uniqueness)}
                    </p>
                    <p css={metricLabelStyles(theme)}>Unique</p>
                  </div>
                  <div css={metricItemStyles(theme)}>
                    <p css={metricValueStyles(theme, metrics.overallScore)}>
                      {Math.round(metrics.overallScore)}
                    </p>
                    <p css={metricLabelStyles(theme)}>Overall</p>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Statistics */}
            <div css={sectionStyles(theme)}>
              <h3 css={sectionTitleStyles(theme)}>Usage Statistics</h3>
              <div css={statsDisplayStyles(theme)}>
                <span>
                  <strong>{tone.stats.totalUses}</strong> total uses
                </span>
                <span>
                  <strong>{tone.stats.successRate}%</strong> success rate
                </span>
                <span>
                  <strong>{tone.stats.averageEngagement}%</strong> avg
                  engagement
                </span>
                {tone.stats.lastUsed && (
                  <span>
                    Last used:{' '}
                    <strong>{tone.stats.lastUsed.toLocaleDateString()}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div css={actionsStyles(theme)}>
            <div css={actionGroupStyles(theme)}>
              {onToggleFavorite && (
                <Button
                  variant="secondary"
                  onClick={handleFavoriteClick}
                  icon={<StarIcon filled={tone.isFavorite} />}
                  iconPosition="left"
                >
                  {tone.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                </Button>
              )}
            </div>

            <div css={actionGroupStyles(theme)}>
              {onEdit && (
                <Button variant="secondary" onClick={handleEditClick}>
                  Edit Tone
                </Button>
              )}
              {onDelete && (
                <Button variant="danger" onClick={handleDeleteClick}>
                  Delete
                </Button>
              )}
              <Button variant="primary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TonePreview.displayName = 'TonePreview';
