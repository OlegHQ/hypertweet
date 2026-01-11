import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from './Input';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { api } from '../../apiProxy';
import { useToast } from '../hooks/useToast';

interface AccountTabProps {
  onLogout: () => void;
}

export function AccountTab({ onLogout }: AccountTabProps): React.ReactElement {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Beta mode state
  const [betaMode, setBetaMode] = useState(false);
  const [betaLoading, setBetaLoading] = useState(true);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load beta mode on mount
  useEffect(() => {
    void (api.getBetaMode() as Promise<boolean>).then(enabled => {
      setBetaMode(enabled);
      setBetaLoading(false);
    });
  }, []);

  const handleBetaToggle = (): void => {
    const newValue = !betaMode;
    setBetaMode(newValue);
    void (api.setBetaMode(newValue) as Promise<void>);
  };

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      return api.updatePassword({ newPassword: newPassword });
    },
    onSuccess: () => {
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setPasswordSuccess(true);
      window.setTimeout(() => setPasswordSuccess(false), 3000);
    },
    onError: (error: Error) => {
      setPasswordError(error.message);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => api.deleteAccount(),
    onSuccess: async () => {
      await api.clearTokens();
      queryClient.clear();
      onLogout();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete account');
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setPasswordError('');
    updatePasswordMutation.mutate();
  };

  return (
    <div>
      {/* Beta Channel Section */}
      <div className="ht-section">
        <div className="ht-toggle-row">
          <div className="ht-toggle-row-content">
            <p className="ht-toggle-row-label">Beta Channel</p>
            <p className="ht-toggle-row-description">
              Use the beta API endpoint for testing new features
            </p>
          </div>
          <button
            type="button"
            className={`ht-toggle ${betaMode ? 'ht-toggle-checked' : ''}`}
            onClick={handleBetaToggle}
            disabled={betaLoading}
          />
        </div>
      </div>

      <hr className="ht-divider" />

      {/* Security Section */}
      <div className="ht-section">
        <h3 className="ht-section-title">Change Password</h3>
        <p className="ht-section-description">
          Update your account password. Must be at least 8 characters.
        </p>
        <form onSubmit={handlePasswordSubmit}>
          <div className="ht-form-fields">
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={e => {
                setNewPassword(e.target.value);
                setPasswordError('');
              }}
              disabled={updatePasswordMutation.isPending}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                setPasswordError('');
              }}
              error={passwordError || undefined}
              disabled={updatePasswordMutation.isPending}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            {passwordSuccess && (
              <p className="ht-success-text" style={{ marginBottom: 8 }}>
                Password updated successfully
              </p>
            )}
            <Button
              type="submit"
              disabled={
                updatePasswordMutation.isPending ||
                !newPassword ||
                !confirmPassword
              }
            >
              {updatePasswordMutation.isPending
                ? 'Updating...'
                : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>

      <hr className="ht-divider" />

      {/* Danger Zone */}
      <div className="ht-danger-zone">
        <h4 className="ht-danger-zone-title">Danger Zone</h4>
        <p className="ht-danger-zone-description">
          Once you delete your account, there is no going back. Please be
          certain.
        </p>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Account
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        confirmLabel="Delete Account"
        onConfirm={() => deleteAccountMutation.mutate()}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={deleteAccountMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
