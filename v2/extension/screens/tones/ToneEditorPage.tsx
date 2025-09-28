
import React from 'react';
import { useParams } from 'react-router-dom';
import { ToneEditorScreen } from './ToneEditorScreen';
import type { ToneCategory } from './types';

export const ToneEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const mode = id === 'new' ? 'create' : 'edit';

  if (mode === 'edit' && !id) {
    return <div>Tone not found</div>;
  }

  const toneId = id as string;

  // In a real application, you would fetch the tone data here if the mode is 'edit'
  const initialTone = mode === 'edit' ? { id: toneId, name: 'Example Tone', description: 'An example tone', content: 'This is an example tone.', category: 'custom' as ToneCategory, tags: [], isActive: true, isDefault: false, isFavorite: false, createdAt: new Date(), updatedAt: new Date(), createdBy: 'user', stats: { totalUses: 0, successRate: 0, averageEngagement: 0, responseTime: 0 } } : undefined;

  return <ToneEditorScreen mode={mode} initialTone={initialTone} />;
};
