import { cn } from "src/ui/library/utils";
import { Settings, Brain, Zap, Sidebar, Pencil } from "lucide-react";
import { Tooltip } from "src/ui/library/tooltip";
import { bgApp } from "../bg-app";
import { useSiteTypeStore } from "./site-type-store";

export default function ModeSwitcher({
  onSettingsClick,
  hasText,
}: {
  onSettingsClick: () => void;
  hasText: boolean;
}) {
  const setMode = useSiteTypeStore((state) => state.setMode);
  const mode = useSiteTypeStore((state) => state.mode);
  const setEditedText = useSiteTypeStore((state) => state.setEditedText);
  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Simple Mode" delayDuration={0}>
        <button
          onClick={() => {
            setMode("simple");
            setEditedText(null);
          }}
          className={cn(
            "text-[#1d9bf0] hover:opacity-80",
            mode === "simple" ? "opacity-50" : "opacity-100"
          )}
        >
          <Zap size={16} />
        </button>
      </Tooltip>
      <Tooltip content="Complex Mode" delayDuration={0}>
        <button
          onClick={() => {
            setMode("complex");
            setEditedText(null);
          }}
          className={cn(
            "text-[#1d9bf0] hover:opacity-80",
            mode === "complex" ? "opacity-50" : "opacity-100"
          )}
        >
          <Brain size={16} />
        </button>
      </Tooltip>
      <Tooltip content="Edit Mode" delayDuration={0}>
        <button
          disabled={!hasText}
          onClick={() => {
            setMode("edit");
            setEditedText(null);
          }}
          className={cn(
            !hasText ? "text-gray-500" : "text-[#1d9bf0]",
            "hover:opacity-80",
            mode === "edit" || !hasText ? "opacity-50" : "opacity-100"
          )}
        >
          <Pencil size={16} />
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
