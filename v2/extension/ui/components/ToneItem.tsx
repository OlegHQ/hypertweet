import type { Tone } from '../../api';

interface ToneItemProps {
  tone: Tone;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggle?: (enabled: boolean) => void;
}

export function ToneItem({
  tone,
  onEdit,
  onDelete,
  onToggle,
}: ToneItemProps): React.ReactElement {
  const isDefault = tone.IsDefault;
  const isEnabled = tone.Enabled !== false;

  return (
    <div className="ht-tone-item">
      <div className="ht-tone-item-info">
        <span className="ht-tone-item-title">{tone.Title}</span>
        {isDefault && <span className="ht-badge">Default</span>}
      </div>
      <div className="ht-tone-item-actions">
        {isDefault && onToggle ? (
          <button
            type="button"
            className={`ht-toggle ${isEnabled ? 'ht-toggle-checked' : ''}`}
            onClick={() => onToggle(!isEnabled)}
            title={isEnabled ? 'Disable tone' : 'Enable tone'}
          />
        ) : (
          <>
            {onEdit && (
              <button
                type="button"
                className="ht-icon-btn"
                onClick={onEdit}
                title="Edit tone"
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
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="ht-icon-btn"
                onClick={onDelete}
                title="Delete tone"
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
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
