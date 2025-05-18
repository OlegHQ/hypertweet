import React, { useEffect, useState } from "react";
import { app } from "./app";
import { useGlobalState } from "./state";
import CreateProfileForm from "./create-profile-form";
import type { Profile } from "../background-app/domain";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "./library/card";
import { Button } from "./library/button";
import { Plus, Edit2, Database } from "lucide-react";

export default function ProfileSelector({
  onProfileSelected,
}: {
  onProfileSelected?: () => void;
}) {
  const { profiles, setProfiles, setSelectedProfile, setCurrentRoute } =
    useGlobalState();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>(
    undefined
  );

  useEffect(() => {
    async function loadProfiles() {
      try {
        const profiles = await app.dataLayer.profile.getAll();
        setProfiles(profiles);
      } catch (error) {
        console.error("Failed to load profiles:", error);
      }
    }
    loadProfiles();
  }, [setProfiles]);

  if (showCreateForm || editingProfile) {
    return (
      <CreateProfileForm
        profile={editingProfile}
        onCancel={() => {
          setShowCreateForm(false);
          setEditingProfile(undefined);
        }}
      />
    );
  }

  if (!profiles) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-8 w-8 border-2 border-primary-600 dark:border-primary-400 border-t-transparent"
          />
          <p className="text-gray-600 dark:text-gray-400">
            Loading profiles...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 max-w-4xl mx-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Select a Profile
        </h2>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Profile
        </Button>
      </div>

      <div className="space-y-4 mb-8">
        <AnimatePresence mode="popLayout">
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <button
                        onClick={() => {
                          setSelectedProfile(profile);
                          onProfileSelected?.();
                        }}
                        className="w-full text-left"
                      >
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {profile.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {profile.linkedInUrl}
                        </p>
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingProfile(profile)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {profiles.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-600 dark:text-gray-400">
                No profiles found. Click "Create Profile" to get started.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card
          className="cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
          onClick={() => setCurrentRoute("/data-backup")}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <Database className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Data Backup & Restore
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Create backups of your data including profiles, settings, and
                  reply types. You can also restore your data from a previous
                  backup file.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
