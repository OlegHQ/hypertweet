import { useEffect, useState } from "react";
import type { XProfile } from "src/background-app/domain/models/social-profile";
import { app } from "./app";
import { ConfigTypeKey } from "src/background-app/domain/models/config-type-key";

interface VisitedTwitterProfilesProps {
  onItemAdded: (username: string) => void;
}

export default function VisitedTwitterProfiles({
  onItemAdded,
}: VisitedTwitterProfilesProps) {
  const [visitedProfiles, setVisitedProfiles] = useState<XProfile[]>([]);
  const [favVisitedProfiles, setFavVisitedProfiles] = useState<string[]>([]);

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

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Visited Profiles</h2>
      <div className="space-y-2">
        {visitedProfiles.map((profile) => (
          <div
            key={profile.username}
            className="flex items-center justify-between p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div
              className="flex-1 cursor-pointer"
              onClick={() => onItemAdded(profile.username)}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{profile.name}</span>
                <span className="text-gray-500">@{profile.username}</span>
              </div>
              <div className="text-sm text-gray-600">
                {profile.followers ? `${profile.followers} followers` : "-"}
              </div>
            </div>
            <button
              onClick={() => toggleFavorite(profile)}
              className={`p-2 rounded-full transition-colors ${
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
