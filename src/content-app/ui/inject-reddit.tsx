import { createRoot, type Root } from "react-dom/client";
import { injectGlobalStyles } from "./styles";
import Panel from "./panel";

injectGlobalStyles();

// Store the current root instance to clean up on navigation
let currentRoot: Root | null = null;

export function injectRedditPanel() {
	// Clean up any existing panel first
	const existingPanel = document.querySelector("#hypertweet-reddit-panel");
	if (existingPanel) {
		if (currentRoot) {
			currentRoot.unmount();
			currentRoot = null;
		}
		existingPanel.remove();
	}

	// Only inject on Reddit post pages with comments
	if (!window.location.pathname.includes('/comments/')) {
		console.log("Not a Reddit post page, skipping injection");
		return;
	}

	// Find a suitable location for the panel (near the comment composer)
	const targetElement = document.querySelector('shreddit-composer');
	if (!targetElement) {
		console.log("Reddit comment composer not found, retrying...");
		// Retry after a delay since Reddit loads dynamically
		setTimeout(injectRedditPanel, 1000);
		return;
	}

	// Create container for panel
	const container = document.createElement("div");
	container.id = "hypertweet-reddit-panel";
	container.style.cssText = `
    margin: 16px 0;
    border: 1px solid var(--color-neutral-border-weak);
    border-radius: 8px;
    background: var(--color-neutral-background);
    padding: 16px;
  `;

	// Insert before the comment composer
	targetElement.parentElement?.insertBefore(container, targetElement);

	// Mount React panel
	currentRoot = createRoot(container);
	currentRoot.render(
		<div style={{ width: "100%" }}>
			<Panel siteType="reddit" parent={targetElement as HTMLElement} />
		</div>
	);

	return () => {
		if (currentRoot) {
			currentRoot.unmount();
			currentRoot = null;
		}
		container.remove();
	};
}

