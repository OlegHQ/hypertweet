import PersonalityConfig from "./personality-config";
import SystemPromptConfig from "./system-prompt-config";

export default function KnowledgeBase() {
  return (
    <div>
      <h1>Knowledge Base</h1>
      <SystemPromptConfig />
      <PersonalityConfig />
    </div>
  );
}
