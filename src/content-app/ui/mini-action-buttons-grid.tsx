import {
  MessageSquare,
  Wand2,
  Sparkles,
  BookOpen,
  Lightbulb,
  Quote,
  ThumbsUp,
} from "lucide-react";
import { Tooltip } from "src/ui/library/tooltip";
import { ThreadTask } from "src/background-app/ai/thread-tasks";

export default function MiniActionButtonsGrid({
  onCopyThread: onCopyThread,
}: {
  onCopyThread: (task: ThreadTask) => Promise<void>;
}) {
  const tasks = [
    {
      task: ThreadTask.FIVE_VARIANTS,
      icon: MessageSquare,
      label: "5 Variants",
      tooltip: "Generate 5 response variants based on author's persona",
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

  return (
    <div className="flex flex-wrap gap-2">
      {tasks.map(({ task, icon: Icon, label, tooltip }) => (
        <Tooltip key={task} content={tooltip}>
          <button
            onClick={() => onCopyThread(task)}
            className="w-[56px] h-[56px] flex flex-col items-center justify-center p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="p-1 bg-primary-50 dark:bg-primary-900/20 rounded-md mb-1">
              <Icon className="h-3 w-3 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate w-full text-center">
              {label}
            </span>
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
