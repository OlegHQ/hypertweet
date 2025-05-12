import React from "react";
import { Layout } from "./layout";
import SystemPromptConfig from "./system-prompt-config";
import SocialProfilesConfig from "./social-profiles-config";
import { PageHeader } from "./page-header";
import FormatInstructionBuilder from "./format-instructions-builder";
import PersonalityTypeSelector from "./personality-type-selector";

export default function PersonalityConfigPage() {
  return (
    <Layout>
      <PageHeader title="Personality Config" backRoute="/" />
      <div className="space-y-4 max-w-4xl mx-auto">
        <PersonalityTypeSelector />
        <SystemPromptConfig />
        <FormatInstructionBuilder />
        <SocialProfilesConfig />
      </div>
    </Layout>
  );
}
