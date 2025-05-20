import { useEffect, useState, useRef, useCallback } from "react";
import { useSiteTypeStore, type SiteType } from "./site-type-store";
import ReplyTypesPanel from "./reply-types-panel";
import { cn } from "src/ui/library/utils";
import { Settings, Brain, Zap } from "lucide-react";
import { createPortal } from "react-dom";
import Draggable from "src/ui/library/draggable";
import Modal from "src/ui/library/modal";
import { Button } from "src/ui/library/button";
import { Tooltip } from "src/ui/library/tooltip";
import { ModelType } from "../../background-app/ai/model-type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "src/ui/library/select";
import { bgApp } from "../bg-app";
import { ConfigTypeKey } from "../../background-app/domain";
import { useGlobalState } from "../../ui/state";
import { useLastUsedProfileId } from "./use-last-used-profile-id";

function ComplexModePanel() {
  return <>d</>;
}

function ModeSwitcher({
  complexMode,
  setComplexMode,
  onSettingsClick,
}: {
  complexMode: boolean;
  setComplexMode: (mode: boolean) => void;
  onSettingsClick: () => void;
}) {
  const [selectedModel, setSelectedModel] = useState<ModelType>(
    ModelType.GPT_3_5_TURBO
  );
  const [isLoading, setIsLoading] = useState(false);
  const lastUsedProfileId = useLastUsedProfileId();

  useEffect(() => {
    if (lastUsedProfileId) {
      loadModel();
    }
  }, [lastUsedProfileId]);

  const loadModel = async () => {
    if (!lastUsedProfileId) return;
    try {
      const model = await bgApp.dataLayer.config.get<string>(
        lastUsedProfileId,
        ConfigTypeKey.COMPLETION_MODEL
      );
      if (model) {
        setSelectedModel(model as ModelType);
      }
    } catch (error) {
      console.error("Error loading model:", error);
    }
  };

  const handleModelChange = async (value: string) => {
    if (!lastUsedProfileId) return;
    setIsLoading(true);
    try {
      await bgApp.dataLayer.config.set(
        lastUsedProfileId,
        ConfigTypeKey.COMPLETION_MODEL,
        value
      );
      setSelectedModel(value as ModelType);
    } catch (error) {
      console.error("Error saving model:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Simple Mode" delayDuration={0}>
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
      </Tooltip>
      <Tooltip content="Complex Mode" delayDuration={0}>
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
      </Tooltip>
      <div className="w-[120px]">
        <Select
          value={selectedModel}
          onValueChange={handleModelChange}
          disabled={isLoading}
        >
          <SelectTrigger className="h-7 text-xs border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 px-2">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ModelType.GPT_3_5_TURBO}>GPT-3.5</SelectItem>
            <SelectItem value={ModelType.GPT_4O_MINI}>GPT-4o Mini</SelectItem>
            <SelectItem value={ModelType.GPT_4_1_MINI}>GPT-4.1 Mini</SelectItem>
            <SelectItem value={ModelType.GPT_4_1}>GPT-4.1</SelectItem>
            <SelectItem value={ModelType.GPT_4_0}>GPT-4o</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Tooltip content="Settings" delayDuration={0}>
        <button
          className="text-[#1d9bf0] hover:opacity-80"
          onClick={onSettingsClick}
        >
          <Settings size={16} />
        </button>
      </Tooltip>
    </div>
  );
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
      <div className="flex items-center justify-start gap-2 px-4 py-2">
        <ModeSwitcher
          complexMode={complexMode}
          setComplexMode={setComplexMode}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />
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
