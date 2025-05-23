import { useState } from "react";
import { cn } from "src/ui/library/utils";
import { Copy, Wand2, Sparkles, Shuffle, MessageSquare } from "lucide-react";
import { Tooltip } from "src/ui/library/tooltip";
import { useSiteType } from "./use-site-type";

interface AIReplyPanelProps {
  editMode?: boolean;
  text: string | null;
}

export default function AIReplyPanel({ editMode, text }: AIReplyPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textarea = document.querySelector('[data-text="true"]');
    if (textarea?.textContent) {
      await navigator.clipboard.writeText(textarea.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAIAction = (action: string) => {
    const textarea = document.querySelector('[data-text="true"]');
    if (!textarea?.textContent) return;

    // Here you would implement the actual AI transformations
    // For now, we'll just log the action
    console.log(`AI Action: ${action}`, textarea.textContent);
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
        {/* This would be replaced with actual reply text */}
        <div className="text-gray-700">{text}</div>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip delayDuration={0} content="Simplify">
          <button
            onClick={() => handleAIAction("simplify")}
            className="text-[#1d9bf0] hover:opacity-80 p-2 rounded-full hover:bg-blue-50"
          >
            <Wand2 size={20} />
          </button>
        </Tooltip>
        <Tooltip delayDuration={0} content="Make Smarter">
          <button
            onClick={() => handleAIAction("smarter")}
            className="text-[#1d9bf0] hover:opacity-80 p-2 rounded-full hover:bg-blue-50"
          >
            <Sparkles size={20} />
          </button>
        </Tooltip>
        <Tooltip delayDuration={0} content="Randomize">
          <button
            onClick={() => handleAIAction("randomize")}
            className="text-[#1d9bf0] hover:opacity-80 p-2 rounded-full hover:bg-blue-50"
          >
            <Shuffle size={20} />
          </button>
        </Tooltip>
        <Tooltip delayDuration={0} content="Bro Talk">
          <button
            onClick={() => handleAIAction("broTalk")}
            className="text-[#1d9bf0] hover:opacity-80 p-2 rounded-full hover:bg-blue-50"
          >
            <MessageSquare size={20} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
