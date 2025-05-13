import React from "react";
import { Button } from "./library/button";
import { Input } from "./library/input";
import { Trash2, Save, Plus, Search, ExternalLink } from "lucide-react";
import type { XProfile } from "../background-app/data/models/social-profile";
import { app } from "./app";
import { Toast } from "./library/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./library/alert-dialog";
import { useGlobalState } from "./state";

interface ProfileListsManagerProps {
  selectedUsernames: string[];
  onItemAdded: (username: string) => void;
}

export default function ProfileListsManager({
  selectedUsernames,
  onItemAdded,
}: ProfileListsManagerProps) {
  const { selectedProfile } = useGlobalState();
  const [savedProfiles, setSavedProfiles] = React.useState<XProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [profileToDelete, setProfileToDelete] = React.useState<string | null>(
    null
  );
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");

  React.useEffect(() => {
    loadSavedProfiles();
  }, []);

  React.useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

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
    if (!selectedProfile?.id) {
      return;
    }
    const profile = await app.profiles.saveOne(selectedProfile.id);
    if (!profile) {
      return;
    }

    await loadSavedProfiles();
    setToastMessage(
      `Profile saved with ${profile.recentTweets?.length} tweets`
    );
    setShowToast(true);
  };

  const handleDeleteProfile = async (username: string) => {
    if (!selectedProfile?.id) {
      return;
    }
    try {
      await app.dataLayer.savedProfiles.delete(selectedProfile.id, username);
      await loadSavedProfiles();
    } catch (error) {
      console.error("Failed to delete profile:", error);
    }
  };

  const openProfileInNewTab = (username: string) => {
    window.open(`https://twitter.com/${username}`, "_blank");
  };

  const filteredProfiles = React.useMemo(() => {
    if (!searchQuery.trim()) return savedProfiles;

    const query = searchQuery.toLowerCase();
    return savedProfiles.filter(
      (profile) =>
        profile.username.toLowerCase().includes(query) ||
        profile.name.toLowerCase().includes(query) ||
        (profile.bio?.toLowerCase().includes(query) ?? false)
    );
  }, [savedProfiles, searchQuery]);

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
      {showToast && (
        <Toast
          message={toastMessage}
          variant="success"
          onClose={() => setShowToast(false)}
        />
      )}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Saved Profiles
        </label>
        <div className="flex gap-2">
          <Button
            onClick={handleSaveProfile}
            size="sm"
            className="bg-primary-600 hover:bg-primary-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Current Profile
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search profiles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2">
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchQuery
              ? "No profiles match your search."
              : "No saved profiles yet. Save a profile to see it here."}
          </div>
        ) : (
          filteredProfiles.map((profile) => (
            <div
              key={profile.username}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-medium text-sm cursor-pointer hover:text-primary-600"
                      onClick={() => openProfileInNewTab(profile.username)}
                    >
                      {profile.name}
                    </span>
                    <span
                      className="text-gray-500 text-sm cursor-pointer hover:text-primary-600"
                      onClick={() => openProfileInNewTab(profile.username)}
                    >
                      @{profile.username}
                    </span>
                    <ExternalLink className="h-3 w-3 text-gray-400" />
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
                <div className="flex gap-2">
                  {!selectedUsernames.includes(profile.username) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onItemAdded(profile.username)}
                      className="h-6 w-6"
                    >
                      <Plus className="h-3 w-3 text-primary-500" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setProfileToDelete(profile.username)}
                    className="h-6 w-6"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog
        open={!!profileToDelete}
        onOpenChange={() => setProfileToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this profile? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (profileToDelete) {
                  handleDeleteProfile(profileToDelete);
                  setProfileToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
