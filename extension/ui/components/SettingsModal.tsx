import { useState } from 'react';
import { Modal } from './Modal';
import { Tabs } from './Tabs';
import { ProfileTab } from './ProfileTab';
import { AISettingsTab } from './AISettingsTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'ai', label: 'AI Settings' },
];

export function SettingsModal({
  isOpen,
  onClose,
  onLogout,
}: SettingsModalProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <Modal isOpen={isOpen} onClose={onClose} wide>
      <div className="ht-settings-header">
        <h2 className="ht-settings-title">Settings</h2>
        <button
          type="button"
          className="ht-icon-btn"
          onClick={onClose}
          title="Close"
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'profile' && <ProfileTab onLogout={onLogout} />}
      {activeTab === 'ai' && <AISettingsTab />}
    </Modal>
  );
}
