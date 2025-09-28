
import React, { createContext, useReducer, useMemo, useContext } from 'react';
import type { UIAction, UIContextType, UIState, ModalType } from './types/ui';

const initialState: UIState = {
  isSidebarOpen: true,
  isLoading: false,
  modal: null,
};

const UIContext = createContext<UIContextType | undefined>(undefined);

const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'OPEN_MODAL':
      return { ...state, modal: action.payload };
    case 'CLOSE_MODAL':
      return { ...state, modal: null };
    default:
      return state;
  }
};

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiState, dispatch] = useReducer(uiReducer, initialState);

  const toggleSidebar = () => dispatch({ type: 'TOGGLE_SIDEBAR' });
  const showLoading = () => dispatch({ type: 'SET_LOADING', payload: true });
  const hideLoading = () => dispatch({ type: 'SET_LOADING', payload: false });
  const openModal = (modal: ModalType) => dispatch({ type: 'OPEN_MODAL', payload: modal });
  const closeModal = () => dispatch({ type: 'CLOSE_MODAL' });

  const contextValue = useMemo(
    () => ({ uiState, toggleSidebar, showLoading, hideLoading, openModal, closeModal }),
    [uiState]
  );

  return <UIContext.Provider value={contextValue}>{children}</UIContext.Provider>;
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
