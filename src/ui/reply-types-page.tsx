import { useEffect, useState } from "react";
import { Layout } from "./layout";
import { useGlobalState } from "./state";
import { app } from "./app";
import { PageHeader } from "./page-header";
import { Button } from "./library/button";
import { Input } from "./library/input";
import { Textarea } from "./library/textarea";
import { Card, CardContent } from "./library/card";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Your Reply Types
            </h2>
            <Button onClick={() => setIsAddModalOpen(true)} className="ml-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Reply Type
            </Button>
          </div>
          {userReplyTypes.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 italic">
              No custom reply types created yet
            </div>
          ) : (
            <motion.div layout className="grid gap-4">
              {userReplyTypes.map((type) => (
                <motion.div
                  key={type.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Card
                    className="cursor-pointer transition-all hover:border-primary dark:hover:border-primary-600"
                    onClick={() =>
                      setCurrentRoute(`/reply-types/edit/${type.id}`)
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {type.name}
                        </h3>
                        {type.isHidden && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {type.prompt}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
            System Reply Types
          </h2>
          {systemReplyTypes.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 italic">
              No system reply types available
            </div>
          ) : (
            <motion.div layout className="grid gap-4">
              {systemReplyTypes.map((type) => (
                <motion.div
                  key={type.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Card
                    className="cursor-pointer transition-all hover:border-primary dark:hover:border-primary-600"
                    onClick={() =>
                      setCurrentRoute(`/reply-types/edit/${type.id}`)
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {type.name}
                        </h3>
                        {type.isHidden && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {type.prompt}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </motion.div>

      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl"
            >
              <h2 className="text-xl font-medium mb-4 text-gray-900 dark:text-gray-100">
                Add New Reply Type
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <Input
                    type="text"
                    value={newReplyType.name}
                    onChange={(e) =>
                      setNewReplyType({ ...newReplyType, name: e.target.value })
                    }
                    placeholder="Enter reply type name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prompt
                  </label>
                  <Textarea
                    value={newReplyType.prompt}
                    onChange={(e) =>
                      setNewReplyType({
                        ...newReplyType,
                        prompt: e.target.value,
                      })
                    }
                    placeholder="Enter reply type prompt"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddReplyType}
                  disabled={!newReplyType.name || !newReplyType.prompt}
                >
                  Add
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
