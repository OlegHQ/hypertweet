export namespace AccessibilityUtils {
  /**
   * Returns ARIA attributes for a loading state.
   * @param isLoading - Whether the component is in a loading state.
   * @returns ARIA attributes for the loading state.
   */
  export function getLoadingAriaProps(
    isLoading: boolean
  ): Record<string, unknown> {
    return {
      'aria-busy': isLoading,
      'aria-live': 'polite',
    };
  }

  /**
   * Returns ARIA attributes for an error state.
   * @param errorMessage - The error message.
   * @returns ARIA attributes for the error state.
   */
  export function getErrorAriaProps(
    errorMessage?: string
  ): Record<string, unknown> {
    return {
      'aria-invalid': !!errorMessage,
      'aria-describedby': errorMessage ? 'error-message' : undefined,
    };
  }

  /**
   * Focuses the first focusable element in a container.
   * @param container - The container to search for focusable elements.
   */
  export function focusFirstElement(container: HTMLElement | null): void {
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }
}
