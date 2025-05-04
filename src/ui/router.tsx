import React, { useEffect } from "react";
import { app } from "./app";
import { useGlobalState } from "./state";
import HomePage from "./home-page";
import KnowledgeBasePage from "./knowledge-base-page";
import ReplyTypesPage from "./reply-types-page";
import ReplyTypeEditPage from "./reply-types-edit-page";

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

  if (currentRoute === "/") {
    return <HomePage />;
  }

  if (currentRoute === "/knowledge-base") {
    return <KnowledgeBasePage />;
  }

  if (currentRoute === "/reply-types") {
    return <ReplyTypesPage />;
  }

  if (currentRoute.startsWith("/reply-types/edit/")) {
    return <ReplyTypeEditPage />;
  }

  return <HomePage />;
}
