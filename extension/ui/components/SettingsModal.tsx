import { useState } from 'react';
import { Modal } from './Modal';
import { SettingsSidebar } from './SettingsSidebar';
import { ProfileTab } from './ProfileTab';
import { AccountTab } from './AccountTab';
import { AISettingsTab } from './AISettingsTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const MENU_ITEMS = [
  { id: 'profile', label: 'Profile' },
  { id: 'account', label: 'Account' },
  { id: 'ai', label: 'AI Settings' },
];

const TITLES: Record<string, string> = {
  profile: 'Profile',
  account: 'Account',
  ai: 'AI Settings',
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
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'account' && <AccountTab onLogout={onLogout} />}
            {activeTab === 'ai' && <AISettingsTab />}
          </div>
        </div>
      </div>
    </Modal>
  );
}
