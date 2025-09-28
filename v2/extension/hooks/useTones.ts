import { useContext } from 'react';
import TonesContext from '@/store/tones';
import type { TonesContextType } from '@/store/types/tones';

export const useTones = (): TonesContextType => {
  const context = useContext(TonesContext);
  if (context === undefined) {
    throw new Error('useTones must be used within a TonesProvider');
  }
  return context;
};
