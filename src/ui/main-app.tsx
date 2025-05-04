import React from "react";
import { useGlobalState } from "./state";
import ProfileSelector from "./profile-selector";
import { ScrapingContext } from "../scraping/context";
import { app } from "./app";
import ApiConfig from "./api-config";

export default function MainApp() {
  const { selectedProfile, setSelectedProfile } = useGlobalState();
  const [showProfileSelector, setShowProfileSelector] = React.useState(false);
  const [scrapedData, setScrapedData] = React.useState<string | null>(null);

  const handleScrapeProfile = async () => {
    if (!selectedProfile?.twitterUrl) return;
    try {
      const data = await app.scraping.scrapeTwitterProfile(
        selectedProfile.twitterUrl
      );
      setScrapedData(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error scraping profile:", error);
      setScrapedData("Error scraping profile: " + (error as Error).message);
    }
  };

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
            Welcome?, {selectedProfile.name}!
          </h1>
          <p className="text-sm text-gray-600">
            {selectedProfile.twitterUrl ? (
              <a
                href={selectedProfile.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Twitter Profile
              </a>
            ) : null}
            {selectedProfile.linkedInUrl ? (
              <>
                {selectedProfile.twitterUrl ? " • " : ""}
                <a
                  href={selectedProfile.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View LinkedIn Profile
                </a>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedProfile.twitterUrl && (
            <button
              onClick={handleScrapeProfile}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Scrape Profile
            </button>
          )}
          <button
            onClick={() => setShowProfileSelector(true)}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Switch Profile
          </button>
        </div>
      </div>

      <ApiConfig />

      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-lg font-medium mb-4">Your Activity</h2>
        {scrapedData ? (
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {scrapedData}
          </pre>
        ) : (
          <div className="text-gray-500">
            No recent activity. Start by copying some tweets!
          </div>
        )}
      </div>
    </div>
  );
}
