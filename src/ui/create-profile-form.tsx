import React, { useState, useEffect } from "react";
import { app } from "./app";
import { useGlobalState } from "./state";
import type { Profile } from "../background-app/data";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "./library/card";
import { Button } from "./library/button";
import { Input } from "./library/input";
import { Label } from "./library/label";
import {
  AlertCircle,
  CheckCircle2,
  User,
  Twitter,
  Linkedin,
} from "lucide-react";

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
  const [success, setSuccess] = useState<string | null>(null);

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
    setSuccess(null);

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
      setSuccess(
        profile
          ? "Profile updated successfully!"
          : "Profile created successfully!"
      );
      setTimeout(() => onCancel(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {profile ? "Edit Profile" : "Create New Profile"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Name *
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="twitterUrl"
                    className="flex items-center gap-2"
                  >
                    <Twitter className="h-4 w-4" />X Profile URL *
                  </Label>
                  <Input
                    type="url"
                    id="twitterUrl"
                    name="twitterUrl"
                    value={formData.twitterUrl}
                    onChange={handleChange}
                    required
                    placeholder="https://x.com/username"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="linkedInUrl"
                    className="flex items-center gap-2"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn Profile URL (Optional)
                  </Label>
                  <Input
                    type="url"
                    id="linkedInUrl"
                    name="linkedInUrl"
                    value={formData.linkedInUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full"
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-green-700 dark:text-green-300">
                        {success}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={onCancel}
                  variant="outline"
                  className="min-w-[100px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[100px]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Saving...
                    </div>
                  ) : profile ? (
                    "Save Changes"
                  ) : (
                    "Create Profile"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
