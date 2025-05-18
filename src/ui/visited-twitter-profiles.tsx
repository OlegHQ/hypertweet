import { useEffect, useState } from "react";
import type {
  Tweet,
  XProfile,
} from "src/background-app/domain/models/social-profile";
import { app } from "./app";
import { ConfigTypeKey } from "src/background-app/domain/models/config-type-key";
import { Button } from "./library/button";
import { Star, ArrowLeft } from "lucide-react";

interface VisitedTwitterProfilesProps {
  onItemAdded: (username: string) => void;
}

export default function VisitedTwitterProfiles({
  onItemAdded,
}: VisitedTwitterProfilesProps) {
  const [visitedProfiles, setVisitedProfiles] = useState<XProfile[]>([]);
  const [favVisitedProfiles, setFavVisitedProfiles] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<XProfile | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isLoadingTweets, setIsLoadingTweets] = useState(false);

  useEffect(() => {
    const loadVisitedProfiles = async () => {
      const visitedProfiles = await app.dataLayer.twitterProfile.getAll();
      setVisitedProfiles(visitedProfiles);

      const favVisitedProfiles = await app.dataLayer.config.get(
        null,
        ConfigTypeKey.FAV_VISITED_PROFILES
      );
      setFavVisitedProfiles((favVisitedProfiles as string[]) ?? []);
    };
    loadVisitedProfiles();
  }, []);

  const toggleFavorite = async (profile: XProfile) => {
    const newFavVisitedProfiles = [...favVisitedProfiles];
    if (favVisitedProfiles.includes(profile.username)) {
      newFavVisitedProfiles.splice(
        favVisitedProfiles.indexOf(profile.username),
        1
      );
    } else {
      newFavVisitedProfiles.push(profile.username);
    }
    await app.dataLayer.config.set(
      null,
      ConfigTypeKey.FAV_VISITED_PROFILES,
      newFavVisitedProfiles
    );
    setFavVisitedProfiles(Array.from(new Set(newFavVisitedProfiles)));

    setVisitedProfiles((prev) =>
      prev.map((p) =>
        p.username === profile.username
          ? { ...p, isFavorite: newFavVisitedProfiles.includes(p.username) }
          : p
      )
    );
  };

  const handleProfileClick = async (profile: XProfile) => {
    setSelectedProfile(profile);
    setIsLoadingTweets(true);
    try {
      // TODO: Replace with actual tweet fetching logic
      const fetchedTweets = await app.dataLayer.tweet.getByUsername(
        profile.username
      );
      setTweets(fetchedTweets);
    } catch (error) {
      console.error("Failed to fetch tweets:", error);
      setTweets([]);
    } finally {
      setIsLoadingTweets(false);
    }
  };

  const handleBack = () => {
    setSelectedProfile(null);
    setTweets([]);
  };

  if (selectedProfile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
            title="Back to profiles"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="font-medium">{selectedProfile.name}</div>
            <div className="text-sm text-gray-500">
              @{selectedProfile.username}
            </div>
          </div>
        </div>

        {isLoadingTweets ? (
          <div className="flex justify-center p-4">
            <div className="rounded-full h-8 w-8 border-2 border-primary-600 dark:border-primary-400 border-t-transparent animate-spin" />
          </div>
        ) : tweets.length === 0 ? (
          <div className="text-center p-4 text-gray-500">No tweets found</div>
        ) : (
          <div className="space-y-2">
            {tweets.map((tweet) => (
              <div
                key={tweet.id}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <p className="text-sm">
                  {tweet.text.split("\n").map((line, index) => (
                    <span key={index}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(tweet.time).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visitedProfiles.map((profile) => (
        <div
          key={profile.username}
          className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <div
            className="flex-1 cursor-pointer min-w-0"
            onClick={() => handleProfileClick(profile)}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{profile.name}</span>
              <span className="text-gray-500 truncate">
                @{profile.username}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {profile.followers ? `${profile.followers} followers` : "-"}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleFavorite(profile)}
            className={`h-8 w-8 ${
              favVisitedProfiles.includes(profile.username)
                ? "text-yellow-500 hover:text-yellow-600"
                : "text-gray-400 hover:text-yellow-500"
            }`}
            title={
              favVisitedProfiles.includes(profile.username)
                ? "Remove from favorites"
                : "Add to favorites"
            }
          >
            <Star
              className="h-4 w-4"
              fill={
                favVisitedProfiles.includes(profile.username)
                  ? "currentColor"
                  : "none"
              }
            />
          </Button>
        </div>
      ))}
    </div>
  );
}
