import React from "react";
import { Layout } from "./layout";
import SystemPromptConfig from "./system-prompt-config";
import PersonalityConfig from "./personality-config";
import { useGlobalState } from "./state";
import { PageHeader } from "./components/page-header";
export default function KnowledgeBasePage() {
  return (
    <Layout>
      <PageHeader title="Knowledge Base" backRoute="/" />
      <SystemPromptConfig />
      <PersonalityConfig />
    </Layout>
  );
}
