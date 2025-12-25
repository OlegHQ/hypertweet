import type { Tone } from '../../api';

interface DefaultToneItemProps {
  tone: Tone;
  isExpanded: boolean;
  onToggle: (enabled: boolean) => void;
  onExpand: () => void;
}

export function DefaultToneItem({
  tone,
  isExpanded,
  onToggle,
  onExpand,
}: DefaultToneItemProps): React.ReactElement {
  const isEnabled = tone.Enabled !== false;

  const handleToggleClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onToggle(!isEnabled);
  };

  return (
    <div className="ht-tone-accordion">
      <div className="ht-tone-accordion-header" onClick={onExpand}>
        <span
          className={`ht-tone-accordion-title ${!isEnabled ? 'ht-tone-accordion-title-disabled' : ''}`}
        >
          {tone.Title}
        </span>
        <button
          type="button"
          className={`ht-toggle ${isEnabled ? 'ht-toggle-checked' : ''}`}
          onClick={handleToggleClick}
          aria-label={isEnabled ? 'Disable tone' : 'Enable tone'}
        />
        <svg
          className={`ht-tone-accordion-chevron ${isExpanded ? 'ht-tone-accordion-chevron-open' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {isExpanded && (
        <div className="ht-tone-accordion-content">
          <p className="ht-tone-accordion-instruction">{tone.Instruction}</p>
        </div>
      )}
    </div>
  );
}
