import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Select } from './Select';
import { ToneEditor } from './ToneEditor';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';
import { TonesSection } from './TonesSection';
import { useTones } from '../hooks/useTones';
import { useModels } from '../hooks/useModels';
import { useProfile } from '../hooks/useProfile';
import { api } from '../../apiProxy';
import type { Tone, ProfileRes } from '../../api';
import { useState } from 'react';

export function AISettingsTab(): React.ReactElement {
  const queryClient = useQueryClient();

  // Profile (for current model)
  const { data: profile, isLoading: profileLoading } = useProfile(true);

  // Available models
  const { data: modelsData, isLoading: modelsLoading } = useModels(true);

  // Tones
  const { data: tones = [], isLoading: tonesLoading } = useTones(true);

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingTone, setEditingTone] = useState<Tone | null>(null);

  // Delete confirmation
  const [deletingTone, setDeletingTone] = useState<Tone | null>(null);

  const updateModelMutation = useMutation({
    mutationFn: (modelName: string) =>
      api.updateProfile({ ModelName: modelName }),
    onMutate: async modelName => {
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      const previous = queryClient.getQueryData<ProfileRes>(['profile']);
      if (previous) {
        queryClient.setQueryData<ProfileRes>(['profile'], {
          ...previous,
          ModelName: modelName,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['profile'], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const createToneMutation = useMutation({
    mutationFn: (data: { Title: string; Instruction: string }) =>
      api.createTone(data),
    onMutate: async data => {
      await queryClient.cancelQueries({ queryKey: ['tones'] });
      const previous = queryClient.getQueryData<Tone[]>(['tones']);
      const optimisticTone: Tone = {
        Id: `temp-${Date.now()}`,
        Title: data.Title,
        Instruction: data.Instruction,
        IsDefault: false,
      };
      queryClient.setQueryData<Tone[]>(['tones'], old => [
        ...(old ?? []),
        optimisticTone,
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tones'], context.previous);
      }
    },
    onSuccess: () => {
      setShowEditor(false);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tones'] });
    },
  });

  const updateToneMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { Title: string; Instruction: string };
    }) => api.updateTone(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tones'] });
      const previous = queryClient.getQueryData<Tone[]>(['tones']);
      queryClient.setQueryData<Tone[]>(['tones'], old =>
        old?.map(t => (t.Id === id ? { ...t, ...data } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tones'], context.previous);
      }
    },
    onSuccess: () => {
      setShowEditor(false);
      setEditingTone(null);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tones'] });
    },
  });

  const deleteToneMutation = useMutation({
    mutationFn: (id: string) => api.deleteTone(id),
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: ['tones'] });
      const previous = queryClient.getQueryData<Tone[]>(['tones']);
      queryClient.setQueryData<Tone[]>(['tones'], old =>
        old?.filter(t => t.Id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tones'], context.previous);
      }
    },
    onSuccess: () => {
      setDeletingTone(null);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tones'] });
    },
  });

  const toggleToneMutation = useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
      api.toggleTone(id, enable),
    onMutate: async ({ id, enable }) => {
      await queryClient.cancelQueries({ queryKey: ['tones'] });
      const previous = queryClient.getQueryData<Tone[]>(['tones']);
      queryClient.setQueryData<Tone[]>(['tones'], old =>
        old?.map(t => (t.Id === id ? { ...t, Enabled: enable } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tones'], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tones'] });
    },
  });

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    updateModelMutation.mutate(e.target.value);
  };

  const handleEditTone = (tone: Tone): void => {
    setEditingTone(tone);
    setShowEditor(true);
  };

  const handleCreateTone = (): void => {
    setEditingTone(null);
    setShowEditor(true);
  };

  const handleSaveTone = (data: {
    Title: string;
    Instruction: string;
  }): void => {
    if (editingTone) {
      updateToneMutation.mutate({ id: editingTone.Id, data });
    } else {
      createToneMutation.mutate(data);
    }
  };

  const handleToggleTone = (tone: Tone, enabled: boolean): void => {
    toggleToneMutation.mutate({ id: tone.Id, enable: enabled });
  };

  const modelOptions =
    modelsData?.AllModels.map(m => ({
      value: m.ModelName,
      label: m.ModelName.split('/').pop()?.replace(':free', '') ?? m.ModelName,
    })) ?? [];

  const currentModel = profile?.ModelName ?? modelOptions[0]?.value ?? '';

  return (
    <div>
      {/* Model Selection */}
      <div className="ht-section">
        <h3 className="ht-section-title">Reply Model</h3>
        {modelsLoading || profileLoading ? (
          <p className="ht-loading">Loading models...</p>
        ) : (
          <Select
            options={modelOptions}
            value={currentModel}
            onChange={handleModelChange}
            disabled={updateModelMutation.isPending}
          />
        )}
      </div>

      <hr className="ht-divider" />

      {/* Tones Section */}
      <div className="ht-section">
        <h3 className="ht-section-title">Tones</h3>
        <TonesSection
          tones={tones}
          isLoading={tonesLoading}
          onToggle={handleToggleTone}
          onEdit={handleEditTone}
          onDelete={tone => setDeletingTone(tone)}
          onCreate={handleCreateTone}
        />
      </div>

      {/* Tone Editor Modal */}
      <Modal isOpen={showEditor} onClose={() => setShowEditor(false)}>
        <ToneEditor
          tone={editingTone}
          onSave={handleSaveTone}
          onCancel={() => {
            setShowEditor(false);
            setEditingTone(null);
          }}
          isLoading={
            createToneMutation.isPending || updateToneMutation.isPending
          }
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTone}
        title="Delete Tone"
        message={`Are you sure you want to delete "${deletingTone?.Title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() =>
          deletingTone && deleteToneMutation.mutate(deletingTone.Id)
        }
        onCancel={() => setDeletingTone(null)}
        isLoading={deleteToneMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
