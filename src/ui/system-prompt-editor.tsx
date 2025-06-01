import React, { useEffect } from "react";
import { useGlobalState } from "./state";
import { app } from "./app";
import { Card, CardContent, CardHeader } from "./library/card";
import { Button } from "./library/button";
import { Textarea } from "./library/textarea";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Edit2,
  Trash2,
  Save,
  Sparkles,
  AlertTriangle,
  Plus,
  GripVertical,
  MessageSquare,
  List,
  Reply,
} from "lucide-react";
import { ConfigTypeKey } from "src/background-app/domain";
import { Input } from "./library/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./library/select";
import SystemInstructionsEditor from "./system-instructions-editor";

interface SystemPromptEditorProps {
  selectedProfile: { id: string };
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  isLoading: boolean;
  setError: (error: string | null) => void;
  hasOpenAIKey: boolean;
  setCurrentRoute: (route: string) => void;
}

export default function SystemPromptEditor({
  selectedProfile,
  systemPrompt,
  setSystemPrompt,
  isLoading,
  setError,
  hasOpenAIKey,
  setCurrentRoute,
}: SystemPromptEditorProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  const handleSave = async () => {
    if (!selectedProfile) return;
    try {
      await app.dataLayer.config.set(
        selectedProfile.id,
        ConfigTypeKey.SYSTEM_PROMPT,
        systemPrompt
      );
      setIsEditing(false);
    } catch (error) {
      setError("Failed to save system prompt");
      console.error("Error saving system prompt:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedProfile) return;
    try {
      await app.dataLayer.config.set(
        selectedProfile.id,
        ConfigTypeKey.SYSTEM_PROMPT,
        null
      );
      setSystemPrompt("");
      setIsEditing(false);
    } catch (error) {
      setError("Failed to delete system prompt");
      console.error("Error deleting system prompt:", error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProfile) return;
    try {
      const twitterConfig = await app.dataLayer.config.get<any>(
        selectedProfile.id,
        ConfigTypeKey.TWITTER_PROFILE
      );
      const linkedInConfig = await app.dataLayer.config.get<any>(
        selectedProfile.id,
        ConfigTypeKey.LINKEDIN_PROFILE
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
    }
  };

  return (
    <>
      {!hasOpenAIKey && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg flex items-center gap-2"
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

      <Card className="shadow-xl">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            System Prompt
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Personalize your replies and tweets. Keep it concise to minimize
            costs.
          </p>
        </CardHeader>

        <CardContent>
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
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 min-h-[8rem]">
                  {systemPrompt ? (
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {systemPrompt}
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400">
                      No content set
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
                  {hasOpenAIKey && (
                    <Button
                      variant="outline"
                      onClick={handleGenerate}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
