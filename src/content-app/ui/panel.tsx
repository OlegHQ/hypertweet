import { useEffect, useState } from "react";
import { useSiteTypeStore, type SiteType } from "./site-type-store";
import ReplyTypesPanel from "./reply-types-panel";
import { cn } from "src/ui/library/utils";
import ComplexModePanel from "./complex-mode-panel";
import ModelSelector from "./model-selector";
import ModeSwitcher from "./model-switcher";
import PersonalityTypeSelector from "./personality-type-selector";
import SettingsModal from "./settings-modal";

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
      <div className="flex items-center justify-start gap-2 px-4 py-2">
        <ModeSwitcher
          complexMode={complexMode}
          setComplexMode={setComplexMode}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />
        <ModelSelector />
        <PersonalityTypeSelector />
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
