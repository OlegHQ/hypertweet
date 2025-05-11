import { useGlobalState } from "./state";
import HomePage from "./home-page";
import PersonalityConfigPage from "./personality-config-page";
import ReplyTypesPage from "./reply-types-page";
import ReplyTypeEditPage from "./reply-types-edit-page";
import MiscPage from "./misc-page";
import DataBackup from "./data-backup";
import ChatGPTPromptsPage from "./chatgpt-prompts-page";

export default function Router() {
  const { currentRoute } = useGlobalState();

  if (currentRoute === "/") {
    return <HomePage />;
  }

  if (currentRoute === "/data-backup") {
    return <DataBackup />;
  }

  if (currentRoute === "/knowledge-base") {
    return <PersonalityConfigPage />;
  }

  if (currentRoute === "/reply-types") {
    return <ReplyTypesPage />;
  }

  if (currentRoute.startsWith("/reply-types/edit/")) {
    return <ReplyTypeEditPage />;
  }

  if (currentRoute === "/misc") {
    return <MiscPage />;
  }

  if (currentRoute === "/chatgpt-prompts") {
    return <ChatGPTPromptsPage />;
  }

  return <HomePage />;
}
