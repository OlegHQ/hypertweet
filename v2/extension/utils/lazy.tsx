
import React, { Suspense } from 'react';
import { SkeletonLoader } from '@/components/SkeletonLoader';

interface LazyComponentProps {
  factory: () => Promise<{ default: React.ComponentType<any> }>;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({ factory }) => {
  const Component = React.lazy(factory);

  return (
    <Suspense fallback={<SkeletonLoader />}>
      <Component />
    </Suspense>
  );
};
