import { useEffect, useState } from "react";
import { Layout } from "./layout";
import { PageHeader } from "./page-header";
import { motion } from "framer-motion";
import { Toast } from "./library/toast";
import { useGlobalState } from "./state";
import { app } from "./app";
import { ActionButtonsGrid } from "./library/action-buttons-grid";
import type { ThreadTask } from "src/background-app/ai/thread-tasks";
import { Card, CardContent } from "./library/card";
import { Info } from "lucide-react";

interface Tweet {
  text: string;
  author: {
    username: string;
  };
}

interface ThreadData {
  tweets: Tweet[];
}

export default function ChatGPTPromptsPage() {
  const { selectedProfile } = useGlobalState();
  const [showCopied, setShowCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">(
    "success"
  );

  const handleCopyThread = async (task: ThreadTask) => {
    try {
      const rawData = await app.content.getTaskThreadJSON(
        selectedProfile?.id ?? "",
        task
      );
      const data = (rawData as unknown) as ThreadData;
      if (!data) {
        setToastMessage(
          "No thread data found. Make sure you're on a thread page."
        );
        setToastVariant("error");
        setShowCopied(true);
        return;
      }

      await navigator.clipboard.writeText(JSON.stringify(data));
      setToastMessage(
        `JSON task is copied to clipboard! Paste it into ChatGPT or Grok to generate a reply.`
      );
      setToastVariant("success");
      setShowCopied(true);
    } catch (error) {
      setToastMessage("Failed to copy thread data");
      setToastVariant("error");
      setShowCopied(true);
    }
  };

  useEffect(() => {
    if (showCopied) {
      const timer = setTimeout(() => {
        setShowCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showCopied]);

  return (
    <Layout>
      <PageHeader title="ChatGPT Task Prompts" backRoute="/" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 max-w-3xl mx-auto space-y-6"
      >
        <ActionButtonsGrid onCopyThread={handleCopyThread} />
        <Card className="rounded-2xl shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  How it works
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>Open a thread you want to respond to</li>
                  <li>Click one of the task buttons below</li>
                  <li>The JSON data will be copied to your clipboard</li>
                  <li>Paste the JSON into ChatGPT (GPT-4 model recommended)</li>
                  <li>
                    ChatGPT will generate a response based on your personality
                    and the thread context
                  </li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
        {showCopied && (
          <Toast
            message={toastMessage}
            variant={toastVariant}
            onClose={() => setShowCopied(false)}
          />
        )}
      </motion.div>
    </Layout>
  );
}
