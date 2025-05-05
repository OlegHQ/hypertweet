import React, { useEffect } from "react";
import { useGlobalState } from "./state";
import { app } from "./app";

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
      const openAiKey = await app.dataLayer.config.get<string>(
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
    <div className="space-y-4 mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">System Prompt</h2>
        <p className="text-gray-600">
          Personalize your replies and tweets. Keep it concise to minimize
          costs.
        </p>
        {!hasOpenAIKey && (
          <p className="mt-2 text-amber-600">
            ⚠️ OpenAI API key is not set.{" "}
            <a
              href="#/api-config"
              onClick={(e) => {
                e.preventDefault();
                setCurrentRoute("/api-config");
              }}
              className="text-amber-700 underline hover:text-amber-800"
            >
              Set up your API key
            </a>{" "}
            to enable prompt generation.
          </p>
        )}
      </div>

      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <div className="space-y-4">
        {isEditing ? (
          <>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter your system prompt here..."
              className="w-full h-32 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save Prompt"}
              </button>
              {hasOpenAIKey && (
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                >
                  Generate Prompt
                </button>
              )}
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="flex-1">
              {systemPrompt ? (
                <div className="text-gray-700">{systemPrompt}</div>
              ) : (
                <div className="text-gray-500">No system prompt set</div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 border rounded-md hover:bg-gray-50"
              >
                Edit
              </button>
              {systemPrompt && (
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-3 py-1 text-red-500 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
