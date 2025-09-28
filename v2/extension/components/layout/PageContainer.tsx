/**
 * PageContainer component for content wrapper with loading states and error handling
 * Provides consistent page layout with title, description, and proper spacing
 */

import React, { forwardRef, useEffect } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';
import { Loading } from '../common/Loading';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import type { PageContainerProps } from './types';

/**
 * Page container styles
 */
const getPageContainerStyles = (
  theme: ThemeType,
  maxWidth: PageContainerProps['maxWidth'],
  padding: PageContainerProps['padding']
) => css`
  position: relative;
  width: 100%;
  min-height: 100%;
  margin: 0 auto;

  max-width: ${maxWidth === 'sm'
    ? '640px'
    : maxWidth === 'md'
      ? '768px'
      : maxWidth === 'lg'
        ? '1024px'
        : maxWidth === 'xl'
          ? '1280px'
          : '100%'};

  padding: ${padding === 'none'
    ? '0'
    : padding === 'sm'
      ? theme.spacing[2]
      : padding === 'lg'
        ? theme.spacing[8]
        : theme.spacing[6]};
`;

/**
 * Page header styles
 */
const pageHeaderStyles = (theme: ThemeType) => css`
  margin-bottom: ${theme.spacing[8]};

  &:empty {
    display: none;
  }
`;

/**
 * Page title styles
 */
const pageTitleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin: 0 0 ${theme.spacing[2]} 0;
  line-height: ${theme.typography.lineHeight.tight};
`;

/**
 * Page description styles
 */
const pageDescriptionStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.base};
  color: ${theme.colors.text.secondary};
  margin: 0;
  line-height: ${theme.typography.lineHeight.relaxed};
  max-width: 600px;
`;

/**
 * Page content styles
 */
 
const pageContentStyles = (_theme: ThemeType) => css`
  position: relative;
  width: 100%;
`;

/**
 * Loading overlay styles
 */
const loadingOverlayStyles = (theme: ThemeType) => css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(2px);
  border-radius: ${theme.borderRadius.md};
`;

/**
 * Error container styles
 */
const errorContainerStyles = (theme: ThemeType) => css`
  margin-bottom: ${theme.spacing[6]};
`;

/**
 * Error actions styles
 */
const errorActionsStyles = (theme: ThemeType) => css`
  margin-top: ${theme.spacing[4]};
  display: flex;
  gap: ${theme.spacing[2]};
  align-items: center;
`;

/**
 * Loading overlay component
 */
const LoadingOverlay: React.FC<{ readonly message?: string }> = ({
  message,
}) => {
  const _theme = defaultTheme;

  return (
    <div css={loadingOverlayStyles(_theme)} role="status" aria-live="polite">
      <div style={{ textAlign: 'center' }}>
        <Loading size="lg" />
        {message && (
          <p
            style={{
              marginTop: _theme.spacing[4],
              color: _theme.colors.text.secondary,
              fontSize: _theme.typography.fontSize.sm,
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Error display component
 */
const ErrorDisplay: React.FC<{
  readonly error: NonNullable<PageContainerProps['error']>;
}> = ({ error }) => {
  const _theme = defaultTheme;

  return (
    <div css={errorContainerStyles(_theme)}>
      <Alert variant="solid" title="Error">
        <p>{error.message}</p>
        {error.code && (
          <p
            style={{
              fontSize: _theme.typography.fontSize.sm,
              color: _theme.colors.text.secondary,
              marginTop: _theme.spacing[1],
            }}
          >
            Error code: {error.code}
          </p>
        )}
        {error.retry && (
          <div css={errorActionsStyles(_theme)}>
            <Button variant="secondary" size="sm" onClick={error.retry}>
              Try Again
            </Button>
          </div>
        )}
      </Alert>
    </div>
  );
};

/**
 * Page header component
 */
const PageHeader: React.FC<{
  readonly title?: string;
  readonly description?: string;
}> = ({ title, description }) => {
  const _theme = defaultTheme;

  if (!title && !description) {
    return null;
  }

  return (
    <header css={pageHeaderStyles(_theme)}>
      {title && <h1 css={pageTitleStyles(_theme)}>{title}</h1>}
      {description && <p css={pageDescriptionStyles(_theme)}>{description}</p>}
    </header>
  );
};

/**
 * Get loading message based on state
 */
const getLoadingMessage = (
  loading: PageContainerProps['loading']
): string | undefined => {
  switch (loading) {
    case 'loading':
      return 'Loading...';
    default:
      return undefined;
  }
};

/**
 * Scroll restoration hook
 */
const useScrollRestoration = (title?: string): void => {
  useEffect(() => {
    if (title) {
      // Scroll to top when page title changes (new page load)
      window.scrollTo(0, 0);
    }
  }, [title]);
};

/**
 * Page container component with comprehensive layout features
 */
export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  (
    {
      children,
      title,
      description,
      loading = 'idle',
      error,
      className,
      maxWidth = 'lg',
      padding = 'md',
    },
    ref
  ) => {
    const _theme = defaultTheme;

    // Handle scroll restoration when navigating between pages
    useScrollRestoration(title);

    const isLoading = loading === 'loading';
    const hasError = error != null;
    const loadingMessage = getLoadingMessage(loading);

    return (
      <main
        ref={ref}
        css={getPageContainerStyles(_theme, maxWidth, padding)}
        className={className}
        role="main"
        aria-busy={isLoading}
      >
        {/* Page Header */}
        <PageHeader
          {...(title && { title })}
          {...(description && { description })}
        />

        {/* Error Display */}
        {hasError && <ErrorDisplay error={error} />}

        {/* Page Content */}
        <div css={pageContentStyles(_theme)}>
          {children}

          {/* Loading Overlay */}
          {isLoading && (
            <LoadingOverlay
              {...(loadingMessage && { message: loadingMessage })}
            />
          )}
        </div>
      </main>
    );
  }
);

PageContainer.displayName = 'PageContainer';
