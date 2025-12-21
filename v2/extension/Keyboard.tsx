import { useState, useEffect } from 'react';
import type { InsertTextCallback } from './base';
import { useAuth } from './ui/hooks/useAuth';
import { Button } from './ui/components/Button';
import { Card } from './ui/components/Card';
import { Modal } from './ui/components/Modal';
import { AuthForm } from './ui/components/AuthForm';
import { injectGlobalStyles } from './ui/styles';

interface KeyboardProps {
  insertText: InsertTextCallback;
}

export function Keyboard({ insertText }: KeyboardProps): React.ReactElement {
  const { token, isLoading, login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Inject global styles on mount
  useEffect(() => {
    injectGlobalStyles();
  }, []);

  const handleLoginSuccess = (newToken: string): void => {
    void login(newToken).then(() => {
      setShowLogin(false);
    });
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
    <Card
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '48px',
        cursor: 'pointer',
      }}
      onClick={() => insertText('Hello from Keyboard!')}
    >
      <Button>Generate Reply</Button>
    </Card>
  );
}
