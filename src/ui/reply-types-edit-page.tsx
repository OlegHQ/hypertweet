import { useEffect, useState } from "react";
import { Layout } from "./layout";
import { useGlobalState } from "./state";
import { app } from "./app";
import type { ReplyType } from "../background-app/data/models/reply-type";
import { PageHeader } from "./page-header";
import { Button } from "./library/button";
import { Input } from "./library/input";
import { Textarea } from "./library/textarea";
import { Card, CardContent } from "./library/card";
import { Switch } from "./library/switch";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Save } from "lucide-react";

export default function ReplyTypeEditPage() {
  const { currentRoute, setCurrentRoute, selectedProfile, setReplyTypes } =
    useGlobalState();
  const id = currentRoute.split("/").pop();
  const [replyType, setReplyType] = useState<ReplyType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editedName, setEditedName] = useState("");
  const [editedPrompt, setEditedPrompt] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [isHiddenChanged, setIsHiddenChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReplyType() {
      if (!selectedProfile || !id) return;
      setIsLoading(true);
      try {
        const type = await app.replyTypes.getReplyType(selectedProfile.id, id);
        if (type) {
          setReplyType(type);
          setEditedName(type.name);
          setEditedPrompt(type.prompt);
          setIsHidden(type.isHidden ?? false);
        }
      } catch (error) {
        console.error("Failed to load reply type:", error);
        setError("Failed to load reply type");
      } finally {
        setIsLoading(false);
      }
    }
    loadReplyType();
  }, [id, selectedProfile]);

  const handleSave = async () => {
    if (!selectedProfile || !id || !replyType) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isHiddenChanged) {
        await app.replyTypes.setOneHidden(selectedProfile.id, id, isHidden);
      }
      if (!replyType.isSystem) {
        await app.replyTypes.update(selectedProfile.id, id, {
          name: editedName,
          prompt: editedPrompt,
        });
      }

      // Refresh reply types in global state
      const updatedTypes = await app.replyTypes.getAll(selectedProfile.id);
      setReplyTypes(selectedProfile.id, updatedTypes);

      setCurrentRoute("/reply-types");
    } catch (error) {
      console.error("Failed to update reply type:", error);
      setError("Failed to update reply type");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProfile || !id || !replyType || replyType.isSystem) return;

    try {
      await app.replyTypes.delete(selectedProfile.id, id);
      // Refresh reply types in global state
      const updatedTypes = await app.replyTypes.getAll(selectedProfile.id);
      setReplyTypes(selectedProfile.id, updatedTypes);
      setCurrentRoute("/reply-types");
    } catch (error) {
      console.error("Failed to delete reply type:", error);
      setError("Failed to delete reply type");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center h-64"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary-600"></div>
        </motion.div>
      </Layout>
    );
  }

  if (!replyType) {
    return (
      <Layout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">
            Reply type not found
          </h1>
          <Button
            onClick={() => setCurrentRoute("/reply-types")}
            className="mt-4"
          >
            Go Back
          </Button>
        </motion.div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <PageHeader title="Edit Reply Type" backRoute="/reply-types" />

        <Card className="shadow-xl">
          <CardContent className="p-6 space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <Input
                disabled={replyType.isSystem}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter reply type name"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prompt
              </label>
              <Textarea
                disabled={replyType.isSystem}
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                placeholder="Enter reply type prompt"
                rows={4}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-2"
            >
              <Switch
                id="hide-reply-type"
                checked={isHidden}
                onCheckedChange={(checked) => {
                  setIsHidden(checked);
                  setIsHiddenChanged(true);
                }}
              />
              <label
                htmlFor="hide-reply-type"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Hide this reply type
              </label>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-end gap-3"
            >
              {!replyType.isSystem && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
}
