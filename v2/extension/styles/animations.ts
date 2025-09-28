import { keyframes, css } from '@emotion/react';

// Keyframe animations
export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const slideInUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

export const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

// Animation utilities
export const fadeInAnimation = css`
  animation: ${fadeIn} 0.3s ease-in-out forwards;
`;

export const slideInUpAnimation = css`
  animation: ${slideInUp} 0.4s ease-in-out forwards;
`;

export const shimmerAnimation = css`
  animation: ${shimmer} 2s infinite linear;
  background: linear-gradient(to right, #f0f0f0 8%, #e0e0e0 18%, #f0f0f0 33%);
  background-size: 1000px 100%;
`;
