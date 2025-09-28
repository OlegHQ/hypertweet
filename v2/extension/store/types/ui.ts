/**
 * Represents the state of the UI.
 *
 * @property isSidebarOpen - True if the sidebar is open, false otherwise.
 * @property isLoading - True if a global loading indicator should be shown, false otherwise.
 * @property modal - The currently open modal, or null if no modal is open.
 */
export interface UIState {
  readonly isSidebarOpen: boolean;
  readonly isLoading: boolean;
  readonly modal: ModalType | null;
}

/**
 * Represents the type of a modal.
 *
 * @property type - The type of the modal.
 * @property props - The props for the modal.
 */
export interface ModalType {
  readonly type: string;
  readonly props?: Record<string, unknown>;
}

/**
 * Represents the actions that can be dispatched to the UI reducer.
 */
export type UIAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'OPEN_MODAL'; payload: ModalType }
  | { type: 'CLOSE_MODAL' };

/**
 * Represents the shape of the UI context.
 *
 * @property uiState - The current UI state.
 * @property toggleSidebar - A function to toggle the sidebar.
 * @property showLoading - A function to show the global loading indicator.
 * @property hideLoading - A function to hide the global loading indicator.
 * @property openModal - A function to open a modal.
 * @property closeModal - A function to close the current modal.
 */
export interface UIContextType {
  readonly uiState: UIState;
  readonly toggleSidebar: () => void;
  readonly showLoading: () => void;
  readonly hideLoading: () => void;
  readonly openModal: (modal: ModalType) => void;
  readonly closeModal: () => void;
}
