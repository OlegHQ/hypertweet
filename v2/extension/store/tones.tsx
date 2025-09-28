
import React, { createContext, useReducer, useMemo } from 'react';
import { ToneAPI } from '@/api/tones';
import type { Tone, ToneFormData, ToneSearchCriteria } from '@/api/types';
import type { TonesAction, TonesContextType, TonesState } from './types/tones';

const initialState: TonesState = {
  tones: [],
  loading: false,
  error: null,
  searchCriteria: {},
};

const TonesContext = createContext<TonesContextType | undefined>(undefined);

const tonesReducer = (state: TonesState, action: TonesAction): TonesState => {
  switch (action.type) {
    case 'FETCH_TONES_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_TONES_SUCCESS':
      return { ...state, loading: false, tones: action.payload };
    case 'FETCH_TONES_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'CREATE_TONE_SUCCESS':
      return { ...state, tones: [...state.tones, action.payload] };
    case 'UPDATE_TONE_SUCCESS':
      return {
        ...state,
        tones: state.tones.map(t => (t.id === action.payload.id ? action.payload : t)),
      };
    case 'DELETE_TONE_SUCCESS':
      return { ...state, tones: state.tones.filter(t => t.id !== action.payload) };
    case 'SET_SEARCH_CRITERIA':
      return { ...state, searchCriteria: action.payload };
    default:
      return state;
  }
};

export const TonesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tonesState, dispatch] = useReducer(tonesReducer, initialState);

  const getTones = async (criteria: ToneSearchCriteria = {}) => {
    dispatch({ type: 'FETCH_TONES_START' });
    try {
      const response = await ToneAPI.getTones(criteria);
      if (response.success && response.data) {
        dispatch({ type: 'FETCH_TONES_SUCCESS', payload: response.data });
      } else {
        dispatch({ type: 'FETCH_TONES_FAILURE', payload: response.error ?? 'Failed to fetch tones' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      dispatch({ type: 'FETCH_TONES_FAILURE', payload: message });
    }
  };

  const createTone = async (data: ToneFormData) => {
    try {
      const response = await ToneAPI.createTone(data);
      if (response.success && response.data) {
        dispatch({ type: 'CREATE_TONE_SUCCESS', payload: response.data });
      }
    } catch (error) {
      // Handle error
    }
  };

  const updateTone = async (id: string, data: Partial<ToneFormData>) => {
    try {
      const response = await ToneAPI.updateTone(id, data);
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_TONE_SUCCESS', payload: response.data });
      }
    } catch (error) {
      // Handle error
    }
  };

  const deleteTone = async (id: string) => {
    try {
      const response = await ToneAPI.deleteTone(id);
      if (response.success) {
        dispatch({ type: 'DELETE_TONE_SUCCESS', payload: id });
      }
    } catch (error) {
      // Handle error
    }
  };

  const favoriteTone = async (id: string, isFavorite: boolean) => {
    try {
      const response = await ToneAPI.favoriteTone(id, isFavorite);
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_TONE_SUCCESS', payload: response.data });
      }
    } catch (error) {
      // Handle error
    }
  };

  const setSearchCriteria = (criteria: ToneSearchCriteria) => {
    dispatch({ type: 'SET_SEARCH_CRITERIA', payload: criteria });
    void getTones(criteria);
  };

  const contextValue = useMemo(
    () => ({ tonesState, getTones, createTone, updateTone, deleteTone, favoriteTone, setSearchCriteria }),
    [tonesState]
  );

  return <TonesContext.Provider value={contextValue}>{children}</TonesContext.Provider>;
};

export default TonesContext;
