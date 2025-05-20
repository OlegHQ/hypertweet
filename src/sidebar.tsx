import { createRoot } from "react-dom/client";
import Router from "./ui/router";
import { DarkModeDetector } from "./ui/dark-mode-detector";
import { installTailwind } from "./utils/install-tailwind";

installTailwind();

// Initialize React
const root = document.getElementById("root");
if (root) {
  // Add global styles for html and body
  const style = document.createElement("style");
  style.textContent = `
    html, body {
      background-color: #ffffff;
      color: #0f172a;
    }
    html.dark, html.dark body {
      background-color: #0f172a;
      color: #f8fafc;
    }
  `;
  document.head.appendChild(style);

  createRoot(root).render(
    <div className="h-full w-full text-sm bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark">
      <DarkModeDetector />
      <Router />
    </div>
  );
}
