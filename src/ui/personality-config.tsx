import React from "react";
import { useGlobalState } from "./state";
import { app } from "./app";
import type { LinkedInProfile } from "../data/models/linkedin-profile";
import { TwitterProfile } from "./twitter-profile";
import { ProfileSection } from "./profile-section";

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
