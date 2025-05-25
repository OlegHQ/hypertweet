import { useState } from "react";
import { cn } from "src/ui/library/utils";
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
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">Reply Preview</div>
        <Tooltip
          delayDuration={0}
          content={copied ? "Copied!" : "Copy to clipboard"}
        >
          <button
            onClick={handleCopy}
            className={cn(
              "text-[#1d9bf0] hover:opacity-80 transition-opacity",
              copied && "opacity-50"
            )}
          >
            <Copy size={16} />
          </button>
        </Tooltip>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
        <div className="text-gray-700">
          {loadingAction ? (
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Transforming reply...</span>
            </div>
          ) : editedText ? (
            editedText
          ) : (
            text
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <div className="flex items-center gap-2">
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
