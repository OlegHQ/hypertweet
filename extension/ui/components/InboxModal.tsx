import { useEffect, useMemo, useState } from 'react';
import { Modal } from './Modal';
import { Tabs } from './Tabs';
import { Button } from './Button';
import { Textarea } from './Textarea';
import { api } from '../../apiProxy';
import type { InboxItem, InboxItemSummary } from '../../api';
import { useToast } from '../hooks/useToast';

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (id: string) => void;
  insertText: (text: string) => void;
  isReddit: boolean;
}

function dedupeTexts(texts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of texts) {
    const trimmed = t.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export function InboxModal({
  isOpen,
  onClose,
  onSelectItem,
  insertText,
  isReddit,
}: InboxModalProps): React.ReactElement {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'unreplied' | 'finished'>(
    'unreplied'
  );
  const [items, setItems] = useState<InboxItemSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [manualVariants, setManualVariants] = useState('');
  const [isSavingVariants, setIsSavingVariants] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMarkingDone, setIsMarkingDone] = useState(false);

  const tabs = useMemo(
    () => [
      { id: 'unreplied', label: 'Unreplied' },
      { id: 'finished', label: 'Finished' },
    ],
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    void (async () => {
      setIsLoading(true);
      try {
        const res = (await api.inboxListWithStatus(activeTab)) as {
          items: InboxItemSummary[];
        };
        setItems(res.items);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load inbox');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isOpen, activeTab, toast]);

  useEffect(() => {
    if (!isOpen || !selectedId) return;

    void (async () => {
      try {
        const item = (await api.inboxGet(selectedId)) as InboxItem;
        setSelectedItem(item);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load item');
      }
    })();
  }, [isOpen, selectedId, toast]);

  const handlePick = (id: string): void => {
    setSelectedId(id);
    onSelectItem(id);
  };

  const handleInsert = async (text: string): Promise<void> => {
    if (isReddit) {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
      } catch {
        toast.error('Failed to copy');
      }
      return;
    }

    insertText(text);
    toast.success('Inserted');
  };

  const handleSaveManualVariants = async (): Promise<void> => {
    if (!selectedId) return;

    const lines = manualVariants
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    const uniq = dedupeTexts(lines);
    if (uniq.length === 0) {
      toast.error('No variants to save');
      return;
    }

    setIsSavingVariants(true);
    try {
      const updated = (await api.inboxAddVariants(
        selectedId,
        uniq
      )) as InboxItem;
      setSelectedItem(updated);
      setManualVariants('');
      toast.success('Saved variants');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save variants');
    } finally {
      setIsSavingVariants(false);
    }
  };

  const handleGenerate = async (): Promise<void> => {
    if (!selectedId) return;
    setIsGenerating(true);
    try {
      const res = (await api.inboxGenerateVariants(selectedId)) as {
        variants: { text: string }[];
      };
      const texts = dedupeTexts(res.variants.map(v => v.text));
      if (texts.length === 0) {
        toast.error('No variants generated');
        return;
      }

      // Refresh item to show persisted variants.
      const updated = (await api.inboxGet(selectedId)) as InboxItem;
      setSelectedItem(updated);
      toast.success('Generated variants');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkDone = async (): Promise<void> => {
    if (!selectedId) return;
    setIsMarkingDone(true);
    try {
      const updated = (await api.inboxMarkDone(selectedId)) as InboxItem;
      setSelectedItem(updated);
      toast.success('Marked done');
      // Reload list
      const res = (await api.inboxListWithStatus(activeTab)) as {
        items: InboxItemSummary[];
      };
      setItems(res.items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to mark done');
    } finally {
      setIsMarkingDone(false);
    }
  };

  const handleClose = (): void => {
    setSelectedId(null);
    setSelectedItem(null);
    setManualVariants('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} wide>
      <div className="ht-inbox">
        <div className="ht-inbox-header">
          <h2 className="ht-inbox-title">Inbox</h2>
          <button className="ht-icon-btn" title="Close" onClick={handleClose}>
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

        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={id => setActiveTab(id as 'unreplied' | 'finished')}
        />

        <div className="ht-inbox-body">
          <div className="ht-inbox-list">
            {isLoading ? (
              <div className="ht-inbox-empty">Loading...</div>
            ) : items.length === 0 ? (
              <div className="ht-inbox-empty">No items</div>
            ) : (
              items.map(it => (
                <button
                  key={it.id}
                  type="button"
                  className={`ht-inbox-item ${selectedId === it.id ? 'ht-inbox-item-active' : ''}`}
                  onClick={() => handlePick(it.id)}
                >
                  <div className="ht-inbox-item-top">
                    <span className="ht-inbox-item-site">{it.site}</span>
                    <span className="ht-inbox-item-count">
                      {it.variantCount} variants
                    </span>
                  </div>
                  <div className="ht-inbox-item-text">{it.textPreview}</div>
                </button>
              ))
            )}
          </div>

          <div className="ht-inbox-detail">
            {!selectedItem ? (
              <div className="ht-inbox-empty">Select an item</div>
            ) : (
              <>
                <div className="ht-inbox-detail-actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleGenerate()}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate 3'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleMarkDone()}
                    disabled={isMarkingDone}
                  >
                    {isMarkingDone ? '...' : 'Mark done'}
                  </Button>
                </div>

                <div className="ht-inbox-variants">
                  {selectedItem.replyVariants.length === 0 ? (
                    <div className="ht-inbox-empty">No variants yet</div>
                  ) : (
                    selectedItem.replyVariants.map(v => (
                      <div key={v.id} className="ht-inbox-variant">
                        <div className="ht-inbox-variant-text">{v.text}</div>
                        <div className="ht-inbox-variant-actions">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => void handleInsert(v.text)}
                          >
                            {isReddit ? 'Copy' : 'Insert'}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="ht-inbox-add">
                  <Textarea
                    label="Add variants (one per line)"
                    value={manualVariants}
                    onChange={e => setManualVariants(e.target.value)}
                    placeholder="Write a few reply options..."
                  />
                  <div className="ht-inbox-add-actions">
                    <Button
                      variant="secondary"
                      onClick={() => void handleSaveManualVariants()}
                      disabled={isSavingVariants}
                    >
                      {isSavingVariants ? 'Saving...' : 'Save variants'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
