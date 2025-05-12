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
import { Plus, Copy } from "lucide-react";
import ProfileListsManager from "./profile-lists-manager";

type TweetType = "authority" | "growth" | "personality";

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

  const handleAddExample = async () => {
    // if (!selectedProfile) return;
    // try {
    //   const tabs = await app.browserApi.tabs.query({ active: true, currentWindow: true });
    //   if (!tabs[0]) {
    //     setToastMessage("No active tab found");
    //     setToastVariant("error");
    //     setShowCopied(true);
    //     return;
    //   }
    //   const contentApp = app.getContentApp(tabs[0].id!);
    //   const tweet = await contentApp.copyTweets();
    //   if (!tweet?.tweets?.[0]) {
    //     setToastMessage("No tweet found in the current page");
    //     setToastVariant("error");
    //     setShowCopied(true);
    //     return;
    //   }
    //   const newExample: ProfileExample = {
    //     id: Date.now().toString(),
    //     name: selectedProfile.name,
    //     username: selectedProfile.twitterUsername || "",
    //     tweetType: selectedType,
    //     content: tweet.tweets[0].text,
    //   };
    //   setLists(lists.map(list =>
    //     list.id === currentListId
    //       ? { ...list, examples: [...list.examples, newExample] }
    //       : list
    //   ));
    //   setToastMessage("Example added successfully");
    //   setToastVariant("success");
    //   setShowCopied(true);
    // } catch (error) {
    //   console.error("Error adding example:", error);
    //   setToastMessage("Failed to add example");
    //   setToastVariant("error");
    //   setShowCopied(true);
    // }
  };

  const handleGeneratePrompt = () => {
    // if (!selectedProfile) return;
    // const prompt = {
    //   type: selectedType,
    //   examples: currentList.examples.map(example => ({
    //     type: example.tweetType,
    //     content: example.content,
    //     author: {
    //       name: example.name,
    //       username: example.username
    //     }
    //   })),
    //   profile: {
    //     name: selectedProfile.name,
    //     username: selectedProfile.twitterUsername,
    //     personality: selectedProfile.personalityType
    //   }
    // };
    // navigator.clipboard.writeText(JSON.stringify(prompt, null, 2));
    // setToastMessage("Prompt copied to clipboard! Paste it into ChatGPT to generate tweets.");
    // setToastVariant("success");
    // setShowCopied(true);
  };
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
                    <div className="text-sm text-gray-500">
                      {type.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ProfileListsManager
          selectedUsernames={selectedUsernames}
          onItemAdded={(x) =>
            setSelectedUsernames((y) => Array.from(new Set([...y, x])))
          }
        />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Add examples from profiles you want to remix
            </p>
            <Button
              onClick={handleAddExample}
              size="sm"
              className="bg-primary-600 hover:bg-primary-700"
              disabled={!selectedProfile}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Current Profile
            </Button>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <Button
            onClick={handleGeneratePrompt}
            className="bg-primary-600 hover:bg-primary-700"
            // disabled={currentList?.examples.length === 0}
          >
            <Copy className="h-4 w-4 mr-2" />
            Generate Prompt for ChatGPT
          </Button>
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
