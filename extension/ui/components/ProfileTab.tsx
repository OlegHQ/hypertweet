import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from './Textarea';
import { Checkbox } from './Checkbox';
import { api } from '../../apiProxy';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';

const REPLY_OPTIONS = [
  { id: 'NoEmojis', label: 'No Emojis' },
  { id: 'NoHashtags', label: 'No Hashtags' },
  { id: 'NoPunctuation', label: 'No Punctuation' },
] as const;

export function ProfileTab(): React.ReactElement {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { data: profile } = useProfile(!!token);

  // Profile fields state
  const [userBio, setUserBio] = useState('');
  const [customGuidance, setCustomGuidance] = useState('');
  const [postProcess, setPostProcess] = useState(false);
  const [replyOptions, setReplyOptions] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );

  // Debounce timer ref
  const saveTimerRef = useRef<number | null>(null);
  const saveStatusTimerRef = useRef<number | null>(null);

  // Sync state with profile data
  useEffect(() => {
    if (profile) {
      setUserBio(profile.userBio ?? '');
      setCustomGuidance(profile.customReplyGuidance ?? '');
      setPostProcess(profile.postProcessReply ?? false);
      setReplyOptions(profile.replyPromptOptions ?? []);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: {
      userBio?: string;
      customReplyGuidance?: string;
      postProcessReply?: boolean;
      replyPromptOptions?: string[];
    }) => api.updateProfile(data),
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
    (data: {
      userBio?: string;
      customReplyGuidance?: string;
      postProcessReply?: boolean;
      replyPromptOptions?: string[];
    }) => {
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

  const handleBioBlur = (): void => {
    if (userBio !== (profile?.userBio ?? '')) {
      debouncedSave({
        userBio: userBio,
        customReplyGuidance: customGuidance,
        postProcessReply: postProcess,
        replyPromptOptions: replyOptions,
      });
    }
  };

  const handleGuidanceBlur = (): void => {
    if (customGuidance !== (profile?.customReplyGuidance ?? '')) {
      debouncedSave({
        userBio: userBio,
        customReplyGuidance: customGuidance,
        postProcessReply: postProcess,
        replyPromptOptions: replyOptions,
      });
    }
  };

  const handlePostProcessToggle = (): void => {
    const newValue = !postProcess;
    setPostProcess(newValue);
    updateProfileMutation.mutate({ postProcessReply: newValue });
  };

  const handleReplyOptionToggle = (optionId: string): void => {
    const newOptions = replyOptions.includes(optionId)
      ? replyOptions.filter(o => o !== optionId)
      : [...replyOptions, optionId];
    setReplyOptions(newOptions);
    updateProfileMutation.mutate({ replyPromptOptions: newOptions });
  };

  return (
    <div>
      <div className="ht-section">
        <div className="ht-section-header">
          <h3 className="ht-section-title">Reply Customization</h3>
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
          Customize how the AI generates replies for you.
        </p>

        <div className="ht-form-fields">
          <Textarea
            label="User Bio"
            placeholder="Describe yourself, your expertise, and writing style..."
            value={userBio}
            onChange={e => setUserBio(e.target.value)}
            onBlur={handleBioBlur}
            rows={3}
          />

          <Textarea
            label="Custom Reply Guidance"
            placeholder="Add specific instructions for how you want replies to be written..."
            value={customGuidance}
            onChange={e => setCustomGuidance(e.target.value)}
            onBlur={handleGuidanceBlur}
            rows={3}
          />

          <div className="ht-toggle-row">
            <div className="ht-toggle-row-content">
              <p className="ht-toggle-row-label">Post-Process Replies</p>
              <p className="ht-toggle-row-description">
                Apply additional AI processing to refine generated replies
              </p>
            </div>
            <button
              type="button"
              className={`ht-toggle ${postProcess ? 'ht-toggle-checked' : ''}`}
              onClick={handlePostProcessToggle}
              disabled={updateProfileMutation.isPending}
            />
          </div>

          <div>
            <p className="ht-input-label" style={{ marginBottom: 8 }}>
              Reply Options
            </p>
            <div className="ht-checkbox-list">
              {REPLY_OPTIONS.map(option => (
                <Checkbox
                  key={option.id}
                  checked={replyOptions.includes(option.id)}
                  onChange={() => handleReplyOptionToggle(option.id)}
                  label={option.label}
                  disabled={updateProfileMutation.isPending}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
