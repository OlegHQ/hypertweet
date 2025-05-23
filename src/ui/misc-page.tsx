import React from "react";
import { Layout } from "./layout";
import ApiConfig from "./api-config";
import { PageHeader } from "./page-header";
import { useGlobalState } from "./state";
import { app } from "./app";
import { Card, CardContent } from "./library/card";
import { motion } from "framer-motion";
import { Database, ArrowRight, History } from "lucide-react";
import { ConfigTypeKey } from "../background-app/domain";
import { ModelType } from "../background-app/ai/model-type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./library/select";

function ModelSelector() {
  const { selectedProfile } = useGlobalState();
  const [selectedModel, setSelectedModel] = React.useState<ModelType>(
    ModelType.GPT_3_5_TURBO
  );
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (selectedProfile) {
      loadModel();
    }
  }, [selectedProfile]);

  const loadModel = async () => {
    if (!selectedProfile) return;
    try {
      const model = await app.dataLayer.config.get<string>(
        selectedProfile.id,
        ConfigTypeKey.COMPLETION_MODEL
      );
      if (model) {
        setSelectedModel(model as ModelType);
      }
    } catch (error) {
      console.error("Error loading model:", error);
    }
  };

  const handleModelChange = async (value: string) => {
    if (!selectedProfile) return;
    setIsLoading(true);
    try {
      await app.dataLayer.config.set(
        selectedProfile.id,
        ConfigTypeKey.COMPLETION_MODEL,
        value
      );
      setSelectedModel(value as ModelType);
    } catch (error) {
      console.error("Error saving model:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedProfile) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="flex items-start gap-4 p-6">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                LLM Model
              </h2>
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-300 mb-4">
              Select the language model to use for generating replies.
            </p>
            <Select
              value={selectedModel}
              onValueChange={handleModelChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ModelType.GPT_3_5_TURBO}>
                  GPT-3.5 Turbo
                </SelectItem>
                <SelectItem value={ModelType.GPT_4O_MINI}>
                  GPT-4o Mini
                </SelectItem>
                <SelectItem value={ModelType.GPT_4_1_MINI}>
                  GPT-4.1 Mini
                </SelectItem>
                <SelectItem value={ModelType.GPT_4_1}>GPT-4.1</SelectItem>
                <SelectItem value={ModelType.GPT_4_0}>GPT-4o</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function MiscPage() {
  const { setCurrentRoute } = useGlobalState();

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
        <ModelSelector />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCurrentRoute("/request-logs")}
          >
            <CardContent className="flex items-start gap-4 p-6">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <History className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Request Logs
                  </h2>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  View and manage your AI request history, including prompts and responses.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
      </motion.div>
    </Layout>
  );
}
