import React, { useState } from "react";
import { Layout } from "./layout";
import { PageHeader } from "./page-header";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "./library/card";
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
import { app } from "./app";
import { Plus, Copy, Trash2, ListPlus, FolderOpen } from "lucide-react";
import { Input } from "./library/input";

type TweetType = "authority" | "growth" | "personality";

interface ProfileExample {
  id: string;
  name: string;
  username: string;
  tweetType: TweetType;
  content: string;
}

interface ProfileList {
  id: string;
  name: string;
  examples: ProfileExample[];
}

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
  const [lists, setLists] = useState<ProfileList[]>([
    { id: "default", name: "Default List", examples: [] },
  ]);
  const [currentListId, setCurrentListId] = useState<string>("default");
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showCopied, setShowCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">(
    "success"
  );

  const currentList =
    lists.find((list) => list.id === currentListId) || lists[0];

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

  const handleRemoveExample = (id: string) => {
    setLists(
      lists.map((list) =>
        list.id === currentListId
          ? {
              ...list,
              examples: list.examples.filter((example) => example.id !== id),
            }
          : list
      )
    );
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;

    const newList: ProfileList = {
      id: Date.now().toString(),
      name: newListName.trim(),
      examples: [],
    };

    setLists([...lists, newList]);
    setCurrentListId(newList.id);
    setNewListName("");
    setShowNewListInput(false);
  };

  const handleDeleteList = (listId: string) => {
    if (listId === "default") return; // Don't allow deleting default list
    setLists(lists.filter((list) => list.id !== listId));
    if (currentListId === listId) {
      setCurrentListId("default");
    }
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
        className="p-4 max-w-4xl mx-auto space-y-6"
      >
        <Card className="rounded-2xl shadow-xl">
          <CardHeader className="font-semibold text-xl">Tweet Type</CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-xl">
          <CardHeader className="font-semibold text-xl">
            Profile Lists
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={currentListId} onValueChange={setCurrentListId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select list" />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{list.name}</span>
                        {list.id !== "default" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteList(list.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => setShowNewListInput(true)}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <ListPlus className="h-4 w-4 mr-2" />
                New List
              </Button>
            </div>

            {showNewListInput && (
              <div className="flex gap-2">
                <Input
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter list name"
                  className="flex-1"
                />
                <Button
                  onClick={handleCreateList}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  Create
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowNewListInput(false);
                    setNewListName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <p className="text-gray-600 dark:text-gray-300">
                Add examples from profiles you want to remix
              </p>
              <Button
                onClick={handleAddExample}
                className="bg-primary-600 hover:bg-primary-700"
                disabled={!selectedProfile}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Current Profile
              </Button>
            </div>

            <div className="space-y-4">
              {currentList?.examples.map((example) => (
                <Card key={example.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{example.name}</span>
                        <span className="text-gray-500">
                          @{example.username}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">
                        {example.content}
                      </p>
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700">
                        {
                          TWEET_TYPES.find((t) => t.value === example.tweetType)
                            ?.label
                        }
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveExample(example.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            onClick={handleGeneratePrompt}
            className="bg-primary-600 hover:bg-primary-700"
            disabled={currentList?.examples.length === 0}
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
