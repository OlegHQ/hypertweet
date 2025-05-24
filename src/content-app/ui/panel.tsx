import { useEffect, useState } from "react";
import { useSiteTypeStore, type SiteType } from "./site-type-store";
import ReplyTypesPanel from "./reply-types-panel";
import { cn } from "src/ui/library/utils";
import ComplexModePanel from "./complex-mode-panel";
import ModelSelector from "./model-selector";
import ModeSwitcher from "./model-switcher";
import PersonalityTypeSelector from "./personality-type-selector";
import SettingsModal from "./settings-modal";
import AIReplyPanel from "./ai-reply-panel";

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
  // const [complexMode, setComplexMode] = useState(false);
  // const [editMode, setEditMode] = useState(false);
  const [mode, setMode] = useState<"complex" | "simple" | "edit">("simple");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);

  useEffect(() => {
    setSiteType(type);
    setParent(parent);
  }, [type, setSiteType, setParent, parent]);

  // Check for text in the tweet textarea
  useEffect(() => {
    const interval = setInterval(() => {
      if (type === "debugging") {
        const textarea = document.querySelector("textarea");
        if (textarea && textarea.value) {
          setCurrentText(textarea.value);
        }
      } else {
        const textarea = document.querySelector('[data-text="true"]');
        if (textarea && textarea.textContent) {
          setCurrentText(textarea.textContent);
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [type]);

  return (
    <div className={cn("w-full flex flex-col h-full", type ==="twitter" ? "pl-[40px]" : null, className)}>
      <div className="flex items-center justify-start gap-2 px-4 py-2">
        <ModeSwitcher
          mode={mode}
          setMode={setMode}
          onSettingsClick={() => setIsSettingsOpen(true)}
          hasText={!!currentText}
        />
        <ModelSelector />
        <PersonalityTypeSelector />
      </div>
      {mode === "complex" ? (
        <ComplexModePanel />
      ) : mode === "edit" ? (
        <AIReplyPanel editMode={mode === "edit"} text={currentText} />
      ) : (
        <ReplyTypesPanel mode={mode} />
      )}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showBackdrop={false}
      />
    </div>
  );
}
