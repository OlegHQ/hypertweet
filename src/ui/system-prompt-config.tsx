import React, { useEffect } from "react";
import { useGlobalState } from "./state";
import { app } from "./app";
import { motion, AnimatePresence } from "framer-motion";
import { ConfigTypeKey } from "src/background-app/domain";
import SystemInstructionsEditor from "./system-instructions-editor";
import SystemPromptEditor from "./system-prompt-editor";
import SystemPromptReplyExamplesEditor from "./system-prompt-reply-examples-editor";
import type { ReplyExample } from "./system-prompt-reply-examples-editor";

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
  const [instructions, setInstructions] = React.useState<string[]>([]);
  const [replyExamples, setReplyExamples] = React.useState<ReplyExample[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
        ConfigTypeKey.OPENAI_API_KEY
      );

      if (openAiKey) {
        setProfileKey(
          selectedProfile.id,
          ConfigTypeKey.OPENAI_API_KEY,
          openAiKey
        );
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
      const loadConfigs = async () => {
        try {
          const [prompt, instructions, examples] = await Promise.all([
            app.dataLayer.config.get<string>(
              selectedProfile.id,
              ConfigTypeKey.SYSTEM_PROMPT
            ),
            app.dataLayer.config.get<string[]>(
              selectedProfile.id,
              ConfigTypeKey.SYSTEM_INSTRUCTIONS
            ),
            app.dataLayer.config.get<ReplyExample[]>(
              selectedProfile.id,
              ConfigTypeKey.TWITTER_REPLY_EXAMPLES
            ),
          ]);

          if (prompt) setSystemPrompt(prompt);
          if (instructions) setInstructions(instructions);
          if (examples) setReplyExamples(examples);
        } catch (error) {
          console.error("Error loading configs:", error);
        }
      };
      loadConfigs();
    }
  }, [selectedProfile]);

  if (!selectedProfile) return null;

  const hasOpenAIKey = selectedProfile
    ? hasProfileKey(selectedProfile.id, ConfigTypeKey.OPENAI_API_KEY)
    : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 mb-6"
    >
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

      <SystemPromptEditor
        selectedProfile={selectedProfile}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        isLoading={isLoading}
        setError={setError}
        hasOpenAIKey={hasOpenAIKey}
        setCurrentRoute={setCurrentRoute}
      />

      <SystemInstructionsEditor
        selectedProfile={selectedProfile}
        instructions={instructions}
        setInstructions={setInstructions}
        isLoading={isLoading}
        setError={setError}
      />

      <SystemPromptReplyExamplesEditor
        selectedProfile={selectedProfile}
        replyExamples={replyExamples}
        setReplyExamples={setReplyExamples}
        isLoading={isLoading}
        setError={setError}
      />
    </motion.div>
  );
}
