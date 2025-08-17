import Modal from "src/ui/library/modal";
import { bgApp } from "../bg-app";
import { useLastUsedProfileId } from "./use-last-used-profile-id";
import FormatInstructionBuilder from "src/ui/format-instructions-builder";

export default function SettingsModal({
  isOpen,
  onClose,
  showBackdrop = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  showBackdrop?: boolean;
}) {
  const lastUsedProfileId = useLastUsedProfileId();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      showBackdrop={showBackdrop}
    >
      <div style={{ width: "350px" }}>
        {lastUsedProfileId && (
          <FormatInstructionBuilder
            selectedProfileId={lastUsedProfileId}
            app={bgApp}
            withPreview={false}
          />
        )}
      </div>
    </Modal>
  );
}
