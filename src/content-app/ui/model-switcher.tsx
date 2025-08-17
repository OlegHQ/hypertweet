import { Settings, Brain, Zap, Sidebar, Pencil } from "lucide-react";
import { colors, spacing } from "./styles";
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
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: spacing[2],
    }}>
      <Tooltip content="Simple Mode" delayDuration={0}>
        <button
          onClick={() => {
            setMode("simple");
            setEditedText(null);
          }}
          style={{
            color: colors.twitter.blue,
            opacity: mode === "simple" ? 0.5 : 1,
            transition: "opacity 0.15s",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            if (mode !== "simple") {
              e.currentTarget.style.opacity = "0.8";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = mode === "simple" ? "0.5" : "1";
          }}
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
          style={{
            color: colors.twitter.blue,
            opacity: mode === "complex" ? 0.5 : 1,
            transition: "opacity 0.15s",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            if (mode !== "complex") {
              e.currentTarget.style.opacity = "0.8";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = mode === "complex" ? "0.5" : "1";
          }}
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
          style={{
            color: !hasText ? colors.gray[500] : colors.twitter.blue,
            opacity: mode === "edit" || !hasText ? 0.5 : 1,
            transition: "opacity 0.15s",
            background: "none",
            border: "none",
            cursor: !hasText ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (hasText && mode !== "edit") {
              e.currentTarget.style.opacity = "0.8";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = mode === "edit" || !hasText ? "0.5" : "1";
          }}
        >
          <Pencil size={16} />
        </button>
      </Tooltip>
      {false && (
        <Tooltip content="Open Sidebar" delayDuration={0}>
          <button
            onClick={() => bgApp.system.openSidebar()}
            style={{
              color: colors.twitter.blue,
              transition: "opacity 0.15s",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <Sidebar size={16} />
          </button>
        </Tooltip>
      )}
      <Tooltip content="Settings" delayDuration={0}>
        <button
          onClick={onSettingsClick}
          style={{
            color: colors.twitter.blue,
            transition: "opacity 0.15s",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <Settings size={16} />
        </button>
      </Tooltip>
    </div>
  );
}
