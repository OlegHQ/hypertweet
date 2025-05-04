import React from "react";

interface ProfileSectionProps {
  title: string;
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  profileUrl?: string;
  onUrlChange: (newUrl: string) => Promise<void>;
}

export function ProfileSection({
  title,
  onRefresh,
  children,
  profileUrl,
  onUrlChange,
}: ProfileSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
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
        {isExpanded && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        )}
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
