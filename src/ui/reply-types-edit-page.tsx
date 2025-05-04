import { useEffect, useState } from "react";
import { Layout } from "./layout";
import { useGlobalState } from "./state";
import { app } from "./app";
import type { ReplyType } from "../background-app/data/models/reply-type";
import { PageHeader } from "./page-header";

export default function ReplyTypeEditPage() {
  const { currentRoute, setCurrentRoute, selectedProfile, setReplyTypes } = useGlobalState();
  const id = currentRoute.split("/").pop();
  const [replyType, setReplyType] = useState<ReplyType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editedName, setEditedName] = useState("");
  const [editedPrompt, setEditedPrompt] = useState("");
  const [isHidden, setIsHidden] = useState(false);

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

    try {
      if (replyType.isSystem) {
        await app.replyTypes.setSystemOneHidden(
          selectedProfile.id,
          id,
          isHidden
        );
      } else {
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
    }
  };

  const handleDelete = async () => {
    if (!selectedProfile || !id || !replyType || replyType.isSystem) return;

    try {
      await app.replyTypes.delete(selectedProfile.id, id);
      setCurrentRoute("/reply-types");
    } catch (error) {
      console.error("Failed to delete reply type:", error);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  if (!replyType) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-xl font-medium">Reply type not found</h1>
          <button
            onClick={() => setCurrentRoute("/reply-types")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Edit Reply Type" backRoute="/reply-types" />

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                disabled={replyType.isSystem}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt
              </label>
              <textarea
                disabled={replyType.isSystem}
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                rows={4}
              />
            </div>
          </>

          {replyType.isSystem && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hide-system"
                checked={isHidden}
                onChange={(e) => setIsHidden(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="hide-system"
                className="ml-2 block text-sm text-gray-700"
              >
                Hide this system reply type
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              disabled={replyType.isSystem}
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              Delete
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
