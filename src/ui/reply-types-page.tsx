import { useEffect, useState } from "react";
import { Layout } from "./layout";
import { useGlobalState } from "./state";
import { app } from "./app";
import { PageHeader } from "./page-header";

export default function ReplyTypesPage() {
  const {
    setCurrentRoute,
    selectedProfile,
    replyTypes,
    setReplyTypes,
    getReplyTypes,
  } = useGlobalState();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newReplyType, setNewReplyType] = useState({
    name: "",
    prompt: "",
  });

  useEffect(() => {
    async function fetchReplyTypes() {
      if (!selectedProfile) return;
      const currentReplyTypes = getReplyTypes(selectedProfile.id);
      if (currentReplyTypes === undefined) {
        const types = await app.replyTypes.getAll(selectedProfile.id);
        setReplyTypes(selectedProfile.id, types);
      }
    }
    fetchReplyTypes();
  }, [selectedProfile, getReplyTypes, setReplyTypes]);

  const handleAddReplyType = async () => {
    if (!selectedProfile || !newReplyType.name || !newReplyType.prompt) return;

    try {
      const id = await app.replyTypes.add({
        ...newReplyType,
        profileId: selectedProfile.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSystem: false,
      });

      const currentTypes = getReplyTypes(selectedProfile.id) ?? [];
      setReplyTypes(selectedProfile.id, [
        ...currentTypes,
        {
          id,
          ...newReplyType,
          profileId: selectedProfile.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          isSystem: false,
        },
      ]);

      setNewReplyType({ name: "", prompt: "" });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Failed to add reply type:", error);
    }
  };

  const currentReplyTypes = selectedProfile
    ? getReplyTypes(selectedProfile.id)
    : undefined;
  const systemReplyTypes =
    currentReplyTypes?.filter((type) => type.isSystem) ?? [];
  const userReplyTypes =
    currentReplyTypes?.filter((type) => !type.isSystem) ?? [];

  return (
    <Layout>
      <PageHeader title="Reply Types" backRoute="/" />

      <div className="space-y-8">
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-medium">Your Reply Types</h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Reply Type
            </button>
          </div>
          {userReplyTypes.length === 0 ? (
            <div className="text-gray-500 italic">
              No custom reply types created yet
            </div>
          ) : (
            <div className="grid gap-4">
              {userReplyTypes.map((type) => (
                <div
                  key={type.id}
                  className="p-4 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setCurrentRoute(`/reply-types/edit/${type.id}`)
                  }
                >
                  <h3 className="font-medium">{type.name}</h3>
                  <p className="text-gray-600 mt-1">{type.prompt}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4">System Reply Types</h2>
          {systemReplyTypes.length === 0 ? (
            <div className="text-gray-500 italic">
              No system reply types available
            </div>
          ) : (
            <div className="grid gap-4">
              {systemReplyTypes.map((type) => (
                <div
                  key={type.id}
                  className="p-4 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setCurrentRoute(`/reply-types/edit/${type.id}`)
                  }
                >
                  <h3 className="font-medium">{type.name}</h3>
                  <p className="text-gray-600 mt-1">{type.prompt}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-medium mb-4">Add New Reply Type</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newReplyType.name}
                  onChange={(e) =>
                    setNewReplyType({ ...newReplyType, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reply type name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt
                </label>
                <textarea
                  value={newReplyType.prompt}
                  onChange={(e) =>
                    setNewReplyType({ ...newReplyType, prompt: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reply type prompt"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReplyType}
                disabled={!newReplyType.name || !newReplyType.prompt}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
