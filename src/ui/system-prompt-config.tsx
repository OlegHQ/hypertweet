import React, { useEffect } from "react";
import { useGlobalState } from "./state";
import { app } from "./app";
import { Card, CardContent, CardHeader } from "./library/card";
import { Button } from "./library/button";
import { Textarea } from "./library/textarea";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Edit2,
  Trash2,
  Save,
  Sparkles,
  AlertTriangle,
  Plus,
  GripVertical,
  MessageSquare,
  List,
  Reply,
} from "lucide-react";
import { ConfigTypeKey } from "src/background-app/domain";
import { Input } from "./library/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./library/select";
import SystemInstructionsEditor from "./system-instructions-editor";

type SocialMediaType = "twitter" | "linkedin" | "reddit";
type PostType = "regular" | "thread" | "reply";

interface ReplyExample {
  id: string;
  socialMediaType: SocialMediaType;
  postType: PostType;
  content: string | string[] | { original: string; reply: string };
}

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
  const [isEditing, setIsEditing] = React.useState(false);
  const [isEditingExamples, setIsEditingExamples] = React.useState(false);

  // New state for example editor
  const [newExample, setNewExample] = React.useState<Partial<ReplyExample>>({
    socialMediaType: "twitter",
    postType: "regular",
    content: "",
  });
  const [threadPosts, setThreadPosts] = React.useState<string[]>([""]);
  const [originalMessage, setOriginalMessage] = React.useState("");
  const [replyMessage, setReplyMessage] = React.useState("");

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

  const handleSave = async () => {
    if (!selectedProfile) return;
    setIsLoading(true);
    setError(null);
    try {
      await app.dataLayer.config.set(
        selectedProfile.id,
        ConfigTypeKey.SYSTEM_PROMPT,
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

  const handleSaveExamples = async () => {
    if (!selectedProfile) return;
    setIsLoading(true);
    setError(null);
    try {
      await app.dataLayer.config.set(
        selectedProfile.id,
        ConfigTypeKey.TWITTER_REPLY_EXAMPLES,
        replyExamples
      );
      setIsEditingExamples(false);
    } catch (error) {
      setError("Failed to save reply examples");
      console.error("Error saving reply examples:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExamples = async () => {
    if (!selectedProfile) return;
    setIsLoading(true);
    setError(null);
    try {
      await app.dataLayer.config.set(
        selectedProfile.id,
        ConfigTypeKey.TWITTER_REPLY_EXAMPLES,
        null
      );
      setReplyExamples([]);
      setIsEditingExamples(false);
    } catch (error) {
      setError("Failed to delete reply examples");
      console.error("Error deleting reply examples:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProfile) return;
    setIsLoading(true);
    setError(null);
    try {
      await app.dataLayer.config.set(
        selectedProfile.id,
        ConfigTypeKey.SYSTEM_PROMPT,
        null
      );
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
        ConfigTypeKey.TWITTER_PROFILE
      );
      const linkedInConfig = await app.dataLayer.config.get<any>(
        selectedProfile.id,
        ConfigTypeKey.LINKEDIN_PROFILE
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

  const handleAddExample = () => {
    if (!newExample.socialMediaType || !newExample.postType) return;

    let content: string | string[] | { original: string; reply: string };
    switch (newExample.postType) {
      case "thread":
        content = threadPosts.filter((post) => post.trim() !== "");
        break;
      case "reply":
        content = { original: originalMessage, reply: replyMessage };
        break;
      default:
        content = newExample.content as string;
    }

    if (
      (typeof content === "string" && !content.trim()) ||
      (Array.isArray(content) && content.length === 0) ||
      (typeof content === "object" &&
        !Array.isArray(content) &&
        (!content.original.trim() || !content.reply.trim()))
    ) {
      return;
    }

    const example: ReplyExample = {
      id: crypto.randomUUID(),
      socialMediaType: newExample.socialMediaType as SocialMediaType,
      postType: newExample.postType as PostType,
      content,
    };

    setReplyExamples([...replyExamples, example]);
    setNewExample({
      socialMediaType: "twitter",
      postType: "regular",
      content: "",
    });
    setThreadPosts([""]);
    setOriginalMessage("");
    setReplyMessage("");
  };

  const handleRemoveExample = (id: string) => {
    setReplyExamples(replyExamples.filter((example) => example.id !== id));
  };

  const isReplyContent = (
    content: string | string[] | { original: string; reply: string }
  ): content is { original: string; reply: string } => {
    return (
      typeof content === "object" &&
      !Array.isArray(content) &&
      "original" in content &&
      "reply" in content
    );
  };

  const renderExampleContent = (example: ReplyExample) => {
    switch (example.postType) {
      case "thread":
        return (
          <div className="space-y-2">
            {(example.content as string[]).map((post, index) => (
              <div
                key={index}
                className="pl-4 border-l-2 border-gray-200 dark:border-gray-700"
              >
                {post}
              </div>
            ))}
          </div>
        );
      case "reply": {
        const content = example.content;
        if (!isReplyContent(content)) {
          return null;
        }
        const { original, reply } = content;
        return (
          <div className="space-y-2">
            <div className="text-gray-500 dark:text-gray-400 italic">
              Original: {original}
            </div>
            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              {reply}
            </div>
          </div>
        );
      }
      default:
        return <div>{example.content as string}</div>;
    }
  };

  const renderExamplesEditor = () => (
    <Card className="shadow-xl">
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Social Media Reply Examples
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Add example posts and replies to help the AI understand your writing
          style.
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {isEditingExamples ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="space-y-4 p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Social Media Type
                    </label>
                    <Select
                      value={newExample.socialMediaType}
                      onValueChange={(value: SocialMediaType) =>
                        setNewExample({ ...newExample, socialMediaType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="reddit">Reddit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Post Type
                    </label>
                    <Select
                      value={newExample.postType}
                      onValueChange={(value: PostType) => {
                        setNewExample({ ...newExample, postType: value });
                        if (value === "thread") {
                          setThreadPosts([""]);
                        } else if (value === "reply") {
                          setOriginalMessage("");
                          setReplyMessage("");
                        } else {
                          setNewExample((prev) => ({ ...prev, content: "" }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular Post</SelectItem>
                        <SelectItem value="thread">Thread</SelectItem>
                        <SelectItem value="reply">Reply</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newExample.postType === "regular" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Post Content
                    </label>
                    <Textarea
                      value={newExample.content as string}
                      onChange={(e) =>
                        setNewExample({
                          ...newExample,
                          content: e.target.value,
                        })
                      }
                      placeholder="Enter your post content..."
                      className="min-h-[8rem]"
                    />
                  </div>
                )}

                {newExample.postType === "thread" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Thread Posts
                    </label>
                    {threadPosts.map((post, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={post}
                          onChange={(e) => {
                            const newPosts = [...threadPosts];
                            newPosts[index] = e.target.value;
                            setThreadPosts(newPosts);
                          }}
                          placeholder={`Post ${index + 1}...`}
                          className="min-h-[4rem]"
                        />
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setThreadPosts(
                                threadPosts.filter((_, i) => i !== index)
                              );
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => setThreadPosts([...threadPosts, ""])}
                      className="w-full"
                    >
                      Add Post
                    </Button>
                  </div>
                )}

                {newExample.postType === "reply" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Original Message
                      </label>
                      <Textarea
                        value={originalMessage}
                        onChange={(e) => setOriginalMessage(e.target.value)}
                        placeholder="Enter the original message..."
                        className="min-h-[4rem]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Your Reply
                      </label>
                      <Textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Enter your reply..."
                        className="min-h-[4rem]"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAddExample}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Example
                </Button>
              </div>

              <div className="space-y-2">
                {replyExamples.map((example) => (
                  <div
                    key={example.id}
                    className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {example.socialMediaType.charAt(0).toUpperCase() +
                            example.socialMediaType.slice(1)}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {example.postType.charAt(0).toUpperCase() +
                            example.postType.slice(1)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveExample(example.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {renderExampleContent(example)}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveExamples}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingExamples(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 min-h-[8rem]">
                {replyExamples.length > 0 ? (
                  <div className="space-y-4">
                    {replyExamples.map((example) => (
                      <div
                        key={example.id}
                        className="p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {example.socialMediaType.charAt(0).toUpperCase() +
                              example.socialMediaType.slice(1)}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {example.postType.charAt(0).toUpperCase() +
                              example.postType.slice(1)}
                          </span>
                        </div>
                        {renderExampleContent(example)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400">
                    No examples set
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditingExamples(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
                {replyExamples.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteExamples}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!selectedProfile) return null;

  const hasOpenAIKey = selectedProfile
    ? hasProfileKey(selectedProfile.id, ConfigTypeKey.OPENAI_API_KEY)
    : false;

  const renderEditor = (
    value: string,
    setValue: (value: string) => void,
    isEditing: boolean,
    setIsEditing: (value: boolean) => void,
    onSave: () => Promise<void>,
    onDelete: () => Promise<void>,
    title: string,
    description: string,
    placeholder: string
  ) => (
    <Card className="shadow-xl">
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="min-h-[8rem]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={onSave}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 min-h-[8rem]">
                {value ? (
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {value}
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400">
                    No content set
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
                {value && (
                  <Button
                    variant="destructive"
                    onClick={onDelete}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );

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

      {!hasOpenAIKey && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>
            OpenAI API key is not set.{" "}
            <button
              onClick={() => setCurrentRoute("/misc")}
              className="underline hover:text-amber-800 dark:hover:text-amber-300"
            >
              Set up your API key
            </button>{" "}
            to enable prompt generation.
          </span>
        </motion.div>
      )}

      {renderEditor(
        systemPrompt,
        setSystemPrompt,
        isEditing,
        setIsEditing,
        handleSave,
        handleDelete,
        "System Prompt",
        "Personalize your replies and tweets. Keep it concise to minimize costs.",
        "Enter your system prompt here..."
      )}

      {selectedProfile && (
        <SystemInstructionsEditor
          selectedProfile={selectedProfile}
          instructions={instructions}
          setInstructions={setInstructions}
          isLoading={isLoading}
          setError={setError}
        />
      )}

      {renderExamplesEditor()}
    </motion.div>
  );
}
