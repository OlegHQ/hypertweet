import React from "react";
import { Layout } from "./layout";
import SystemPromptConfig from "./system-prompt-config";
import SocialProfilesConfig from "./social-profiles-config";
import { PageHeader } from "./page-header";
import FormatInstructionBuilder from "./format-instructions-builder";
export default function PersonalityConfigPage() {
  return (
    <Layout>
      <PageHeader title="Personality Config" backRoute="/" />
      <SystemPromptConfig />
      <FormatInstructionBuilder />
      <SocialProfilesConfig />
    </Layout>
  );
}
