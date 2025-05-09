import React from "react";
import type { Tweet as Post } from "../background-app/data/models/social-profile";
import { ProfileSection } from "./profile-section";
import { Button } from "./library/button";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ThumbsUp, ExternalLink, Trash2 } from "lucide-react";
import { cn } from "./library/utils";

interface LinkedInProfileProps {
  data: {
    name: string;
    headline?: string;
    location?: string;
    about?: string;
    experience?: Array<{
      title: string;
      company: string;
      duration: string;
      description?: string;
    }>;
    education?: Array<{
      school: string;
      degree: string;
      duration: string;
    }>;
    recentPosts?: Post[];
  };
  onRefresh: () => Promise<void>;
  profileUrl?: string;
  onUrlChange: (newUrl: string) => Promise<void>;
  onClear: () => Promise<void>;
}

export function LinkedInProfile({
  data,
  onRefresh,
  profileUrl,
  onUrlChange,
  onClear,
}: LinkedInProfileProps) {
  const [showRecentPosts, setShowRecentPosts] = React.useState(false);

  return (
    <ProfileSection
      title="LinkedIn Profile"
      onRefresh={onRefresh}
      profileUrl={profileUrl}
      onUrlChange={onUrlChange}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <div className="mt-1 text-gray-900 dark:text-gray-100">{data.name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Headline
            </label>
            <div className="mt-1 text-gray-900 dark:text-gray-100">{data.headline}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Location
            </label>
            <div className="mt-1 text-gray-900 dark:text-gray-100">{data.location}</div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              About
            </label>
            <div className="mt-1 text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {data.about}
            </div>
          </div>
        </div>

        {data.experience && data.experience.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Experience
            </h3>
            <div className="space-y-4">
              {data.experience.map((exp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {exp.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {exp.company}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    {exp.duration}
                  </div>
                  {exp.description && (
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      {exp.description}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {data.education && data.education.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Education
            </h3>
            <div className="space-y-4">
              {data.education.map((edu, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {edu.school}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {edu.degree}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    {edu.duration}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {(data?.recentPosts?.length ?? 0) > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Recent Posts
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRecentPosts(!showRecentPosts)}
                className="text-primary-600 dark:text-primary-400"
              >
                {showRecentPosts ? "Hide" : "Show"} Posts
              </Button>
            </div>
            <AnimatePresence>
              {showRecentPosts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {data?.recentPosts?.map((post: Post, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {new Date(post.time).toLocaleString()}
                      </div>
                      <div className="whitespace-pre-wrap mb-3 text-gray-900 dark:text-gray-100">
                        {post.text}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {post.replies}
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {post.likes}
                        </div>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 dark:text-primary-400 hover:underline ml-auto inline-flex items-center gap-1"
                        >
                          View Post
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
      <div className="mt-6 pt-4 border-t dark:border-gray-700">
        <Button
          variant="ghost"
          onClick={async () => {
            if (
              window.confirm(
                "Are you sure you want to clear the LinkedIn profile data?"
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
