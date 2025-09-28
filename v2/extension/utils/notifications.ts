export namespace Notifications {
  export function showSuccess(message: string): void {
    // In a real application, you would use a toast notification library
    alert(`Success: ${message}`);
  }

  export function showError(message: string): void {
    // In a real application, you would use a toast notification library
    alert(`Error: ${message}`);
  }

  export function showInfo(message: string): void {
    // In a real application, you would use a toast notification library
    alert(`Info: ${message}`);
  }
}
