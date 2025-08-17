import { useEffect, useState } from "react";
import { useSiteTypeStore, type SiteType } from "./site-type-store";
import ReplyTypesPanel from "./reply-types-panel";
import { panelStyles } from "./styles";
import ComplexModePanel from "./complex-mode-panel";
import ModelSelector from "./model-selector";
import ModeSwitcher from "./model-switcher";
import PersonalityTypeSelector from "./personality-type-selector";
import SettingsModal from "./settings-modal";
import AIReplyPanel from "./ai-reply-panel";
import { ConfigTypeKey } from "src/background-app/domain";
import { bgApp } from "../bg-app";
import { useLastUsedProfileId } from "./use-last-used-profile-id";

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
  const setMode = useSiteTypeStore((state) => state.setMode);
  const mode = useSiteTypeStore((state) => state.mode);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const lastUsedProfileId = useLastUsedProfileId();

  useEffect(() => {
    if (mode === null && lastUsedProfileId) {
      bgApp.dataLayer.config
        .get<string>(lastUsedProfileId, ConfigTypeKey.LAST_USED_MODE)
        .then((lastUsedMode) => {
          if (lastUsedMode) {
            setMode(lastUsedMode as "simple" | "complex" | "edit");
          } else {
            setMode("simple");
          }
        });

      return;
    }
    if (mode !== "edit" && lastUsedProfileId) {
      bgApp.dataLayer.config.set(
        lastUsedProfileId,
        ConfigTypeKey.LAST_USED_MODE,
        mode
      );
    }
  }, [mode, lastUsedProfileId]);

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
    <div
      style={{
        ...panelStyles.container,
        ...(type === "twitter" ? panelStyles.containerTwitter : {}),
      }}
    >
      <div style={panelStyles.header}>
        <ModeSwitcher
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
      ) : mode === "simple" ? (
        <ReplyTypesPanel mode={mode} />
      ) : null}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showBackdrop={false}
      />
    </div>
  );
}
