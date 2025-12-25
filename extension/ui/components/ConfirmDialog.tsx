import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'default',
}: ConfirmDialogProps): React.ReactElement {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className="ht-form">
        <div className="ht-form-header">
          <h2 className="ht-form-title">{title}</h2>
          <p className="ht-form-description">{message}</p>
        </div>
        <div
          className="ht-form-buttons"
          style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}
        >
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Loading...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
