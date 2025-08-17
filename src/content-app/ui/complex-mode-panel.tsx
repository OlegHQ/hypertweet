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
import useApplyText from "./use-apply-text";
import { ConfigTypeKey } from "src/background-app/domain";
import { complexPanelStyles, colors, spacing, fontSize, borderRadius } from "./styles";

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

  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  return (
    <div style={{
      ...complexPanelStyles.container,
      ...(isDark ? complexPanelStyles.containerDark : {}),
    }}>
      <div style={complexPanelStyles.header}>
        <div style={complexPanelStyles.buttonContainer}>
          <div style={complexPanelStyles.buttonScroll}>
            <div style={complexPanelStyles.buttonWrapper} className="hypertweet-scrollbar">
              <div style={complexPanelStyles.buttonGroup}>
                {tasks.map(({ task, icon: Icon, label, tooltip }) => (
                  <Tooltip key={task} content={tooltip}>
                    <button
                      onClick={() => handleCopyThread(task)}
                      style={{
                        ...complexPanelStyles.taskButton,
                        ...(selectedTask === task 
                          ? (isDark ? complexPanelStyles.taskButtonActiveDark : complexPanelStyles.taskButtonActive)
                          : {}),
                      }}
                      onMouseEnter={(e) => {
                        if (selectedTask !== task) {
                          Object.assign(e.currentTarget.style, 
                            isDark ? complexPanelStyles.taskButtonHoverDark : complexPanelStyles.taskButtonHover
                          );
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTask !== task) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <Icon style={{ width: "14px", height: "14px" }} />
                      <span>{label}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={complexPanelStyles.variantSelect}>
          <Select
            value={variantCount.toString()}
            onValueChange={(value) => setVariantCount(Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger style={{ height: "24px", width: "60px", fontSize: "12px" }}>
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
        <div style={complexPanelStyles.loadingContainer}>
          <Loader2 style={{ 
            width: "14px", 
            height: "14px", 
            color: colors.twitter.blue,
            animation: "spin 1s linear infinite" 
          }} />
        </div>
      )}

      {replyVariants.length > 0 && !isLoading && (
        <div style={{
          borderTop: `1px solid ${isDark ? colors.gray[800] : colors.gray[200]}`,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `${spacing[1.5]} ${spacing[3]}`,
          }}>
            <span style={{
              fontSize: fontSize.xs.size,
              lineHeight: fontSize.xs.lineHeight,
              color: colors.gray[500],
            }}>Suggestions</span>
            <button
              onClick={() => setReplyVariants([])}
              style={{
                fontSize: fontSize.xs.size,
                lineHeight: fontSize.xs.lineHeight,
                color: colors.twitter.blue,
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              Clear
            </button>
          </div>
          <div style={complexPanelStyles.variantsList}>
            {replyVariants.map((variant, index) => (
              <div
                key={index}
                style={{
                  ...complexPanelStyles.variantItem,
                  ...(isDark ? complexPanelStyles.variantItemDark : {}),
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: spacing[2],
                }}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, 
                    isDark ? complexPanelStyles.variantItemHoverDark : complexPanelStyles.variantItemHover
                  );
                  const button = e.currentTarget.querySelector('button') as HTMLElement;
                  if (button) button.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, 
                    isDark ? complexPanelStyles.variantItemDark : complexPanelStyles.variantItem
                  );
                  const button = e.currentTarget.querySelector('button') as HTMLElement;
                  if (button) button.style.opacity = "0";
                }}
              >
                <div style={{
                  ...complexPanelStyles.variantText,
                  ...(isDark ? complexPanelStyles.variantTextDark : {}),
                  flex: 1,
                  lineHeight: "1.25",
                }}>
                  {variant}
                </div>
                <Button
                  onClick={() => handleApplyVariant(variant)}
                  style={{
                    height: "24px",
                    padding: `0 ${spacing[2]}`,
                    fontSize: fontSize.xs.size,
                    lineHeight: fontSize.xs.lineHeight,
                    opacity: 0,
                    transition: "opacity 0.15s",
                  }}
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
