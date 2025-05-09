import React, { useEffect } from "react";
import { useGlobalState } from "./state";
import { app } from "./app";
import { Card, CardContent, CardHeader } from "./library/card";
import { Button } from "./library/button";
import { Textarea } from "./library/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Trash2, Save, Sparkles, AlertTriangle } from "lucide-react";

export default function SystemPromptConfig() {
  const {
    selectedProfile,
    hasProfileKey,
    setCurrentRoute,
    setProfileKey,
    areKeysFetched,
    setAreKeysFetched,
  } = useGlobalState();
  const [systemPrompt, setSystemPrompt] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  useEffect(() => {
    if (selectedProfile && !areKeysFetched) {
      loadProfileKeys();
    }
  }, [selectedProfile, areKeysFetched]);

  const loadProfileKeys = async () => {
    if (!selectedProfile) return;
    setIsLoading(true);
    try {
      const openAiKey = await app.dataLayer.config.getCredential(
        selectedProfile.id,
        "openAiKey"
      );

      if (openAiKey) {
        setProfileKey(selectedProfile.id, "openAiKey", openAiKey);
      }
      setAreKeysFetched(true);
    } catch (error) {
      console.error("Error loading profile keys:", error);
      setError("Failed to load profile keys");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProfile) {
      const loadSystemPrompt = async () => {
        try {
          const prompt = await app.dataLayer.config.get<string>(
            selectedProfile.id,
            "systemPrompt"
          );
          if (prompt) {
            setSystemPrompt(prompt);
          }
        } catch (error) {
          console.error("Error loading system prompt:", error);
        }
      };
      loadSystemPrompt();
    }
  }, [selectedProfile]);

  const handleSave = async () => {
    if (!selectedProfile) return;
    setIsLoading(true);
    setError(null);
    try {
      await app.dataLayer.config.set(
        selectedProfile.id,
        "systemPrompt",
        systemPrompt
      );
      setIsEditing(false);
    } catch (error) {
      setError("Failed to save system prompt");
      console.error("Error saving system prompt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProfile) return;
    setIsLoading(true);
    setError(null);
    try {
      await app.dataLayer.config.set(selectedProfile.id, "systemPrompt", null);
      setSystemPrompt("");
      setIsEditing(false);
    } catch (error) {
      setError("Failed to delete system prompt");
      console.error("Error deleting system prompt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProfile) return;
    setIsLoading(true);
    setError(null);
    try {
      const twitterConfig = await app.dataLayer.config.get<any>(
        selectedProfile.id,
        "twitterProfile"
      );
      const linkedInConfig = await app.dataLayer.config.get<any>(
        selectedProfile.id,
        "linkedInProfile"
      );

      if (!twitterConfig || !linkedInConfig) {
        throw new Error("Please fetch Twitter and LinkedIn profiles first");
      }

      const personalityString = await app.ai.buildPersonaPayload(
        selectedProfile.id
      );
      setSystemPrompt(personalityString);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to generate prompt"
      );
      console.error("Error generating system prompt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedProfile) return null;

  const hasOpenAIKey = selectedProfile
    ? hasProfileKey(selectedProfile.id, "openAiKey")
    : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 mb-6"
    >
      <Card className="shadow-xl">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            System Prompt
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Personalize your replies and tweets. Keep it concise to minimize
            costs.
          </p>
          {!hasOpenAIKey && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>
                OpenAI API key is not set.{" "}
                <button
                  onClick={() => setCurrentRoute("/misc")}
                  className="underline hover:text-amber-800 dark:hover:text-amber-300"
                >
                  Set up your API key
                </button>{" "}
                to enable prompt generation.
              </span>
            </motion.div>
          )}
        </CardHeader>

        <CardContent>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg mb-4"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Enter your system prompt here..."
                  className="min-h-[8rem]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? "Saving..." : "Save Prompt"}
                  </Button>
                  {hasOpenAIKey && (
                    <Button
                      onClick={handleGenerate}
                      disabled={isLoading}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate Prompt
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex-1">
                  {systemPrompt ? (
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {systemPrompt}
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400">
                      No system prompt set
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  {systemPrompt && (
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
