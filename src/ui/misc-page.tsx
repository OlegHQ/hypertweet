import React from "react";
import { Layout } from "./layout";
import ApiConfig from "./api-config";
import { PageHeader } from "./page-header";
import { useGlobalState } from "./state";
import { app } from "./app";
import FormatInstructionBuilder from "./prompt-builder";
import { Card, CardContent } from "./library/card";
import { motion } from "framer-motion";
import { Database, Copy, ArrowRight } from "lucide-react";
import { Toast } from "./library/toast";

export default function MiscPage() {
  const { setCurrentRoute, selectedProfile } = useGlobalState();
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastVariant, setToastVariant] = React.useState<"success" | "error">("success");

  const handleCopyTweetJson = async () => {
    try {
      const data = await app.content.getCurrentTweetThreadJSON(
        selectedProfile?.id ?? ""
      );
      if (!data) {
        setToastMessage("No thread data found. Make sure you're on a thread page.");
        setToastVariant("error");
        setShowToast(true);
        return;
      }
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setToastMessage("Thread JSON copied to clipboard!");
      setToastVariant("success");
      setShowToast(true);
    } catch (error) {
      setToastMessage("Failed to copy thread JSON to clipboard");
      setToastVariant("error");
      setShowToast(true);
    }
  };

  React.useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <Layout>
      <PageHeader title="Miscellaneous" backRoute="/" />
      <motion.div
        className="space-y-6 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <ApiConfig />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCurrentRoute("/data-backup")}
          >
            <CardContent className="flex items-start gap-4 p-6">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <Database className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Data Backup & Restore
                  </h2>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Create backups of your data including profiles, settings, and
                  reply types. You can also restore your data from a previous
                  backup file.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
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
                  When you're on an X (Twitter) thread page, click this button
                  to copy a formatted JSON with the thread ID and URL. This
                  makes it easy to share thread context with ChatGPT for
                  analysis or response generation.
                </p>
              </div>
            </CardContent>
          </Card>
          {showToast && (
            <Toast
              message={toastMessage}
              variant={toastVariant}
              onClose={() => setShowToast(false)}
            />
          )}
        </motion.div>
      </motion.div>
      <FormatInstructionBuilder />
    </Layout>
  );
}
