import { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { api } from '../../apiProxy';

interface AuthFormProps {
  onSuccess: (token: string) => void | Promise<void>;
  onClose: () => void;
}

type Mode = 'login' | 'register';

export function AuthForm({ onSuccess, onClose }: AuthFormProps): React.ReactElement {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (mode === 'login') {
      void api.login({ Email: email, Password: password })
        .then(result => {
          void onSuccess(result.AccessToken);
        })
        .catch(() => setError('Invalid email or password'))
        .finally(() => setIsLoading(false));
    } else {
      void api.register({ Email: email, Password: password })
        .then(() => api.login({ Email: email, Password: password }))
        .then(result => {
          void onSuccess(result.AccessToken);
        })
        .catch(() => setError('Registration failed. Email may already exist.'))
        .finally(() => setIsLoading(false));
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <form className="ht-form" onSubmit={handleSubmit}>
      <div className="ht-form-header">
        <h2 className="ht-form-title">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="ht-form-description">
          {mode === 'login'
            ? 'Sign in to your Hypertweet account'
            : 'Sign up for a new Hypertweet account'}
        </p>
      </div>
      <div className="ht-form-fields">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={mode === 'login' ? 'Enter your password' : 'Create a password (min 8 chars)'}
          error={error}
          required
          minLength={mode === 'register' ? 8 : undefined}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </div>
      <div className="ht-form-buttons">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? mode === 'login' ? 'Signing in...' : 'Creating account...'
            : mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>
        <Button type="button" variant="ghost" onClick={toggleMode}>
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
