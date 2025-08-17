import { useState } from "react";
import { colors, spacing, fontSize, borderRadius } from "./styles";
import {
  Copy,
  Wand2,
  Loader2,
  Brush,
  BookOpen,
  Brain,
  User,
  AlertCircle,
  Minus,
  X,
  Eraser,
} from "lucide-react";
import { Tooltip } from "src/ui/library/tooltip";
import { useSiteType } from "./use-site-type";
import usePostText from "./use-post-text";
import { bgApp } from "../bg-app";
import { ConfigTypeKey } from "src/background-app/domain/models/config-type-key";
import type { ActionType } from "src/background-app/ai/ai-facade";
import { useSiteTypeStore } from "./site-type-store";
import { ActionButton } from "./action-button";

interface AIReplyPanelProps {
  editMode?: boolean;
  text: string | null;
}

export default function AIReplyPanel({ text }: AIReplyPanelProps) {
  const [copied, setCopied] = useState(false);
  const editedText = useSiteTypeStore((state) => state.editedText);
  const setEditedText = useSiteTypeStore((state) => state.setEditedText);
  const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);

  const siteType = useSiteType();
  const handleCopy = async () => {
    if (editedText) {
      await navigator.clipboard.writeText(editedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const loadPostContent = usePostText();

  const handleAIAction = async (action: ActionType | "clear") => {
    if (action === "clear") {
      setEditedText(null);
      return;
    }
    try {
      setLoadingAction(action);
      const content = await loadPostContent();
      if (!content) {
        return;
      }

      const lastId = await bgApp.dataLayer.config.get<string>(
        null,
        ConfigTypeKey.LAST_USED_PROFILE_ID
      );
      if (!lastId) {
        return;
      }

      const theText = editedText ? editedText : text;

      const reply = await bgApp.ai.editReply(
        siteType,
        lastId,
        content.postText,
        theText ?? "",
        action
      );
      setEditedText(reply);
    } catch (error) {
      console.error("Error transforming reply:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: spacing[4],
      padding: spacing[4],
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{
          fontSize: fontSize.sm.size,
          lineHeight: fontSize.sm.lineHeight,
          color: colors.gray[500],
        }}>Reply Preview</div>
        <Tooltip
          delayDuration={0}
          content={copied ? "Copied!" : "Copy to clipboard"}
        >
          <button
            onClick={handleCopy}
            style={{
              color: colors.twitter.blue,
              transition: "opacity 0.15s",
              opacity: copied ? 0.5 : 1,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              if (!copied) {
                e.currentTarget.style.opacity = "0.8";
              }
            }}
            onMouseLeave={(e) => {
              if (!copied) {
                e.currentTarget.style.opacity = "1";
              }
            }}
          >
            <Copy size={16} />
          </button>
        </Tooltip>
      </div>

      <div style={{
        backgroundColor: colors.gray[50],
        borderRadius: borderRadius.lg,
        padding: spacing[4],
        minHeight: "100px",
      }}>
        <div style={{
          color: colors.gray[700],
        }}>
          {loadingAction ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[2],
            }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              <span>Transforming reply...</span>
            </div>
          ) : editedText ? (
            editedText
          ) : (
            text
          )}
        </div>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: spacing[2],
        }}>
          <ActionButton
            action="cleanup"
            icon={Brush}
            label="Clean Up"
            loadingAction={loadingAction}
            onClick={handleAIAction}
          />
          <ActionButton
            action="simplify"
            icon={Wand2}
            label="Simplify"
            loadingAction={loadingAction}
            onClick={handleAIAction}
          />
          <ActionButton
            action="story"
            icon={BookOpen}
            label="Story Mode"
            loadingAction={loadingAction}
            onClick={handleAIAction}
          />
          <ActionButton
            action="depth"
            icon={Brain}
            label="Depth Mode"
            loadingAction={loadingAction}
            onClick={handleAIAction}
          />
          <ActionButton
            action="humanize"
            icon={User}
            label="Humanize"
            loadingAction={loadingAction}
            onClick={handleAIAction}
          />
          <ActionButton
            action="challenge"
            icon={AlertCircle}
            label="Challenge"
            loadingAction={loadingAction}
            onClick={handleAIAction}
          />
          <ActionButton
            action="shorten"
            icon={Minus}
            label="Shorten"
            loadingAction={loadingAction}
            onClick={handleAIAction}
          />
        </div>
        <ActionButton
          action="clear"
          icon={Eraser}
          label="Clear"
          loadingAction={loadingAction}
          onClick={handleAIAction}
        />
      </div>
    </div>
  );
}
