import React from "react";
import { useGlobalState } from "./state";
import { app } from "./app";

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

  React.useEffect(() => {
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

  const openAiKey = selectedProfile
    ? getProfileKey(selectedProfile.id, "openAiKey")?.key || ""
    : "";

  const handleSave = async () => {
    if (!selectedProfile) return;
    try {
      const input = document.querySelector(
        'input[type="text"]'
      ) as HTMLInputElement;
      const value = input.value;

      // Update both global state and persistent storage
      setProfileKey(selectedProfile.id, "openAiKey", value);
      await app.dataLayer.config.set(selectedProfile.id, "openAiKey", value);

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
      // Remove from both global state and persistent storage
      removeProfileKey(selectedProfile.id, "openAiKey");
      await app.dataLayer.config.delete(selectedProfile.id, "openAiKey");

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
      <div className="bg-white rounded-lg border p-4 mb-4">
        <h2 className="text-lg font-medium mb-4">API Configuration</h2>
        <div className="text-gray-600">Loading API keys...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4 mb-4">
      <h2 className="text-lg font-medium mb-4">API Configuration</h2>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {success && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            OpenAI API Key
          </label>
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                defaultValue={openAiKey}
                className="w-full px-3 py-2 border rounded-md font-mono"
                placeholder="Enter your OpenAI API key"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={openAiKey || "••••••••••••••••"}
                  disabled
                  className="w-full px-3 py-2 border rounded-md bg-gray-50"
                />
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Edit
                </button>
                {hasProfileKey(selectedProfile.id, "openAiKey") && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-red-500 border border-red-500 rounded-md hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
              {!hasProfileKey(selectedProfile.id, "openAiKey") && (
                <div className="text-sm text-gray-600">
                  <p className="mb-2">No OpenAI API key has been added yet.</p>
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
                    . Once you have your key, click the Edit button above to add
                    it.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
