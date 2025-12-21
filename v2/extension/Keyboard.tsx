import { useState, useEffect } from 'react';
import type { InsertTextCallback } from './base';
import { useAuth } from './ui/hooks/useAuth';
import { useTones } from './ui/hooks/useTones';
import { Button } from './ui/components/Button';
import { Card } from './ui/components/Card';
import { Modal } from './ui/components/Modal';
import { AuthForm } from './ui/components/AuthForm';
import { injectGlobalStyles } from './ui/styles';

interface KeyboardProps {
  insertText: InsertTextCallback;
}

export function Keyboard({ insertText }: KeyboardProps): React.ReactElement {
  const { token, isLoading, login, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const { data: tones = [], isLoading: tonesLoading } = useTones(!!token);

  useEffect(() => {
    injectGlobalStyles();
  }, []);

  const handleLoginSuccess = (newToken: string): void => {
    login(newToken);
    setShowLogin(false);
  };

  const handleToneClick = (tone: { Id: string; Title: string }): void => {
    insertText(`[${tone.Title}] Generated reply...`);
  };

  if (isLoading) {
    return (
      <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '48px' }}>
        <span className="ht-loading">Loading...</span>
      </Card>
    );
  }

  if (!token) {
    return (
      <>
        <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '48px' }}>
          <Button onClick={() => setShowLogin(true)}>Sign in to Hypertweet</Button>
        </Card>
        <Modal isOpen={showLogin} onClose={() => setShowLogin(false)}>
          <AuthForm onSuccess={handleLoginSuccess} onClose={() => setShowLogin(false)} />
        </Modal>
      </>
    );
  }

  return (
    <Card style={{ padding: '12px' }}>
      <div className="ht-keyboard-header">
        <span className="ht-keyboard-title">Hypertweet</span>
        <div className="ht-keyboard-actions">
          <button className="ht-icon-btn" title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
          </button>
          <button className="ht-icon-btn" title="Logout" onClick={() => void logout()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
      {tonesLoading ? (
        <div className="ht-tones-loading">Loading tones...</div>
      ) : tones.length === 0 ? (
        <div className="ht-tones-empty">No tones available</div>
      ) : (
        <div className="ht-tones-grid">
          {tones.map(tone => (
            <button key={tone.Id} className="ht-tone-btn" onClick={() => handleToneClick(tone)}>
              {tone.Title}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
