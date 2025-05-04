import { useGlobalState } from "./state";
import HomePage from "./home-page";
import KnowledgeBasePage from "./knowledge-base-page";
import ReplyTypesPage from "./reply-types-page";
import ReplyTypeEditPage from "./reply-types-edit-page";
import ApiConfigPage from "./api-config-page";
export default function Router() {
  const { currentRoute } = useGlobalState();

  if (currentRoute === "/") {
    return <HomePage />;
  }

  if (currentRoute === "/knowledge-base") {
    return <KnowledgeBasePage />;
  }

  if (currentRoute === "/reply-types") {
    return <ReplyTypesPage />;
  }

  if (currentRoute.startsWith("/reply-types/edit/")) {
    return <ReplyTypeEditPage />;
  }

  if (currentRoute === "/api-config") {
    return <ApiConfigPage />;
  }

  return <HomePage />;
}
