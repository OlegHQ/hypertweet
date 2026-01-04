import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InsertTextCallback } from './base';
import type { Page } from './models';
import type { ProfileRes, ReplyResult } from './api';
import type { SiteType } from './ui/theme';
import { useAuth } from './ui/hooks/useAuth';
import { useTones } from './ui/hooks/useTones';
import { useModels } from './ui/hooks/useModels';
import { useProfile } from './ui/hooks/useProfile';
import { useTheme } from './ui/hooks/useTheme';
import { useToast } from './ui/hooks/useToast';
import { Button } from './ui/components/Button';
import { Card } from './ui/components/Card';
import { Modal } from './ui/components/Modal';
import { AuthForm } from './ui/components/AuthForm';
import { SettingsModal } from './ui/components/SettingsModal';
import { ChatModal, type Message } from './ui/components/ChatModal';
import { injectGlobalStyles } from './ui/styles';
import { api } from './apiProxy';

interface KeyboardProps {
  insertText: InsertTextCallback;
  readPage: () => Promise<Page>;
  siteType: SiteType;
}

export function Keyboard({
  insertText,
  readPage,
  siteType,
}: KeyboardProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { token, isLoading, login, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [loadingTone, setLoadingTone] = useState<string | null>(null);
  const [redditSuggestion, setRedditSuggestion] = useState<string | null>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const isReddit = siteType === 'reddit';
  const { data: tones = [], isLoading: tonesLoading } = useTones(!!token);
  const { data: modelsData } = useModels(!!token);
  const { data: profile } = useProfile(!!token);
  const toast = useToast();

  useTheme(siteType);

  useEffect(() => {
    injectGlobalStyles(siteType);
  }, [siteType]);

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
      toast.error('Failed to update model');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    updateModelMutation.mutate(e.target.value);
  };

  const modelOptions =
    modelsData?.AllModels.map(m => ({
      value: m.ModelName,
      label: m.ModelName.split('/').pop()?.replace(':free', '') ?? m.ModelName,
    })) ?? [];

  const currentModel = profile?.ModelName ?? modelOptions[0]?.value ?? '';

  const handleLoginSuccess = (newToken: string): void => {
    login(newToken);
    setShowLogin(false);
  };

  const handleLogout = (): void => {
    void logout();
    setShowSettings(false);
  };

  const handleToneClick = async (tone: {
    Id: string;
    Title: string;
  }): Promise<void> => {
    setLoadingTone(tone.Id);
    try {
      const page = await readPage();
      const result = (await api.generateReply({
        ToneId: tone.Id,
        Page: page,
      })) as ReplyResult;
      if (isReddit) {
        setRedditSuggestion(result.Reply);
      } else {
        insertText(result.Reply);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate reply';
      toast.error(message);
    } finally {
      setLoadingTone(null);
    }
  };

  const handleCopySuggestion = async (): Promise<void> => {
    if (!suggestionRef.current) return;
    const text = suggestionRef.current.innerText;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleClearSuggestion = (): void => {
    setRedditSuggestion(null);
  };

  const handleCopyPrompt = async (): Promise<void> => {
    try {
      const page = await readPage();
      const post = page.ActivePost;
      if (!post) {
        toast.error('No active post found');
        return;
      }

      let prompt = `<platform>${siteType}</platform>\n<post>${post.Text}</post>`;
      if (post.CurrentReplyDraft) {
        prompt += `\n<reply_draft>${post.CurrentReplyDraft}</reply_draft>`;
      }

      await navigator.clipboard.writeText(prompt);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (isLoading) {
    return (
      <Card
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '48px',
        }}
      >
        <span className="ht-loading">Loading...</span>
      </Card>
    );
  }

  if (!token) {
    return (
      <>
        <Card
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '48px',
          }}
        >
          <Button onClick={() => setShowLogin(true)}>
            Sign in to Hypertweet
          </Button>
        </Card>
        <Modal isOpen={showLogin} onClose={() => setShowLogin(false)}>
          <AuthForm
            onSuccess={handleLoginSuccess}
            onClose={() => setShowLogin(false)}
          />
        </Modal>
      </>
    );
  }

  return (
    <>
      <Card style={{ padding: '8px' }}>
        <div className="ht-keyboard-header">
          <span className="ht-keyboard-title">Hypertweet</span>
          <div className="ht-keyboard-model">
            {modelOptions.length > 0 && (
              <select
                className="ht-model-select"
                value={currentModel}
                onChange={handleModelChange}
                disabled={updateModelMutation.isPending}
                title="AI Model"
              >
                {modelOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="ht-keyboard-actions">
            <button
              className="ht-icon-btn"
              title="Chat"
              onClick={() => setShowChat(true)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <button
              className="ht-icon-btn"
              title="Copy for AI"
              onClick={() => void handleCopyPrompt()}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </button>
            <button
              className="ht-icon-btn"
              title="Settings"
              onClick={() => setShowSettings(true)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </button>
            <button
              className="ht-icon-btn"
              title="Logout"
              onClick={handleLogout}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
        {isReddit && redditSuggestion !== null && (
          <div className="ht-suggestion-container">
            <div className="ht-suggestion-header">
              <span className="ht-suggestion-label">Generated Reply</span>
              <div className="ht-suggestion-actions">
                <button
                  className="ht-icon-btn"
                  title="Copy to clipboard"
                  onClick={() => void handleCopySuggestion()}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                <button
                  className="ht-icon-btn"
                  title="Clear"
                  onClick={handleClearSuggestion}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <div
              ref={suggestionRef}
              className="ht-suggestion-content"
              contentEditable
              suppressContentEditableWarning
            >
              {redditSuggestion}
            </div>
          </div>
        )}
        {(() => {
          const enabledTones = tones.filter(t => t.Enabled !== false);
          if (tonesLoading) {
            return <div className="ht-tones-loading">Loading tones...</div>;
          }
          if (enabledTones.length === 0) {
            return <div className="ht-tones-empty">No tones available</div>;
          }
          return (
            <div className="ht-tones-grid">
              {enabledTones.map(tone => (
                <button
                  key={tone.Id}
                  className={`ht-tone-btn ${loadingTone === tone.Id ? 'ht-tone-btn-loading' : ''}`}
                  onClick={() => void handleToneClick(tone)}
                  disabled={loadingTone !== null}
                >
                  {loadingTone === tone.Id ? '...' : tone.Title}
                </button>
              ))}
            </div>
          );
        })()}
      </Card>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={handleLogout}
      />

      <ChatModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        readPage={readPage}
        insertText={insertText}
        isReddit={isReddit}
        messages={chatMessages}
        setMessages={setChatMessages}
      />
    </>
  );
}
