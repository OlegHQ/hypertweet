import React, { useEffect } from "react";
import { useGlobalState } from "./state";
import { app } from "./app";
import { Card, CardContent, CardHeader } from "./library/card";
import { Button } from "./library/button";
import { Input } from "./library/input";
import { motion } from "framer-motion";
import { ConfigTypeKey } from "src/background-app/data";

export default function ApiConfig() {
  const { selectedProfile } = useGlobalState();
  const {
    getProfileKey,
    setProfileKey,
    removeProfileKey,
    hasProfileKey,
    areKeysFetched,
    setAreKeysFetched,
  } = useGlobalState();
  const [isEditing, setIsEditing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

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

  const openAiKey = selectedProfile
    ? getProfileKey(selectedProfile.id, ConfigTypeKey.OPENAI_API_KEY)?.key || ""
    : "";

  const handleSave = async () => {
    if (!selectedProfile) return;
    try {
      const input = document.querySelector(
        'input[type="text"]'
      ) as HTMLInputElement;
      const value = input.value;

      setProfileKey(selectedProfile.id, ConfigTypeKey.OPENAI_API_KEY, value);
      await app.dataLayer.config.setCredential(
        selectedProfile.id,
        ConfigTypeKey.OPENAI_API_KEY,
        value
      );

      setIsEditing(false);
      setSuccess("OpenAI key saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error saving OpenAI key:", error);
      setError("Failed to save OpenAI key");
    }
  };

  const handleDelete = async () => {
    if (!selectedProfile) return;
    try {
      removeProfileKey(selectedProfile.id, ConfigTypeKey.OPENAI_API_KEY);
      await app.dataLayer.config.delete(
        selectedProfile.id,
        ConfigTypeKey.OPENAI_API_KEY
      );

      setIsEditing(false);
      setSuccess("OpenAI key deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting OpenAI key:", error);
      setError("Failed to delete OpenAI key");
    }
  };

  if (!selectedProfile) {
    return null;
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="rounded-2xl shadow-xl">
          <CardHeader className="font-semibold text-xl">
            API Configuration
          </CardHeader>
          <CardContent>
            <div className="text-gray-600">Loading API keys...</div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="rounded-2xl shadow-xl">
        <CardHeader className="font-semibold text-xl">
          API Configuration
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-100 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
              </label>
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    type="text"
                    defaultValue={openAiKey}
                    className="font-mono"
                    placeholder="Enter your OpenAI API key"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      Save
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      value={openAiKey || "••••••••••••••••"}
                      disabled
                      className="bg-gray-50 font-mono"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                    {hasProfileKey(
                      selectedProfile.id,
                      ConfigTypeKey.OPENAI_API_KEY
                    ) && (
                      <Button variant="destructive" onClick={handleDelete}>
                        Delete
                      </Button>
                    )}
                  </div>
                  {!hasProfileKey(
                    selectedProfile.id,
                    ConfigTypeKey.OPENAI_API_KEY
                  ) && (
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>No OpenAI API key has been added yet.</p>
                      <p>
                        You can get an API key from the{" "}
                        <a
                          href="https://platform.openai.com/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          OpenAI API Keys page
                        </a>
                        . Once you have your key, click the Edit button above to
                        add it.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
