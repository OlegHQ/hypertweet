import React, { useEffect, useState } from "react";
import { app } from "./app";
import { useGlobalState } from "./state";
import CreateProfileForm from "./create-profile-form";
import type { Profile } from "../data";

export default function ProfileSelector() {
  const { profiles, setProfiles, setSelectedProfile } = useGlobalState();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>(undefined);

  useEffect(() => {
    async function loadProfiles() {
      try {
        const profiles = await app.dataLayer.profile.getAll();
        console.log("profiles", profiles);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Select a Profile</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Create Profile
        </button>
      </div>

      <div className="space-y-2">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="group relative"
          >
            <button
              onClick={() => setSelectedProfile(profile)}
              className="w-full p-3 text-left rounded border hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium">
                {profile.name}
              </div>
              <div className="text-sm text-gray-600">{profile.linkedInUrl}</div>
            </button>
            <button
              onClick={() => setEditingProfile(profile)}
              className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-gray-700"
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          No profiles found. Click "Create Profile" to get started.
        </div>
      )}
    </div>
  );
}
