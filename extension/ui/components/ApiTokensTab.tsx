import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../apiProxy';
import { useAuth } from '../hooks/useAuth';
import { useApiTokens } from '../hooks/useApiTokens';
import { Button } from './Button';
import { Input } from './Input';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from '../hooks/useToast';
import type { ApiToken, CreateApiTokenRes } from '../../api';

export function ApiTokensTab(): React.ReactElement {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { success, error } = useToast();

  const { data: tokens, isLoading } = useApiTokens(!!token);
  const tokenList = tokens ?? [];

  const [name, setName] = useState('');
  const [createdToken, setCreatedToken] = useState<CreateApiTokenRes | null>(
    null
  );
  const [revoking, setRevoking] = useState<ApiToken | null>(null);

  const activeTokens = useMemo(
    () => tokenList.filter(t => !t.revokedAt),
    [tokenList]
  );

  const createMutation = useMutation({
    mutationFn: (n: string) =>
      api.createApiToken({ name: n }) as Promise<CreateApiTokenRes>,
    onSuccess: res => {
      setCreatedToken(res);
      setName('');
      void queryClient.invalidateQueries({ queryKey: ['apiTokens'] });
    },
    onError: () => error('Failed to create API token'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) =>
      api.revokeApiToken(id) as Promise<{ message: string }>,
    onSuccess: () => {
      setRevoking(null);
      void queryClient.invalidateQueries({ queryKey: ['apiTokens'] });
    },
    onError: () => error('Failed to revoke API token'),
  });

  const handleCopy = async (value: string): Promise<void> => {
    try {
      // Prefer async Clipboard API when available.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        success('Token copied to clipboard');
        return;
      }

      // Fallback: execCommand copy (works in more content-script contexts).
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (!ok) {
        error('Failed to copy token');
        return;
      }

      success('Token copied to clipboard');
    } catch {
      error('Failed to copy token');
    }
  };

  if (!token) {
    return (
      <div className="ht-section">
        <p className="ht-section-description">Sign in to manage MCP tokens.</p>
      </div>
    );
  }

  return (
    <div className="ht-section">
      <p className="ht-section-description">
        Generate a revocable token for Claude Code MCP access. The token is only
        shown once.
      </p>

      <div className="ht-api-token-create">
        <Input
          label="Token Name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Claude Code"
          required
        />
        <div className="ht-api-token-actions">
          <Button
            type="button"
            onClick={() => createMutation.mutate(name)}
            disabled={createMutation.isPending || name.trim().length === 0}
          >
            {createMutation.isPending ? 'Creating...' : 'Create token'}
          </Button>
        </div>
      </div>

      {createdToken && (
        <div className="ht-api-token-created">
          <div className="ht-api-token-created-header">
            <div className="ht-api-token-created-title">New token</div>
            <div className="ht-api-token-created-buttons">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void handleCopy(createdToken.token)}
              >
                Copy
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setCreatedToken(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
          <div className="ht-api-token-created-token">{createdToken.token}</div>
          <div className="ht-api-token-created-warning">
            Save this token now. You won&apos;t be able to view it again.
          </div>
        </div>
      )}

      <hr className="ht-divider" />

      <h3 className="ht-section-title">Existing tokens</h3>

      {isLoading ? (
        <p className="ht-loading">Loading tokens...</p>
      ) : activeTokens.length === 0 ? (
        <p className="ht-loading">No tokens yet.</p>
      ) : (
        <div className="ht-api-token-list">
          {activeTokens.map(t => (
            <div key={t.id} className="ht-api-token-row">
              <div className="ht-api-token-row-main">
                <div className="ht-api-token-row-name">{t.name}</div>
                <div className="ht-api-token-row-meta">id: {t.id}</div>
              </div>
              <div className="ht-api-token-row-actions">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => setRevoking(t)}
                >
                  Revoke
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!revoking}
        title="Revoke Token"
        message={`Revoke token "${revoking?.name}"? Claude Code will stop working until you update its configuration.`}
        confirmLabel="Revoke"
        onConfirm={() => revoking && revokeMutation.mutate(revoking.id)}
        onCancel={() => setRevoking(null)}
        isLoading={revokeMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
