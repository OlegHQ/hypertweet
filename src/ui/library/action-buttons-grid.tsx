import React from "react";
import { Card, CardContent } from "./card";
import { Tooltip } from "./tooltip";
import {
  MessageSquare,
  Wand2,
  Sparkles,
  BookOpen,
  Lightbulb,
  Quote,
  ThumbsUp,
} from "lucide-react";
import { ThreadTask } from "src/background-app/ai/thread-tasks";

interface ActionButtonsGridProps {
  onCopyThread(task: ThreadTask): Promise<void>;
}

export function ActionButtonsGrid({ onCopyThread }: ActionButtonsGridProps) {
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
    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
      {tasks.map(({ task, icon: Icon, label, tooltip }) => (
        <Tooltip key={task} content={tooltip}>
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow aspect-square"
            onClick={() => onCopyThread(task)}
          >
            <CardContent className="flex flex-col items-center justify-center gap-2 p-4 h-full">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 text-center">
                {label}
              </h2>
            </CardContent>
          </Card>
        </Tooltip>
      ))}
    </div>
  );
}
