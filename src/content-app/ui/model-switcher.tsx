import { cn } from "src/ui/library/utils";
import { Settings, Brain, Zap, Sidebar } from "lucide-react";
import { Tooltip } from "src/ui/library/tooltip";
import { bgApp } from "../bg-app";

export default function ModeSwitcher({
  complexMode,
  setComplexMode,
  onSettingsClick,
}: {
  complexMode: boolean;
  setComplexMode: (mode: boolean) => void;
  onSettingsClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Simple Mode" delayDuration={0}>
        <button
          onClick={() => setComplexMode(false)}
          className={cn(
            "text-[#1d9bf0] hover:opacity-80",
            complexMode && "opacity-100",
            !complexMode && "opacity-50"
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
            !complexMode && "opacity-100",
            complexMode && "opacity-50"
          )}
        >
          <Brain size={16} />
        </button>
      </Tooltip>
      {false && (
        <Tooltip content="Open Sidebar" delayDuration={0}>
          <button
            onClick={() => bgApp.system.openSidebar()}
            className="text-[#1d9bf0] hover:opacity-80"
          >
            <Sidebar size={16} />
          </button>
        </Tooltip>
      )}
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
