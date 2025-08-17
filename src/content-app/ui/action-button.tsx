import { Tooltip } from "src/ui/library/tooltip";
import { Loader2 } from "lucide-react";
import type { ActionType } from "src/background-app/ai/ai-facade";
import { actionButtonStyles } from "./styles";

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
        style={{
          ...actionButtonStyles.base,
          ...(!!loadingAction ? actionButtonStyles.disabled : {}),
        }}
        onMouseEnter={(e) => {
          if (!loadingAction) {
            Object.assign(e.currentTarget.style, actionButtonStyles.hover);
          }
        }}
        onMouseLeave={(e) => {
          if (!loadingAction) {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        {loadingAction === action ? (
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <Icon size={20} />
        )}
      </button>
    </Tooltip>
  );
}
