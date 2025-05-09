import { useEffect } from "react";
import { app } from "./app";
import { Layout } from "./layout";
import { useGlobalState } from "./state";

export default function HomePage() {
  const {
    setSelectedProfile,
    setCurrentRoute,
    setLastUsedProfileId,
    selectedProfile,
  } = useGlobalState();

  useEffect(() => {
    async function loadLastUsedProfile() {
      try {
        const lastId = await app.dataLayer.config.get<string>(
          null,
          "lastUsedProfileId"
        );
        if (lastId) {
          setLastUsedProfileId(lastId);
          const profile = await app.dataLayer.profile.get(lastId);
          if (profile) {
            setSelectedProfile(profile);
          }
        }
      } catch (error) {
        console.error("Failed to load last used profile:", error);
      }
    }
    loadLastUsedProfile();
  }, [setSelectedProfile, setLastUsedProfileId]);

  useEffect(() => {
    if (selectedProfile?.id) {
      app.dataLayer.config.set(null, "lastUsedProfileId", selectedProfile.id);
    }
  }, [selectedProfile]);

  return (
    <Layout>
      <div className="space-y-4">
        <div
          className="bg-white rounded-lg border p-4 cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => setCurrentRoute("/reply-types")}
        >
          <h2 className="text-lg font-medium mb-2">Reply Types</h2>
          <p className="text-gray-600">
            Configure and manage your reply types to enhance the AI's
            understanding of your expertise and preferences.
          </p>
        </div>
        <div
          className="bg-white rounded-lg border p-4 cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => setCurrentRoute("/knowledge-base")}
        >
          <h2 className="text-lg font-medium mb-2">Knowledge Base</h2>
          <p className="text-gray-600">
            Configure and manage your knowledge base to enhance the AI's
            understanding of your expertise and preferences.
          </p>
        </div>
        <div
          className="bg-white rounded-lg border p-4 cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => setCurrentRoute("/misc")}
        >
          <h2 className="text-lg font-medium mb-2">Miscellaneous</h2>
          <p className="text-gray-600">
            Access various tools and utilities including API configuration, data
            backup, and thread copying functionality.
          </p>
        </div>
      </div>
    </Layout>
  );
}
