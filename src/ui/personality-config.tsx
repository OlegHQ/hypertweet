import React, { useEffect } from "react";
import { useGlobalState } from "./state";
import { app } from "./app";
import { TwitterProfile } from "./twitter-profile";
import { LinkedInProfile } from "./linkedin-profile";

export default function PersonalityConfig() {
  const { selectedProfile, setSelectedProfile } = useGlobalState();
  const { setPersonalityConfig, getPersonalityConfig } = useGlobalState();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRefreshTwitter = async () => {
    if (!selectedProfile?.twitterUrl) return;
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshLinkedIn = async () => {
    if (!selectedProfile?.linkedInUrl) return;
    try {
      setIsLoading(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  const [linkedInUrl, setLinkedInUrl] = React.useState(
    selectedProfile?.linkedInUrl || ""
  );
  const [twitterUrl, setTwitterUrl] = React.useState(
    selectedProfile?.twitterUrl || ""
  );

  const handleUrlSave = async (
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

  const loadStoredConfigs = async () => {
    try {
      if (!selectedProfile?.id) {
        return;
      }
      const twitterData = await app.dataLayer.config.get<any>(
        selectedProfile.id,
        "twitterProfile"
      );
      const linkedInData = await app.dataLayer.config.get<any>(
        selectedProfile.id,
        "linkedInProfile"
      );
      setPersonalityConfig(selectedProfile.id, "twitter", twitterData);
      setPersonalityConfig(selectedProfile.id, "linkedIn", linkedInData);
    } catch (error) {
      console.error("Error loading stored configs:", error);
    }
  };

  useEffect(() => {
    if (selectedProfile) {
      loadStoredConfigs();
    }
  }, [selectedProfile]);

  const handleClearProfile = async (platform: "twitter" | "linkedIn") => {
    if (!selectedProfile?.id) {
      return;
    }
    await app.dataLayer.config.delete(
      selectedProfile?.id,
      `${platform}Profile`
    );
    loadStoredConfigs();
  };

  if (!selectedProfile) {
    return null;
  }

  const twitterConfig = getPersonalityConfig(selectedProfile.id, "twitter");
  const linkedInConfig = getPersonalityConfig(selectedProfile.id, "linkedIn");

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Personality Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          This data is used to create a system personality prompt for generating
          content. To successfully load the data, make sure you're logged in to
          the platforms you are using.
        </p>
      </div>

      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {twitterConfig?.isFetched && twitterConfig.data ? (
        <TwitterProfile
          data={twitterConfig.data}
          onRefresh={handleRefreshTwitter}
          profileUrl={selectedProfile.twitterUrl}
          onUrlChange={(newUrl) => handleUrlSave("twitter", newUrl)}
          onClear={() => handleClearProfile("twitter")}
        />
      ) : selectedProfile.twitterUrl ? (
        <div>
          <h2 className="text-lg font-semibold mb-2">Twitter profile</h2>
          <button
            className="bg-blue-500 w-full block text-white px-4 py-2 rounded"
            onClick={handleRefreshTwitter}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load twitter data"}
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-2">Twitter profile</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Twitter profile URL"
              className="flex-1 px-4 py-2 border rounded"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => handleUrlSave("twitter", twitterUrl)}
            >
              Save URL
            </button>
          </div>
        </div>
      )}

      {linkedInConfig?.isFetched && linkedInConfig.data ? (
        <LinkedInProfile
          data={linkedInConfig.data}
          onRefresh={handleRefreshLinkedIn}
          profileUrl={selectedProfile.linkedInUrl}
          onUrlChange={(newUrl) => handleUrlSave("linkedIn", newUrl)}
          onClear={() => handleClearProfile("linkedIn")}
        />
      ) : selectedProfile.linkedInUrl ? (
        <div>
          <h2 className="text-lg font-semibold mb-2">LinkedIn profile</h2>
          <button
            className="bg-blue-500 w-full block text-white px-4 py-2 rounded"
            onClick={handleRefreshLinkedIn}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load linkedin data"}
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-2">LinkedIn profile</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter LinkedIn profile URL"
              className="flex-1 px-4 py-2 border rounded"
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => handleUrlSave("linkedIn", linkedInUrl)}
            >
              Save URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
