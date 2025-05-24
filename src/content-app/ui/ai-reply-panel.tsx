import { useState } from "react";
import { cn } from "src/ui/library/utils";
import {
  Copy,
  Wand2,
  Sparkles,
  Shuffle,
  MessageSquare,
  Loader2,
  Brush,
} from "lucide-react";
import { Tooltip } from "src/ui/library/tooltip";
import { useSiteType } from "./use-site-type";
import usePostText from "./use-post-text";
import { bgApp } from "../bg-app";
import { ConfigTypeKey } from "src/background-app/domain/models/config-type-key";
import type { ActionType } from "src/background-app/ai/ai-facade";

interface AIReplyPanelProps {
  editMode?: boolean;
  text: string | null;
}

export default function AIReplyPanel({ text }: AIReplyPanelProps) {
  const [copied, setCopied] = useState(false);
  const [editedText, setEditedText] = useState(text);
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

  const handleAIAction = async (action: ActionType) => {
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

  const ActionButton = ({
    action,
    icon: Icon,
    label,
  }: {
    action: ActionType;
    icon: typeof Wand2;
    label: string;
  }) => (
    <Tooltip delayDuration={0} content={label}>
      <button
        onClick={() => handleAIAction(action)}
        disabled={!!loadingAction}
        className={cn(
          "text-[#1d9bf0] hover:opacity-80 p-2 rounded-full hover:bg-blue-50",
          loadingAction && "opacity-50 cursor-not-allowed"
        )}
      >
        {loadingAction === action ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Icon size={20} />
        )}
      </button>
    </Tooltip>
  );

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

      <div className="flex items-center gap-2">
        <ActionButton action="cleanup" icon={Brush} label="Clean Up" />
        <ActionButton action="simplify" icon={Wand2} label="Simplify" />
        <ActionButton action="smarter" icon={Sparkles} label="Make Smarter" />
        <ActionButton action="randomize" icon={Shuffle} label="Randomize" />
        <ActionButton action="bro" icon={MessageSquare} label="Bro Talk" />
      </div>
    </div>
  );
}
