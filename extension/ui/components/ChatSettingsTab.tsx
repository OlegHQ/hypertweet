import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from './Textarea';
import { api } from '../../apiProxy';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';

export function ChatSettingsTab(): React.ReactElement {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { data: profile } = useProfile(!!token);

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
