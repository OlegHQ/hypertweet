import React from 'react';

export namespace PerformanceUtils {
  /**
   * Measures the execution time of a function.
   * @param fn - The function to measure.
   * @param label - A label for the measurement.
   * @returns The result of the function.
   */
  export async function measure<T>(
    fn: () => Promise<T>,
    label: string
  ): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    console.log(`[Performance] ${label}: ${endTime - startTime}ms`);
    return result;
  }
}

/**
 * A React hook to measure component render time.
 * @param componentName - The name of the component.
 */
export const useRenderTime = (componentName: string): void => {
  const startTime = performance.now();
  React.useEffect(() => {
    const endTime = performance.now();
    console.log(
      `[Performance] ${componentName} rendered in ${endTime - startTime}ms`
    );
  });
};
