import React from "react";
import { Layout } from "./layout";
import SystemPromptConfig from "./system-prompt-config";
import SocialProfilesConfig from "./social-profiles-config";
import { PageHeader } from "./page-header";
import FormatInstructionBuilder from "./format-instructions-builder";
import PersonalityTypeSelector from "./personality-type-selector";
import { useGlobalState } from "./state";
import { Card, CardContent } from "./library/card";
import { CardHeader } from "./library/card";
import { motion } from "framer-motion";
import { app } from "./app";

export default function PersonalityConfigPage() {
  const { selectedProfile } = useGlobalState();

  return (
    <Layout>
      <PageHeader title="Personality Config" backRoute="/" />
      <div className="space-y-4 max-w-4xl mx-auto">
        <PersonalityTypeSelector />
        <SystemPromptConfig />
        {selectedProfile?.id && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 max-w-3xl mx-auto"
          >
            <Card className="rounded-2xl shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Format Instructions
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Customize how your replies are formatted
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FormatInstructionBuilder
                  withPreview
                  selectedProfileId={selectedProfile.id}
                  app={app}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
        <SocialProfilesConfig />
      </div>
    </Layout>
  );
}
