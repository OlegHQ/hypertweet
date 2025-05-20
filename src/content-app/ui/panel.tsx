import { useEffect, useState, useRef, useCallback } from "react";
import { useSiteTypeStore, type SiteType } from "./site-type-store";
import ReplyTypesPanel from "./reply-types-panel";
import { cn } from "src/ui/library/utils";
import { Settings, Brain, Zap } from "lucide-react";
import { createPortal } from "react-dom";
import Draggable from "src/ui/library/draggable";
import Modal from "src/ui/library/modal";
import { Button } from "src/ui/library/button";

function ComplexModePanel() {
  return <>d</>;
}

function SettingsModal({
  isOpen,
  onClose,
  showBackdrop = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  showBackdrop?: boolean;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      showBackdrop={showBackdrop}
    >
      <div className="space-y-4">
        {/* Add your settings content here */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Settings content will go here
          <Button>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Panel({
  siteType: type,
  parent,
  className,
}: {
  siteType: SiteType;
  parent: HTMLElement | null;
  className?: string;
}) {
  const setSiteType = useSiteTypeStore((state) => state.setSiteType);
  const setParent = useSiteTypeStore((state) => state.setParent);
  const [complexMode, setComplexMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setSiteType(type);
    setParent(parent);
  }, [type, setSiteType, setParent, parent]);

  return (
    <div className={cn("w-full flex flex-col h-full", className)}>
      <div className="flex items-center justify-end gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setComplexMode(false)}
            className={cn(
              "text-[#1d9bf0] hover:opacity-80",
              !complexMode && "opacity-100",
              complexMode && "opacity-50"
            )}
          >
            <Zap size={16} />
          </button>
          <button
            onClick={() => setComplexMode(true)}
            className={cn(
              "text-[#1d9bf0] hover:opacity-80",
              complexMode && "opacity-100",
              !complexMode && "opacity-50"
            )}
          >
            <Brain size={16} />
          </button>
        </div>
        <button
          className="text-[#1d9bf0] hover:opacity-80"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings size={16} />
        </button>
      </div>
      {complexMode ? <ComplexModePanel /> : <ReplyTypesPanel />}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showBackdrop={false}
      />
    </div>
  );
}
