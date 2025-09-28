
import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { GlobalErrorHandler } from '@/utils/errorHandling';
import { Button } from '@/components/common/Button';

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  GlobalErrorHandler.handleError(error);

  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre style={{ color: 'red' }}>{GlobalErrorHandler.getFriendlyMessage(error)}</pre>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  );
};

export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
};
