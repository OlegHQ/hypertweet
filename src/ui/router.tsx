import React, { useEffect } from "react";
import { app } from "./app";
import { useGlobalState } from "./state";
import HomePage from "./home-page";
import KnowledgeBasePage from "./knowledge-base-page";
import ReplyTypesPage from "./reply-types-page";

export default function Router() {
  const {
    selectedProfile,
    setSelectedProfile,
    lastUsedProfileId,
    setLastUsedProfileId,
    currentRoute,
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

  switch (currentRoute) {
    case "/":
      return <HomePage />;
    case "/knowledge-base":
      return <KnowledgeBasePage />;
    case "/reply-types":
      return <ReplyTypesPage />;
    default:
      return <HomePage />;
  }
}
