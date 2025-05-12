import { useEffect, useState } from "react";
import { Layout } from "./layout";
import { PageHeader } from "./page-header";
import { motion } from "framer-motion";
import { Toast } from "./library/toast";
import { useGlobalState } from "./state";
import { app } from "./app";
import { ActionButtonsGrid } from "./library/action-buttons-grid";
import type { ThreadTask } from "src/background-app/ai/thread-tasks";

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
      const data = (await app.content.getTaskThreadJSON(
        selectedProfile?.id ?? "",
        task
      )) as ThreadData;
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
