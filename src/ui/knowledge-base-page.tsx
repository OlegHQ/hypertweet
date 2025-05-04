import React from "react";
import { Layout } from "./layout";
import SystemPromptConfig from "./system-prompt-config";
import PersonalityConfig from "./personality-config";
export default function KnowledgeBasePage() {
  return (
    <Layout>
      <h1>Knowledge Base</h1>
      <SystemPromptConfig />
      <PersonalityConfig />
    </Layout>
  );
}
