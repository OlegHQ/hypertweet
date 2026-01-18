import { Component } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error): void {
    // Keep console logging for debugging in injected UI.
    console.error('[Hypertweet] UI error boundary caught:', error);
  }

  override render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div className="ht-section">
          <h3 className="ht-section-title">{this.props.title ?? 'Error'}</h3>
          <p className="ht-section-description">
            {this.state.error.message || 'Something went wrong.'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
