import React from "react";
import { useGlobalState } from "./state";
import { app } from "./app";
import { TwitterProfile } from "./twitter-profile";
import { LinkedInProfile } from "./linkedin-profile";

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
          const linkedInData = await app.dataLayer.config.get<any>(
            selectedProfile.id,
            "linkedInProfile"
          );
          if (linkedInData) {
            setPersonalityConfig(selectedProfile.id, "linkedIn", linkedInData);
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
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Personality Configuration
        </h2>
        <p className="text-gray-600">
          This data is used to create a system personality prompt for generating
          content. To successfully load the data, make sure you're logged in to
          the platforms you are using.
        </p>
      </div>

      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {twitterConfig?.isFetched && (
        <TwitterProfile
          data={twitterConfig.data}
          onRefresh={handleRefreshTwitter}
          profileUrl={selectedProfile.twitterUrl}
          onUrlChange={(newUrl) => handleUrlChange("twitter", newUrl)}
        />
      )}

      {linkedInConfig?.isFetched && (
        <LinkedInProfile
          data={linkedInConfig.data}
          onRefresh={handleRefreshLinkedIn}
          profileUrl={selectedProfile.linkedInUrl}
          onUrlChange={(newUrl) => handleUrlChange("linkedIn", newUrl)}
        />
      )}
    </div>
  );
}
