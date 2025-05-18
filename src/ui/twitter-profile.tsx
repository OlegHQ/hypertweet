import React from "react";
import type { Tweet } from "../background-app/domain/models/social-profile";
import { ProfileSection } from "./profile-section";
import { Button } from "./library/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Repeat2,
  Heart,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { cn } from "./library/utils";

interface TwitterProfileProps {
  data: {
    name: string;
    username: string;
    bio?: string;
    location?: string;
    website?: string;
    joinDate?: string;
    following?: number;
    followers?: number;
    recentTweets?: Tweet[];
  };
  onRefresh: () => Promise<void>;
  profileUrl?: string;
  onUrlChange: (newUrl: string) => Promise<void>;
  onClear: () => Promise<void>;
}

export function TwitterProfile({
  data,
  onRefresh,
  profileUrl,
  onUrlChange,
  onClear,
}: TwitterProfileProps) {
  const [showRecentTweets, setShowRecentTweets] = React.useState(false);

  return (
    <ProfileSection
      title="X Profile"
      onRefresh={onRefresh}
      profileUrl={profileUrl}
      onUrlChange={onUrlChange}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <div className="mt-1 text-gray-900 dark:text-gray-100">
              {data.name}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <div className="mt-1 text-gray-900 dark:text-gray-100">
              @{data.username}
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bio
            </label>
            <div className="mt-1 text-gray-900 dark:text-gray-100">
              {data.bio}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Location
            </label>
            <div className="mt-1 text-gray-900 dark:text-gray-100">
              {data.location}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Website
            </label>
            <div className="mt-1">
              {data.website ? (
                <a
                  href={data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                >
                  {data.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  Not specified
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Join Date
            </label>
            <div className="mt-1 text-gray-900 dark:text-gray-100">
              {data.joinDate}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Following
            </label>
            <div className="mt-1 text-gray-900 dark:text-gray-100">
              {data.following?.toLocaleString()}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Followers
            </label>
            <div className="mt-1 text-gray-900 dark:text-gray-100">
              {data.followers?.toLocaleString()}
            </div>
          </div>
          {(data?.recentTweets?.length ?? 0) > 0 && (
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recent Tweets
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRecentTweets(!showRecentTweets)}
                  className="text-primary-600 dark:text-primary-400"
                >
                  {showRecentTweets ? "Hide" : "Show"} Tweets
                </Button>
              </div>
              <AnimatePresence>
                {showRecentTweets && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-4"
                  >
                    {data?.recentTweets?.map((tweet: Tweet, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {new Date(tweet.time).toLocaleString()}
                        </div>
                        <div className="whitespace-pre-wrap mb-3 text-gray-900 dark:text-gray-100">
                          {tweet.text}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {tweet.replies}
                          </div>
                          <div className="flex items-center gap-1">
                            <Repeat2 className="h-4 w-4" />
                            {tweet.retweets}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {tweet.likes}
                          </div>
                          <a
                            href={tweet.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 dark:text-primary-400 hover:underline ml-auto inline-flex items-center gap-1"
                          >
                            View Tweet
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 pt-4 border-t dark:border-gray-700">
        <Button
          variant="ghost"
          onClick={async () => {
            if (
              window.confirm(
                "Are you sure you want to clear the Twitter profile data?"
              )
            ) {
              await onClear();
            }
          }}
          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear Profile Data
        </Button>
      </div>
    </ProfileSection>
  );
}
