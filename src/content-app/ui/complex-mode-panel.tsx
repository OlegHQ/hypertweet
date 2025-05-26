import { useCallback, useEffect, useState } from "react";
import { ThreadTask } from "src/background-app/ai/thread-tasks";
import { bgApp } from "../bg-app";
import { useLastUsedProfileId } from "./use-last-used-profile-id";
import {
  BookOpen,
  Lightbulb,
  Loader2,
  MessageSquare,
  Quote,
  Sparkles,
  ThumbsUp,
  Wand2,
} from "lucide-react";
import { Button } from "src/ui/library/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "src/ui/library/select";
import { Tooltip } from "src/ui/library/tooltip";
import { cn } from "src/ui/library/utils";
import useApplyText from "./use-apply-text";
import { ConfigTypeKey } from "src/background-app/domain";

const tasks = [
  {
    task: ThreadTask.BASIC,
    icon: MessageSquare,
    label: "Basic",
    tooltip: "Generate a basic response based on author's persona",
  },
  {
    task: ThreadTask.CLEANUP,
    icon: Wand2,
    label: "Clean Up",
    tooltip: "Clean up and format your current response",
  },
  {
    task: ThreadTask.IMPACTFUL,
    icon: Sparkles,
    label: "Impact",
    tooltip: "Generate an impactful response based on personality",
  },
  {
    task: ThreadTask.STORY,
    icon: BookOpen,
    label: "Story",
    tooltip: "Share a short, relevant story based on the thread",
  },
  {
    task: ThreadTask.PERSPECTIVE,
    icon: Lightbulb,
    label: "Perspective",
    tooltip: "Share a unique perspective or insight",
  },
  {
    task: ThreadTask.METAPHOR,
    icon: Quote,
    label: "Metaphor",
    tooltip: "Write a smart phrase, metaphor, or simile",
  },
  {
    task: ThreadTask.TIP,
    icon: ThumbsUp,
    label: "Tip",
    tooltip: "Share your personal experience with the tip",
  },
];

function useVariantCount() {
  const lastUsedProfileId = useLastUsedProfileId();
  const [variantCount, setVariantCount2] = useState(5);
  useEffect(() => {
    (async () => {
      if (lastUsedProfileId) {
        const variantCount = await bgApp.dataLayer.config.get<number>(
          lastUsedProfileId,
          ConfigTypeKey.COMPLEX_MODE_VARIANT_COUNT
        );

        setVariantCount2(variantCount ?? 5);
      }
    })();
  }, [lastUsedProfileId]);
  const setVariantCount = useCallback(
    (count: number) => {
      setVariantCount2(count);
      bgApp.dataLayer.config.set(
        lastUsedProfileId,
        ConfigTypeKey.COMPLEX_MODE_VARIANT_COUNT,
        count
      );
    },
    [lastUsedProfileId, setVariantCount2]
  );
  return [variantCount, setVariantCount] as const;
}

export default function ComplexModePanel() {
  const lastUsedProfileId = useLastUsedProfileId();
  const [isLoading, setIsLoading] = useState(false);
  const [variantCount, setVariantCount] = useVariantCount();
  const [replyVariants, setReplyVariants] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<ThreadTask | null>(null);

  const handleCopyThread = async (task: ThreadTask) => {
    if (!lastUsedProfileId) {
      return;
    }

    setSelectedTask(task);
    setIsLoading(true);
    try {
      const { replyVariants } = await bgApp.content.generateComplex(
        lastUsedProfileId,
        task,
        variantCount
      );
      setReplyVariants(replyVariants);
    } catch (error) {
      console.error("Error generating complex reply:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const applyText = useApplyText();

  const handleApplyVariant = (variant: string) => {
    applyText(variant);
    setReplyVariants([]);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 max-w-[600px]">
      <div className="flex items-start justify-between px-3 py-1.5">
        <div className="flex-1 min-w-0 mr-2">
          <div className="relative">
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              <div className="flex items-center gap-0.5 pr-1 pb-5">
                {tasks.map(({ task, icon: Icon, label, tooltip }) => (
                  <Tooltip key={task} content={tooltip}>
                    <button
                      onClick={() => handleCopyThread(task)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-sm whitespace-nowrap",
                        "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                        selectedTask === task &&
                          "bg-[#1d9bf0]/10 text-[#1d9bf0]"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{label}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <Select
            value={variantCount.toString()}
            onValueChange={(value) => setVariantCount(Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="h-6 w-[60px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1d9bf0]" />
        </div>
      )}

      {replyVariants.length > 0 && !isLoading && (
        <div className="border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-xs text-gray-500">Suggestions</span>
            <button
              onClick={() => setReplyVariants([])}
              className="text-xs text-[#1d9bf0] hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="space-y-0.5 px-3 pb-1.5">
            {replyVariants.map((variant, index) => (
              <div
                key={index}
                className="group flex items-start justify-between gap-2 rounded-md p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-tight">
                  {variant}
                </div>
                <Button
                  onClick={() => handleApplyVariant(variant)}
                  className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Apply
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
