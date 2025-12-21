import { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { apiLogin } from '../../api';

interface LoginFormProps {
  onSuccess: (token: string) => void | Promise<void>;
  onClose: () => void;
}

export function LoginForm({
  onSuccess,
  onClose,
}: LoginFormProps): React.ReactElement {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    void apiLogin({ Email: login, Password: password })
      .then(result => {
        void onSuccess(result.AccessToken);
      })
      .catch(() => {
        setError('Invalid email or password');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <form className="ht-form" onSubmit={handleSubmit}>
      <div className="ht-form-header">
        <h2 className="ht-form-title">Welcome back</h2>
        <p className="ht-form-description">
          Sign in to your Hypertweet account
        </p>
      </div>
      <div className="ht-form-fields">
        <Input
          label="Email"
          type="email"
          value={login}
          onChange={e => setLogin(e.target.value)}
          placeholder="name@example.com"
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password"
          error={error}
          required
          autoComplete="current-password"
        />
      </div>
      <div className="ht-form-buttons">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
