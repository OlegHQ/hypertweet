import React from "react";
import { Input } from "./library/input";
import { Plus, Search, ExternalLink } from "lucide-react";
import type { XProfile } from "../background-app/domain/models/social-profile";
import { app } from "./app";
import { useGlobalState } from "./state";
import { ConfigTypeKey } from "../background-app/domain/models/config-type-key";
import { Button } from "./library/button";

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

  React.useEffect(() => {
    loadFavProfiles();
  }, []);

  const loadFavProfiles = async () => {
    try {
      if (selectedProfile?.id) {
        const favUsernames = await app.dataLayer.config.get<string[]>(
          null,
          ConfigTypeKey.FAV_VISITED_PROFILES
        );

        if (favUsernames?.length) {
          const profiles =
            await app.dataLayer.twitterProfile.getByUsernames(favUsernames);
          setSavedProfiles(profiles);
        }
      }
    } catch (error) {
      console.error("Failed to load favorite profiles:", error);
    } finally {
      setIsLoading(false);
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
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Favorite Profiles
        </label>
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
              : "No favorite profiles yet. Add profiles to favorites from the Visited Profiles tab."}
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
                {!selectedUsernames.includes(profile.username) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onItemAdded(profile.username)}
                    className="h-6 w-6"
                    title="Add to selected profiles"
                  >
                    <Plus className="h-3 w-3 text-primary-500" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
