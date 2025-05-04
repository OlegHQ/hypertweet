import React from "react";
import type { Tweet } from "../data/models/twitter-profile";
import { ProfileSection } from "./profile-section";

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
}

export function TwitterProfile({
  data,
  onRefresh,
  profileUrl,
  onUrlChange,
}: TwitterProfileProps) {
  const [showRecentTweets, setShowRecentTweets] = React.useState(false);

  return (
    <ProfileSection
      title="Twitter Profile"
      onRefresh={onRefresh}
      profileUrl={profileUrl}
      onUrlChange={onUrlChange}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <div className="mt-1">{data.name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="mt-1">@{data.username}</div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <div className="mt-1">{data.bio}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <div className="mt-1">{data.location}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Website
            </label>
            <div className="mt-1">
              {data.website ? (
                <a
                  href={data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {data.website}
                </a>
              ) : (
                "Not specified"
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Join Date
            </label>
            <div className="mt-1">{data.joinDate}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Following
            </label>
            <div className="mt-1">{data.following?.toLocaleString()}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Followers
            </label>
            <div className="mt-1">{data.followers?.toLocaleString()}</div>
          </div>
          {(data?.recentTweets?.length ?? 0) > 0 && (
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Recent Tweets
                </label>
                <button
                  onClick={() => setShowRecentTweets(!showRecentTweets)}
                  className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1"
                >
                  {showRecentTweets ? "Hide" : "Show"} Tweets
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showRecentTweets ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
              {showRecentTweets && (
                <div className="mt-2 space-y-4">
                  {data?.recentTweets?.map((tweet: Tweet, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="text-sm text-gray-500 mb-2">
                        {new Date(tweet.time).toLocaleString()}
                      </div>
                      <div className="whitespace-pre-wrap mb-3">{tweet.text}</div>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          {tweet.replies}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          {tweet.retweets}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          {tweet.likes}
                        </div>
                        <a
                          href={tweet.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline ml-auto"
                        >
                          View Tweet
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProfileSection>
  );
}
