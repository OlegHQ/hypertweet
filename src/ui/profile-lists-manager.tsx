import React from "react";
import { Button } from "./library/button";
import { Trash2, Save } from "lucide-react";
import type { XProfile } from "../background-app/data/models/social-profile";
import { app } from "./app";

interface ProfileListsManagerProps {}

export default function ProfileListsManager({}: ProfileListsManagerProps) {
  const [savedProfiles, setSavedProfiles] = React.useState<XProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadSavedProfiles();
  }, []);

  const loadSavedProfiles = async () => {
    try {
      const profiles = await app.dataLayer.savedProfiles.getAll();
      setSavedProfiles(profiles);
    } catch (error) {
      console.error("Failed to load saved profiles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    const profile = await app.profiles.saveOne(30);
    if (!profile) {
      return;
    }
    console.log("Profile saved:", profile);
    await loadSavedProfiles();
  };

  const handleDeleteProfile = async (username: string) => {
    try {
      await app.dataLayer.savedProfiles.delete(username);
      await loadSavedProfiles();
    } catch (error) {
      console.error("Failed to delete profile:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center h-32 space-y-4">
          <div className="rounded-full h-8 w-8 border-2 border-primary-600 dark:border-primary-400 border-t-transparent animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading profiles...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Saved Profiles
        </label>
        <Button
          onClick={handleSaveProfile}
          size="sm"
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Current Profile
        </Button>
      </div>

      <div className="space-y-2">
        {savedProfiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No saved profiles yet. Save a profile to see it here.
          </div>
        ) : (
          savedProfiles.map((profile) => (
            <div
              key={profile.username}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{profile.name}</span>
                    <span className="text-gray-500 text-sm">
                      @{profile.username}
                    </span>
                  </div>
                  {profile.bio && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {profile.bio}
                    </p>
                  )}
                  {profile.location && (
                    <span className="text-gray-500 text-sm">
                      {profile.location}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteProfile(profile.username)}
                  className="h-6 w-6"
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
