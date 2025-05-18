import React, { useState } from "react";
import { Layout } from "./layout";
import { PageHeader } from "./page-header";
import { motion } from "framer-motion";
import { Button } from "./library/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./library/select";
import { Toast } from "./library/toast";
import { useGlobalState } from "./state";
import { Plus, Copy, X } from "lucide-react";
import ProfileListsManager from "./profile-lists-manager";
import VisitedTwitterProfiles from "./visited-twitter-profiles";
import { app } from "./app";

type TweetType = "authority" | "growth" | "personality";
type ViewMode = "lists" | "visited";

const TWEET_TYPES: { value: TweetType; label: string; description: string }[] =
  [
    {
      value: "authority",
      label: "Authority Tweets",
      description: "Shows your expertise and establishes credibility and trust",
    },
    {
      value: "growth",
      label: "Growth Tweets",
      description: "Provides value through simple self-improvement content",
    },
    {
      value: "personality",
      label: "Personality Tweets",
      description:
        "Shows your personality to demonstrate authenticity and connect with people",
    },
  ];

export default function PostDesignStudio() {
  const { selectedProfile } = useGlobalState();
  const [selectedType, setSelectedType] = useState<TweetType>("authority");
  const [currentListId, setCurrentListId] = useState<string>("default");
  const [showCopied, setShowCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">(
    "success"
  );
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("lists");

  const handleGeneratePrompt = async () => {
    if (selectedProfile?.id) {
      try {
        const json = await app.content.getPromptGenerateJSON(
          selectedProfile?.id,
          selectedUsernames
        );
        
        // Copy to clipboard
        await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
        
        // Show success toast
        setToastMessage("Prompt JSON copied to clipboard!");
        setToastVariant("success");
        setShowCopied(true);
      } catch (error) {
        // Show error toast
        setToastMessage("Failed to generate prompt");
        setToastVariant("error");
        setShowCopied(true);
      }
    }
  };

  const handleRemoveUsername = (username: string) => {
    setSelectedUsernames((prev) => prev.filter((u) => u !== username));
  };

  const selectedTypeInfo = TWEET_TYPES.find(
    (type) => type.value === selectedType
  );

  return (
    <Layout>
      <PageHeader title="Post Design Studio" backRoute="/" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 max-w-4xl mx-auto space-y-4"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tweet Type
          </label>
          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as TweetType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select tweet type" />
            </SelectTrigger>
            <SelectContent>
              {TWEET_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTypeInfo && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {selectedTypeInfo.description}
            </p>
          )}
        </div>

        {selectedUsernames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedUsernames.map((username) => (
              <div
                key={username}
                className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm"
              >
                <span>{username}</span>
                <button
                  onClick={() => handleRemoveUsername(username)}
                  className="hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center pt-2">
          <Button
            onClick={handleGeneratePrompt}
            size="lg"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            disabled={selectedUsernames.length === 0}
          >
            <Copy className="h-5 w-5 mr-2" />
            Generate Prompt for ChatGPT
          </Button>
        </div>

        <div className="mt-8">
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                viewMode === "lists"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
              onClick={() => setViewMode("lists")}
            >
              Profile Lists
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                viewMode === "visited"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
              onClick={() => setViewMode("visited")}
            >
              Visited Profiles
            </button>
          </div>

          {viewMode === "lists" ? (
            <ProfileListsManager
              selectedUsernames={selectedUsernames}
              onItemAdded={(x) =>
                setSelectedUsernames((y) => Array.from(new Set([...y, x])))
              }
            />
          ) : (
            <VisitedTwitterProfiles
              onItemAdded={(x) =>
                setSelectedUsernames((y) => Array.from(new Set([...y, x])))
              }
            />
          )}
        </div>

        {showCopied && (
          <Toast
            message={toastMessage}
            variant={toastVariant}
            onClose={() => setShowCopied(false)}
          />
        )}
      </motion.div>
    </Layout>
  );
}
