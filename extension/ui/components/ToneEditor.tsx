import { useState } from 'react';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';

interface ToneData {
  title: string;
  instruction: string;
}

interface ToneEditorProps {
  tone?: { id: string; title: string; instruction: string } | null;
  onSave: (data: ToneData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function ToneEditor({
  tone,
  onSave,
  onCancel,
  isLoading,
}: ToneEditorProps): React.ReactElement {
  const [title, setTitle] = useState(tone?.title ?? '');
  const [instruction, setInstruction] = useState(tone?.instruction ?? '');
  const [titleError, setTitleError] = useState('');
  const [instructionError, setInstructionError] = useState('');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    let hasErrors = false;
    if (!title.trim()) {
      setTitleError('Title is required');
      hasErrors = true;
    }
    if (!instruction.trim()) {
      setInstructionError('Instruction is required');
      hasErrors = true;
    }

    if (hasErrors) return;

    onSave({ title: title.trim(), instruction: instruction.trim() });
  };

  return (
    <form className="ht-form" onSubmit={handleSubmit}>
      <div className="ht-form-header">
        <h2 className="ht-form-title">{tone ? 'Edit Tone' : 'Create Tone'}</h2>
        <p className="ht-form-description">
          {tone
            ? 'Update your custom tone settings'
            : 'Create a new custom tone for generating replies'}
        </p>
      </div>
      <div className="ht-form-fields">
        <Input
          label="Title"
          placeholder="e.g., Sarcastic"
          value={title}
          onChange={e => {
            setTitle(e.target.value);
            setTitleError('');
          }}
          error={titleError || undefined}
          disabled={isLoading}
        />
        <Textarea
          label="Instruction"
          placeholder="Describe how the AI should respond..."
          value={instruction}
          onChange={e => {
            setInstruction(e.target.value);
            setInstructionError('');
          }}
          error={instructionError || undefined}
          disabled={isLoading}
          rows={4}
        />
      </div>
      <div
        className="ht-form-buttons"
        style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : tone ? 'Save Changes' : 'Create Tone'}
        </Button>
      </div>
    </form>
  );
}
