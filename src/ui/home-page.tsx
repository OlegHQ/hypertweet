import { useEffect } from "react";
import { app } from "./app";
import { Layout } from "./layout";
import { useGlobalState } from "./state";
import { Card, CardContent, CardHeader } from "./library/card";
import { motion } from "framer-motion";

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
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 max-w-4xl mx-auto"
      >
        <Card
          className="cursor-pointer transition-all hover:border-primary dark:hover:border-primary-600"
          onClick={() => setCurrentRoute("/reply-types")}
        >
          <CardHeader>
            <h2 className="text-lg font-medium">Reply Types</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Configure and manage your reply types to enhance the AI's
              understanding of your expertise and preferences.
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:border-primary dark:hover:border-primary-600"
          onClick={() => setCurrentRoute("/knowledge-base")}
        >
          <CardHeader>
            <h2 className="text-lg font-medium">Knowledge Base</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Configure and manage your knowledge base to enhance the AI's
              understanding of your expertise and preferences.
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:border-primary dark:hover:border-primary-600"
          onClick={() => setCurrentRoute("/misc")}
        >
          <CardHeader>
            <h2 className="text-lg font-medium">Miscellaneous</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Access various tools and utilities including API configuration, data
              backup, and thread copying functionality.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
}
