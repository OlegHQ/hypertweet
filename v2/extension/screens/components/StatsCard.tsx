/**
 * StatsCard component for displaying metrics with trend indicators
 * Features animated number counting, click-through functionality, and responsive design
 */

import React, { useState, useEffect, forwardRef } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';

/**
 * Trend direction for stat changes
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Stats card props interface
 */
export interface StatsCardProps {
  readonly title: string;
  readonly value: number;
  readonly previousValue?: number;
  readonly trend?: TrendDirection;
  readonly trendPercentage?: number;
  readonly icon?: React.ReactElement;
  readonly suffix?: string;
  readonly prefix?: string;
  readonly loading?: boolean;
  readonly onClick?: () => void;
  readonly className?: string;
  readonly animationDuration?: number;
}

/**
 * Card container styles
 */
const cardStyles = (
  theme: ThemeType,
  clickable: boolean,
  loading: boolean
) => css`
  background-color: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing[6]};
  box-shadow: ${theme.shadows.sm};
  transition: all 0.2s ease-in-out;
  cursor: ${clickable ? 'pointer' : 'default'};
  opacity: ${loading ? 0.7 : 1};
  position: relative;
  overflow: hidden;

  ${clickable &&
  `
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.md};
      border-color: ${theme.colors.border.secondary};
    }

    &:focus {
      outline: 2px solid ${theme.colors.interactive.primary};
      outline-offset: 2px;
    }
  `}

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[4]};
  }
`;

/**
 * Header section styles
 */
const headerStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing[4]};
`;

/**
 * Title section styles
 */
const titleSectionStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  flex: 1;
`;

/**
 * Icon container styles
 */
const iconStyles = (theme: ThemeType) => css`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.interactive.primary};
  flex-shrink: 0;

  svg {
    width: 100%;
    height: 100%;
  }
`;

/**
 * Title styles
 */
const titleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.secondary};
  margin: 0;
  line-height: ${theme.typography.lineHeight.snug};
`;

/**
 * Value section styles
 */
const valueSectionStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: baseline;
  gap: ${theme.spacing[1]};
  margin-bottom: ${theme.spacing[3]};
`;

/**
 * Prefix styles
 */
const prefixStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
`;

/**
 * Value styles
 */
const valueStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  line-height: ${theme.typography.lineHeight.none};
  font-feature-settings: 'tnum' 1;
`;

/**
 * Suffix styles
 */
const suffixStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.base};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.secondary};
`;

/**
 * Trend container styles
 */
const trendStyles = (theme: ThemeType, trend: TrendDirection) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[1]};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.medium};

  color: ${trend === 'up'
    ? theme.colors.status.success
    : trend === 'down'
      ? theme.colors.status.error
      : theme.colors.text.tertiary};
`;

/**
 * Trend icon styles
 */
const trendIconStyles = (_theme: ThemeType, trend: TrendDirection) => css`
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
    transform: ${trend === 'down' ? 'rotate(180deg)' : 'none'};
  }
`;

/**
 * Loading skeleton overlay styles
 */
const loadingSkeletonStyles = (theme: ThemeType) => css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    ${theme.colors.background.secondary},
    transparent
  );
  animation: skeleton-loading 1.5s ease-in-out infinite;

  @keyframes skeleton-loading {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

/**
 * Default stats icon
 */
const DefaultStatsIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M9 11H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2z" />
    <path d="M17 3h-2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
  </svg>
);

/**
 * Trend up arrow icon
 */
const TrendUpIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M7 14l5-5 5 5" />
  </svg>
);

/**
 * Trend neutral icon
 */
const TrendNeutralIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M5 12h14" />
  </svg>
);

/**
 * Get trend icon based on direction
 */
const getTrendIcon = (trend: TrendDirection): React.ReactElement => {
  switch (trend) {
    case 'up':
    case 'down':
      return <TrendUpIcon />;
    case 'neutral':
    default:
      return <TrendNeutralIcon />;
  }
};

/**
 * Format number with appropriate suffixes
 */
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Animated counter hook
 */
const useAnimatedCounter = (
  endValue: number,
  duration = 1000,
  isVisible = true
): number => {
  const [currentValue, setCurrentValue] = useState(isVisible ? endValue : 0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentValue(0);
      return;
    }

    const startValue = 0;
    const startTime = Date.now();

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(
        startValue + (endValue - startValue) * easeOutCubic
      );

      setCurrentValue(value);

      if (progress < 1) {
        window.requestAnimationFrame(animate);
      }
    };

    window.requestAnimationFrame(animate);
  }, [endValue, duration, isVisible]);

  return currentValue;
};

/**
 * Stats card component with animated counting and trend indicators
 */
export const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      title,
      value,
      previousValue,
      trend,
      trendPercentage,
      icon,
      suffix,
      prefix,
      loading = false,
      onClick,
      className,
      animationDuration = 1000,
    },
    ref
  ) => {
    const theme = defaultTheme;
    const [isInView, setIsInView] = useState(false);
    const animatedValue = useAnimatedCounter(
      value,
      animationDuration,
      isInView
    );

    // Intersection observer for animation trigger
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setIsInView(true);
          }
        },
        { threshold: 0.1 }
      );

      if (ref && 'current' in ref && ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, [ref]);

    // Calculate trend if not provided but previous value exists
    const calculatedTrend =
      trend ??
      (previousValue !== undefined
        ? value > previousValue
          ? 'up'
          : value < previousValue
            ? 'down'
            : 'neutral'
        : undefined);

    const calculatedTrendPercentage =
      trendPercentage ??
      (previousValue !== undefined && previousValue > 0
        ? Math.abs(((value - previousValue) / previousValue) * 100)
        : undefined);

    const handleClick = (): void => {
      if (onClick && !loading) {
        onClick();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
      if ((e.key === 'Enter' || e.key === ' ') && onClick && !loading) {
        e.preventDefault();
        onClick();
      }
    };

    return (
      <div
        ref={ref}
        css={cardStyles(theme, !!onClick, loading)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={className}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? `${title}: ${value}${suffix ?? ''}` : undefined}
      >
        {loading && <div css={loadingSkeletonStyles(theme)} />}

        {/* Header */}
        <header css={headerStyles(theme)}>
          <div css={titleSectionStyles(theme)}>
            <div css={iconStyles(theme)}>{icon ?? <DefaultStatsIcon />}</div>
            <h3 css={titleStyles(theme)}>{title}</h3>
          </div>
        </header>

        {/* Value */}
        <div css={valueSectionStyles(theme)}>
          {prefix && <span css={prefixStyles(theme)}>{prefix}</span>}
          <span css={valueStyles(theme)}>{formatNumber(animatedValue)}</span>
          {suffix && <span css={suffixStyles(theme)}>{suffix}</span>}
        </div>

        {/* Trend */}
        {calculatedTrend && calculatedTrendPercentage !== undefined && (
          <div css={trendStyles(theme, calculatedTrend)}>
            <div css={trendIconStyles(theme, calculatedTrend)}>
              {getTrendIcon(calculatedTrend)}
            </div>
            <span>
              {calculatedTrend === 'up'
                ? '+'
                : calculatedTrend === 'down'
                  ? '-'
                  : ''}
              {calculatedTrendPercentage.toFixed(1)}%
            </span>
            <span>vs last period</span>
          </div>
        )}
      </div>
    );
  }
);

StatsCard.displayName = 'StatsCard';
