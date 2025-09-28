
import React from 'react';
import styled from '@emotion/styled';
import { shimmerAnimation } from '@/styles/animations';

interface SkeletonProps {
  readonly width?: string | number;
  readonly height?: string | number;
  readonly borderRadius?: string | number;
  readonly className?: string;
}

const SkeletonElement = styled.div<SkeletonProps>`
  width: ${({ width }) => (typeof width === 'number' ? `${width}px` : width ?? '100%')};
  height: ${({ height }) => (typeof height === 'number' ? `${height}px` : height ?? '20px')};
  border-radius: ${({ borderRadius }) =>
    typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius ?? '4px'};
  background: #f0f0f0;
  ${shimmerAnimation};
`;

export const SkeletonLoader: React.FC<SkeletonProps> = (props) => {
  return <SkeletonElement {...props} />;
};
