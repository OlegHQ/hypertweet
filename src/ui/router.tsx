import React, { useEffect } from "react";
import { app } from "./app";
import { useGlobalState } from "./state";
import MainApp from "./main-app";

export default function Router() {
  const {
    selectedProfile,
    setSelectedProfile,
    lastUsedProfileId,
    setLastUsedProfileId,
  } = useGlobalState();

  useEffect(() => {
    async function loadLastUsedProfile() {
      try {
        const lastId = await app.dataLayer.config.get<string>(
          null,
          "lastUsedProfileId"
        );
        if (lastId) {
          setLastUsedProfileId(lastId);
          const profile = await app.dataLayer.profile.get(lastId);
          if (profile) {
            setSelectedProfile(profile);
          }
        }
      } catch (error) {
        console.error("Failed to load last used profile:", error);
      }
    }
    loadLastUsedProfile();
  }, [setSelectedProfile, setLastUsedProfileId]);

  useEffect(() => {
    if (lastUsedProfileId && typeof lastUsedProfileId === "string") {
      app.dataLayer.config.set(null, "lastUsedProfileId", lastUsedProfileId);
    }
  }, [lastUsedProfileId]);

  return <MainApp />;
}
