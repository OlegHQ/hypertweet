import React from "react";
import { useGlobalState } from "./state";
import ProfileSelector from "./profile-selector";
import { ScrapingContext } from "../scraping/context";
import { app } from "./app";
import ApiConfig from "./api-config";
import PersonalityConfig from "./personality-config";

export default function MainApp() {
  const { selectedProfile } = useGlobalState();
  const [showProfileSelector, setShowProfileSelector] = React.useState(false);

  if (!selectedProfile) {
    return <ProfileSelector />;
  }

  if (showProfileSelector) {
    return (
      <div className="p-4">
        <button
          onClick={() => setShowProfileSelector(false)}
          className="mb-4 text-blue-500 hover:text-blue-600"
        >
          ← Back
        </button>
        <ProfileSelector />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold">
            Welcome, {selectedProfile.name}!
          </h1>
          <p className="text-sm text-gray-600">
            {selectedProfile.twitterUrl ? (
              <a
                href={selectedProfile.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View X Profile
              </a>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowProfileSelector(true)}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Switch Profile
          </button>
        </div>
      </div>

      <ApiConfig />
      <PersonalityConfig />
    </div>
  );
}
