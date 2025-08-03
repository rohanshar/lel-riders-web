import React, { ReactNode, Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Loader2 } from 'lucide-react';

interface AsyncBoundaryProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
}

/**
 * Wrapper component that combines ErrorBoundary with Suspense
 * for handling both errors and loading states
 */
const AsyncBoundary: React.FC<AsyncBoundaryProps> = ({
  children,
  loadingFallback,
  errorFallback,
}) => {
  const defaultLoadingFallback = (
    <div className="flex justify-center items-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={loadingFallback || defaultLoadingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

export default AsyncBoundary;