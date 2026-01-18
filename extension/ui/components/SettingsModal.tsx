import { useState } from 'react';
import { Modal } from './Modal';
import { SettingsSidebar } from './SettingsSidebar';
import { ProfileTab } from './ProfileTab';
import { ChatSettingsTab } from './ChatSettingsTab';
import { AccountTab } from './AccountTab';
import { AISettingsTab } from './AISettingsTab';
import { ApiTokensTab } from './ApiTokensTab';
import { ErrorBoundary } from './ErrorBoundary';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const MENU_ITEMS = [
  { id: 'profile', label: 'Profile' },
  { id: 'chat', label: 'Chat' },
  { id: 'account', label: 'Account' },
  { id: 'ai', label: 'AI Settings' },
  { id: 'mcp', label: 'MCP' },
];

const TITLES: Record<string, string> = {
  profile: 'Profile',
  chat: 'Chat Settings',
  account: 'Account',
  ai: 'AI Settings',
  mcp: 'MCP',
};

export function SettingsModal({
  isOpen,
  onClose,
  onLogout,
}: SettingsModalProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="settings">
      <div className="ht-settings-layout">
        <SettingsSidebar
          items={MENU_ITEMS}
          activeItem={activeTab}
          onItemChange={setActiveTab}
        />
        <div className="ht-settings-main">
          <div className="ht-settings-main-header">
            <h2 className="ht-settings-main-title">{TITLES[activeTab]}</h2>
            <button
              type="button"
              className="ht-settings-close-btn"
              onClick={onClose}
              title="Close"
            >
              <svg
                width="15"
                height="15"
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
          <div className="ht-settings-content">
            <ErrorBoundary title="Settings error">
              {activeTab === 'profile' && <ProfileTab />}
              {activeTab === 'chat' && <ChatSettingsTab />}
              {activeTab === 'account' && <AccountTab onLogout={onLogout} />}
              {activeTab === 'ai' && <AISettingsTab />}
              {activeTab === 'mcp' && <ApiTokensTab />}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </Modal>
  );
}
