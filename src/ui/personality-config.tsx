import React from "react";
import { useGlobalState } from "./state";
import { app } from "./app";
import type { LinkedInProfile } from "../data/models/linkedin-profile";
import type { Tweet } from "../data/models/twitter-profile";

interface ProfileSectionProps {
  title: string;
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  profileUrl?: string;
  onUrlChange: (newUrl: string) => Promise<void>;
}

function ProfileSection({
  title,
  onRefresh,
  children,
  profileUrl,
  onUrlChange,
}: ProfileSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isEditingUrl, setIsEditingUrl] = React.useState(false);
  const [newUrl, setNewUrl] = React.useState(profileUrl || "");
  const [urlError, setUrlError] = React.useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUrlSave = async () => {
    if (!newUrl) {
      setUrlError("URL cannot be empty");
      return;
    }
    try {
      await onUrlChange(newUrl);
      setIsEditingUrl(false);
      setUrlError(null);
    } catch (error) {
      setUrlError("Failed to update URL");
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-800"
          >
            {isExpanded ? "▼" : "▶"}
          </button>
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
      {isExpanded && (
        <>
          {children}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              {isEditingUrl ? (
                <>
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="Enter profile URL"
                    className="flex-1 px-3 py-1 border rounded-md"
                  />
                  <button
                    onClick={handleUrlSave}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingUrl(false);
                      setNewUrl(profileUrl || "");
                      setUrlError(null);
                    }}
                    className="px-3 py-1 border rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="text-sm text-gray-600">Profile URL:</span>
                    {profileUrl ? (
                      <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-500 hover:underline"
                      >
                        {profileUrl}
                      </a>
                    ) : (
                      <span className="ml-2 text-gray-500">Not set</span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditingUrl(true)}
                    className="px-3 py-1 border rounded-md hover:bg-gray-50"
                  >
                    Edit URL
                  </button>
                </>
              )}
            </div>
            {urlError && (
              <div className="mt-2 text-sm text-red-500">{urlError}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function PersonalityConfig() {
  const { selectedProfile, setSelectedProfile } = useGlobalState();
  const { setPersonalityConfig, getPersonalityConfig } = useGlobalState();
  const [error, setError] = React.useState<string | null>(null);

  const handleRefreshTwitter = async () => {
    if (!selectedProfile?.twitterUrl) return;
    try {
      const data = await app.scraping.scrapeTwitterProfile(
        selectedProfile.twitterUrl
      );
      setPersonalityConfig(selectedProfile.id, "twitter", data);
      await app.dataLayer.config.set(
        selectedProfile.id,
        "twitterProfile",
        data
      );
      setError(null);
    } catch (error) {
      console.error("Error refreshing Twitter profile:", error);
      setError("Failed to refresh Twitter profile");
    }
  };

  const handleRefreshLinkedIn = async () => {
    if (!selectedProfile?.linkedInUrl) return;
    try {
      const data = await app.scraping.scrapeLinkedInProfile(
        selectedProfile.linkedInUrl
      );
      setPersonalityConfig(selectedProfile.id, "linkedIn", data);
      await app.dataLayer.config.set(
        selectedProfile.id,
        "linkedInProfile",
        data
      );
      setError(null);
    } catch (error) {
      console.error("Error refreshing LinkedIn profile:", error);
      setError("Failed to refresh LinkedIn profile");
    }
  };

  const handleUrlChange = async (
    platform: "twitter" | "linkedIn",
    newUrl: string
  ) => {
    if (!selectedProfile) return;
    try {
      const updatedProfile = {
        ...selectedProfile,
        [`${platform}Url`]: newUrl,
      };
      await app.dataLayer.profile.update(selectedProfile.id, updatedProfile);
      setSelectedProfile(updatedProfile);
      // Reset the personality config for this platform since the URL changed
      setPersonalityConfig(selectedProfile.id, platform, null);
    } catch (error) {
      console.error(`Error updating ${platform} URL:`, error);
      throw error;
    }
  };

  React.useEffect(() => {
    if (selectedProfile) {
      // Load stored configs if they exist
      const loadStoredConfigs = async () => {
        try {
          const twitterData = await app.dataLayer.config.get<any>(
            selectedProfile.id,
            "twitterProfile"
          );
          if (twitterData) {
            setPersonalityConfig(selectedProfile.id, "twitter", twitterData);
          }
        } catch (error) {
          console.error("Error loading stored configs:", error);
        }
      };
      loadStoredConfigs();
    }
  }, [selectedProfile]);

  if (!selectedProfile) {
    return null;
  }

  const twitterConfig = getPersonalityConfig(selectedProfile.id, "twitter");
  const linkedInConfig = getPersonalityConfig(selectedProfile.id, "linkedIn");

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <ProfileSection
        title="Twitter Profile"
        onRefresh={handleRefreshTwitter}
        profileUrl={selectedProfile.twitterUrl}
        onUrlChange={(newUrl) => handleUrlChange("twitter", newUrl)}
      >
        <div className="space-y-4">
          {twitterConfig?.isFetched ? (
            twitterConfig.data ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <div className="mt-1">{twitterConfig.data.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="mt-1">@{twitterConfig.data.username}</div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <div className="mt-1">{twitterConfig.data.bio}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <div className="mt-1">{twitterConfig.data.location}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <div className="mt-1">
                    {twitterConfig.data.website ? (
                      <a
                        href={twitterConfig.data.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {twitterConfig.data.website}
                      </a>
                    ) : (
                      "Not specified"
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Join Date
                  </label>
                  <div className="mt-1">{twitterConfig.data.joinDate}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Following
                  </label>
                  <div className="mt-1">
                    {twitterConfig.data.following?.toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Followers
                  </label>
                  <div className="mt-1">
                    {twitterConfig.data.followers?.toLocaleString()}
                  </div>
                </div>
                {twitterConfig.data?.recentTweets?.length > 0 && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Recent Tweets
                    </label>
                    <div className="mt-2 space-y-4">
                      {twitterConfig.data?.recentTweets?.map(
                        (tweet: Tweet, index: number) => (
                          <div
                            key={index}
                            className="border rounded-lg p-4 hover:bg-gray-50"
                          >
                            <div className="text-sm text-gray-500 mb-2">
                              {new Date(tweet.time).toLocaleString()}
                            </div>
                            <div className="whitespace-pre-wrap mb-3">
                              {tweet.text}
                            </div>
                            <div className="flex gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                                {tweet.replies}
                              </div>
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                                {tweet.retweets}
                              </div>
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                  />
                                </svg>
                                {tweet.likes}
                              </div>
                              <a
                                href={tweet.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline ml-auto"
                              >
                                View Tweet
                              </a>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">
                No Twitter profile data available. Click Refresh to fetch the
                latest data.
              </div>
            )
          ) : (
            <div className="text-gray-500">Loading Twitter profile data...</div>
          )}
        </div>
      </ProfileSection>

      <ProfileSection
        title="LinkedIn Profile"
        onRefresh={handleRefreshLinkedIn}
        profileUrl={selectedProfile.linkedInUrl}
        onUrlChange={(newUrl) => handleUrlChange("linkedIn", newUrl)}
      >
        <div className="space-y-4">
          {linkedInConfig?.isFetched ? (
            linkedInConfig.data ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <div className="mt-1">{linkedInConfig.data.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <div className="mt-1">{linkedInConfig.data.location}</div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-1 whitespace-pre-wrap">
                    {linkedInConfig.data.description}
                  </div>
                </div>
                {linkedInConfig.data.positions.length > 0 && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Positions
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {linkedInConfig.data.positions.map(
                        (position: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                          >
                            {position}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
                {linkedInConfig.data.companies.length > 0 && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Companies
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {linkedInConfig.data.companies.map(
                        (company: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                          >
                            {company}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">
                No LinkedIn profile data available. Click Refresh to fetch the
                latest data.
              </div>
            )
          ) : (
            <div className="text-gray-500">
              Loading LinkedIn profile data...
            </div>
          )}
        </div>
      </ProfileSection>
    </div>
  );
}
