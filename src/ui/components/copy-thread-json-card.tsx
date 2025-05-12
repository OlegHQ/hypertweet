import React from "react";
import { Card, CardContent } from "../library/card";
import { Copy, ArrowRight } from "lucide-react";
import { app } from "../app";
import { useGlobalState } from "../state";
import { Toast } from "../library/toast";

interface CopyThreadJsonCardProps {
  onCopy: (message: string, variant: "success" | "error") => void;
}

export function CopyThreadJsonCard({ onCopy }: CopyThreadJsonCardProps) {
  const { selectedProfile } = useGlobalState();

  const handleCopyTweetJson = async () => {
    try {
      const data = await app.content.getCurrentTweetThreadJSON(
        selectedProfile?.id ?? ""
      );
      if (!data) {
        onCopy(
          "No thread data found. Make sure you're on a thread page.",
          "error"
        );
        return;
      }
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      onCopy("Thread JSON copied to clipboard!", "success");
    } catch (error) {
      onCopy("Failed to copy thread JSON to clipboard", "error");
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCopyTweetJson}
    >
      <CardContent className="flex items-start gap-4 p-6">
        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <Copy className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Copy X Thread JSON
            </h2>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            When you're on an X (Twitter) thread page, click this button to copy
            a formatted JSON with the thread ID and URL. This makes it easy to
            share thread context with ChatGPT for analysis or response
            generation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 