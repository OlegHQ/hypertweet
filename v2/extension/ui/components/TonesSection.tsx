import { useState } from 'react';
import type { Tone } from '../../api';
import { DefaultToneItem } from './DefaultToneItem';
import { ToneItem } from './ToneItem';
import { Button } from './Button';

interface TonesSectionProps {
  tones: Tone[];
  isLoading: boolean;
  onToggle: (tone: Tone, enabled: boolean) => void;
  onEdit: (tone: Tone) => void;
  onDelete: (tone: Tone) => void;
  onCreate: () => void;
}

type SubTab = 'default' | 'custom';

export function TonesSection({
  tones,
  isLoading,
  onToggle,
  onEdit,
  onDelete,
  onCreate,
}: TonesSectionProps): React.ReactElement {
  const [activeSubtab, setActiveSubtab] = useState<SubTab>('default');
  const [expandedToneId, setExpandedToneId] = useState<string | null>(null);

  const defaultTones = tones.filter(t => t.IsDefault);
  const customTones = tones.filter(t => !t.IsDefault);

  const handleExpand = (toneId: string): void => {
    setExpandedToneId(prev => (prev === toneId ? null : toneId));
  };

  if (isLoading) {
    return <p className="ht-loading">Loading tones...</p>;
  }

  return (
    <div>
      {/* Subtabs */}
      <div className="ht-subtabs">
        <button
          type="button"
          className={`ht-subtab ${activeSubtab === 'default' ? 'ht-subtab-active' : ''}`}
          onClick={() => setActiveSubtab('default')}
        >
          Default
        </button>
        <button
          type="button"
          className={`ht-subtab ${activeSubtab === 'custom' ? 'ht-subtab-active' : ''}`}
          onClick={() => setActiveSubtab('custom')}
        >
          Custom
        </button>
      </div>

      {/* Default tones tab */}
      {activeSubtab === 'default' && (
        <div className="ht-scrollable">
          {defaultTones.length === 0 ? (
            <p className="ht-tones-empty">No default tones available</p>
          ) : (
            defaultTones.map(tone => (
              <DefaultToneItem
                key={tone.Id}
                tone={tone}
                isExpanded={expandedToneId === tone.Id}
                onToggle={enabled => onToggle(tone, enabled)}
                onExpand={() => handleExpand(tone.Id)}
              />
            ))
          )}
        </div>
      )}

      {/* Custom tones tab */}
      {activeSubtab === 'custom' && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <Button size="sm" onClick={onCreate}>
              + Add Tone
            </Button>
          </div>
          <div className="ht-scrollable">
            {customTones.length === 0 ? (
              <p className="ht-tones-empty">No custom tones yet</p>
            ) : (
              customTones.map(tone => (
                <ToneItem
                  key={tone.Id}
                  tone={tone}
                  onEdit={() => onEdit(tone)}
                  onDelete={() => onDelete(tone)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
