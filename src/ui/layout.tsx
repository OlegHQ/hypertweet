import type React from "react";
import ProfileSelector from "./profile-selector";
import { useGlobalState } from "./state";
import { useState } from "react";
import { Button } from "./library/button";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { selectedProfile } = useGlobalState();
  const [showProfileSelector, setShowProfileSelector] = useState(false);

  if (!selectedProfile) {
    return <ProfileSelector />;
  }

  if (showProfileSelector) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4"
      >
        <Button
          variant="ghost"
          onClick={() => setShowProfileSelector(false)}
          className="mb-4 text-gray-600 dark:text-gray-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <ProfileSelector
          onProfileSelected={() => setShowProfileSelector(false)}
        />
      </motion.div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Welcome, {selectedProfile.name}!
          </h1>
          {selectedProfile.twitterUrl && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              <a
                href={selectedProfile.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline"
              >
                View X Profile
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowProfileSelector(true)}
            className="text-gray-700 dark:text-gray-300"
          >
            Switch Profile
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
