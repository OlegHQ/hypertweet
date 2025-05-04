import React from "react";
import { ProfileSection } from "./profile-section";

interface LinkedInProfileProps {
  data: {
    name: string;
    location?: string;
    description?: string;
    positions?: string[];
    companies?: string[];
  };
  onRefresh: () => Promise<void>;
  profileUrl?: string;
  onUrlChange: (newUrl: string) => Promise<void>;
}

export function LinkedInProfile({
  data,
  onRefresh,
  profileUrl,
  onUrlChange,
}: LinkedInProfileProps) {
  return (
    <ProfileSection
      title="LinkedIn Profile"
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
              Location
            </label>
            <div className="mt-1">{data.location}</div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <div className="mt-1 whitespace-pre-wrap">
              {data.description}
            </div>
          </div>
          {data.positions && data.positions.length > 0 && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Positions
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.positions.map((position, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {position}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.companies && data.companies.length > 0 && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Companies
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.companies.map((company, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {company}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProfileSection>
  );
} 