import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { api } from '../../apiProxy';
import { useProfile } from '../hooks/useProfile';
import { useModels } from '../hooks/useModels';
import { useAuth } from '../hooks/useAuth';
import type { ProfileRes } from '../../api';

export function ChatSettingsTab(): React.ReactElement {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(!!token);
  const { data: modelsData, isLoading: modelsLoading } = useModels(!!token);

  const [persona, setPersona] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );

  const saveTimerRef = useRef<number | null>(null);
  const saveStatusTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (profile) {
      setPersona(profile.ChatBotPersona ?? '');
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: { ChatBotPersona: string }) => api.updateProfile(data),
    onSuccess: () => {
      setSaveStatus('saved');
      if (saveStatusTimerRef.current) {
        window.clearTimeout(saveStatusTimerRef.current);
      }
      saveStatusTimerRef.current = window.setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => {
      setSaveStatus('idle');
    },
  });

  const updateChatModelMutation = useMutation({
    mutationFn: (chatModel: string) =>
      api.updateProfile({ ChatModel: chatModel }),
    onMutate: async chatModel => {
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      const previous = queryClient.getQueryData<ProfileRes>(['profile']);
      if (previous) {
        queryClient.setQueryData<ProfileRes>(['profile'], {
          ...previous,
          ChatModel: chatModel,
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

  const modelOptions =
    modelsData?.AllModels.map(m => ({
      value: m.ModelName,
      label: m.ModelName.split('/').pop()?.replace(':free', '') ?? m.ModelName,
    })) ?? [];

  const currentChatModel =
    profile?.ChatModel ?? profile?.ModelName ?? modelOptions[0]?.value ?? '';

  const handleChatModelChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    updateChatModelMutation.mutate(e.target.value);
  };

  const debouncedSave = useCallback(
    (data: { ChatBotPersona: string }) => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      setSaveStatus('saving');
      saveTimerRef.current = window.setTimeout(() => {
        updateProfileMutation.mutate(data);
      }, 500);
    },
    [updateProfileMutation]
  );

  const handleBlur = (): void => {
    if (persona !== (profile?.ChatBotPersona ?? '')) {
      debouncedSave({ ChatBotPersona: persona });
    }
  };

  return (
    <div>
      {/* Chat Model Selection */}
      <div className="ht-section">
        <h3 className="ht-section-title">Chat Model</h3>
        <p className="ht-section-description">
          Select the AI model for chat conversations.
        </p>
        {modelsLoading || profileLoading ? (
          <p className="ht-loading">Loading models...</p>
        ) : (
          <Select
            options={modelOptions}
            value={currentChatModel}
            onChange={handleChatModelChange}
            disabled={updateChatModelMutation.isPending}
          />
        )}
      </div>

      <hr className="ht-divider" />

      <div className="ht-section">
        <div className="ht-section-header">
          <h3 className="ht-section-title">Chat Persona</h3>
          {saveStatus === 'saving' && (
            <span className="ht-save-indicator ht-saving-indicator">
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="ht-save-indicator">Saved</span>
          )}
        </div>
        <p className="ht-section-description">
          Customize the AI assistant&apos;s personality and behavior in chat
          mode. This instruction will be used as the system prompt for chat
          conversations.
        </p>

        <div className="ht-form-fields">
          <Textarea
            label="Persona Instruction"
            placeholder="Define the chatbot's personality, expertise, and communication style. For example: 'You are a helpful social media expert who provides concise, actionable advice for crafting engaging replies...'"
            value={persona}
            onChange={e => setPersona(e.target.value)}
            onBlur={handleBlur}
            rows={5}
          />
        </div>
      </div>
    </div>
  );
}
