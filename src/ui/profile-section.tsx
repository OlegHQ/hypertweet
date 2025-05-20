import React from "react";
import { Accordion } from "./library/accordion";
import { Button } from "./library/button";
import { Input } from "./library/input";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ExternalLink, Edit2, Save, X } from "lucide-react";
import { cn } from "./library/utils";

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

  const actions = (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-2"
    >
      <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
      {isRefreshing ? "Refreshing..." : "Refresh"}
    </Button>
  );

  return (
    <Accordion title={title} actions={actions} className="mb-4">
      <div className="space-y-4">
        {children}
        <div className="pt-4 border-t dark:border-gray-700">
          <div className="flex items-center gap-2">
            {isEditingUrl ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex gap-2"
              >
                <Input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="Enter profile URL"
                  className="flex-1"
                />
                <Button
                  onClick={handleUrlSave}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingUrl(false);
                    setNewUrl(profileUrl || "");
                    setUrlError(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Profile URL:
                  </span>
                  {profileUrl ? (
                    <a
                      href={profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                    >
                      {profileUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                      Not set
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingUrl(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit URL
                </Button>
              </>
            )}
          </div>
          <AnimatePresence>
            {urlError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 text-sm text-red-600 dark:text-red-400"
              >
                {urlError}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Accordion>
  );
}
