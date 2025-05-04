import React, { useState, useEffect } from "react";
import { app } from "./app";
import { useGlobalState } from "./state";
import type { Profile } from "../background-app/data";

interface Props {
  profile?: Profile;
  onCancel: () => void;
}

export default function CreateProfileForm({ profile, onCancel }: Props) {
  const { setProfiles } = useGlobalState();
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    twitterUrl: profile?.twitterUrl || "",
    linkedInUrl: profile?.linkedInUrl || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        twitterUrl: profile.twitterUrl || "",
        linkedInUrl: profile.linkedInUrl || "",
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate Twitter URL format
      if (formData.twitterUrl && !formData.twitterUrl.includes("x.com/")) {
        throw new Error("Please enter a valid Twitter profile URL");
      }

      // Validate LinkedIn URL format
      if (
        formData.linkedInUrl &&
        !formData.linkedInUrl.includes("linkedin.com/in/")
      ) {
        throw new Error("Please enter a valid LinkedIn profile URL");
      }

      if (profile) {
        // Update existing profile
        await app.dataLayer.profile.update(profile.id, {
          name: formData.name,
          twitterUrl: formData.twitterUrl,
          linkedInUrl: formData.linkedInUrl,
        });
      } else {
        // Create new profile
        await app.dataLayer.profile.add({
          name: formData.name,
          twitterUrl: formData.twitterUrl,
          linkedInUrl: formData.linkedInUrl,
        });
      }

      // Refresh profiles list
      const profiles = await app.dataLayer.profile.getAll();
      setProfiles(profiles);
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        {profile ? "Edit Profile" : "Create New Profile"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Your name"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="twitterUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            X Profile URL *
          </label>
          <input
            type="url"
            id="twitterUrl"
            name="twitterUrl"
            value={formData.twitterUrl}
            onChange={handleChange}
            required
            placeholder="https://x.com/username"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="linkedInUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            LinkedIn Profile URL (Optional)
          </label>
          <input
            type="url"
            id="linkedInUrl"
            name="linkedInUrl"
            value={formData.linkedInUrl}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/username"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Saving..."
              : profile
              ? "Save Changes"
              : "Create Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
