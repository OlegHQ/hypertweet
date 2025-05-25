import { cn } from "src/ui/library/utils";
import { Tooltip } from "src/ui/library/tooltip";
import { Loader2 } from "lucide-react";
import type { ActionType } from "src/background-app/ai/ai-facade";

interface ActionButtonProps {
  action: ActionType | "clear";
  icon: React.ElementType;
  label: string;
  loadingAction: ActionType | null;
  onClick: (action: ActionType | "clear") => void;
}

export function ActionButton({
  action,
  icon: Icon,
  label,
  loadingAction,
  onClick,
}: ActionButtonProps) {
  return (
    <Tooltip delayDuration={0} content={label}>
      <button
        onClick={() => onClick(action)}
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
}
