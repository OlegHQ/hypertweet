import { useEffect } from "react";
import { app } from "./app";
import { Layout } from "./layout";
import { useGlobalState } from "./state";
import { Card, CardContent, CardHeader } from "./library/card";
import { motion } from "framer-motion";
import { ConfigTypeKey } from "src/background-app/domain";
import {
  MessageSquare,
  Reply,
  UserCircle,
  Settings,
  Sparkles,
  Brain,
  Zap,
  BookOpen,
} from "lucide-react";
import { browserApi } from "src/utils/browser-api";

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
          ConfigTypeKey.LAST_USED_PROFILE_ID
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
      app.dataLayer.config.set(
        null,
        ConfigTypeKey.LAST_USED_PROFILE_ID,
        selectedProfile.id
      );
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
          onClick={() => setCurrentRoute("/posts-studio")}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-medium">Posts Studio</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Create engaging X posts with AI assistance. Generate viral
              content, analyze high-performing tweets, and maintain your unique
              voice.
            </p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-all hover:border-primary dark:hover:border-primary-600"
          onClick={() => setCurrentRoute("/chatgpt-prompts")}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-medium">
                ChatGPT Reply Task Prompts
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Generate structured JSON prompts for ChatGPT to create engaging
              content. Optimize your prompts for better results and more
              efficient content generation.
            </p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-all hover:border-primary dark:hover:border-primary-600"
          onClick={() => setCurrentRoute("/reply-types")}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-medium">Reply Types</h2>
            </div>
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
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-medium">Personality Configuration</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Configure your personality and writing style by connecting your X
              (Twitter) and LinkedIn profiles. This helps the AI understand your
              tone, expertise, and communication style.
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:border-primary dark:hover:border-primary-600"
          onClick={() => setCurrentRoute("/misc")}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-medium">Miscellaneous</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Access various tools and utilities including API configuration,
              data backup, and thread copying functionality.
            </p>
          </CardContent>
        </Card>
        <div>
          <a href={browserApi.runtime.getURL("debugging.html")} target="_blank">
            Debugging
          </a>
        </div>
      </motion.div>
    </Layout>
  );
}
