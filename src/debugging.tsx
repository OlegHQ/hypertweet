import { createRoot } from "react-dom/client";
import { installTailwind } from "./utils/install-tailwind";
import { TwitterThread } from "./ui/twitter-thread";
import Panel from "./content-app/ui/panel";

installTailwind();

// Initialize React
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <div className="h-full w-full text-sm bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark">
      <TwitterThread>
        <Panel className="mt-8 border border-red-500" siteType={"debugging"} parent={null} />
      </TwitterThread>
    </div>
  );
}
