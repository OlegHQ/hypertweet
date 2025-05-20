import { createRoot } from "react-dom/client";
import Panel from "./panel";
import { installTailwind } from "src/utils/install-tailwind";

export function injectTwitterReplyStuff() {
  // 1. Set up a MutationObserver to watch the whole page
  const observer = new MutationObserver((mutations) => {
    for (const { addedNodes } of mutations) {
      for (const node of Array.from(addedNodes) as HTMLElement[]) {
        if (node.nodeType !== 1) continue; // skip non-elements

        // 2. Check if this node _is_ your target, or contains it
        const target = node.matches('[data-testid="inline_reply_offscreen"]')
          ? node
          : node.querySelector('[data-testid="inline_reply_offscreen"]');

        if (target) {
          injectAiToneButtons(target as HTMLElement);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  const injectingLock = { current: false };
  const isStyleInjected = { current: false };

  function injectStyle() {
    if (isStyleInjected.current) {
      return;
    }
    isStyleInjected.current = true;
    const style = document.createElement("style");
    style.textContent = `
        @media (prefers-color-scheme: dark) {
          .ai-tone-button {
            border-color: rgb(47, 51, 54);
            color: rgb(29, 155, 240);
          }
          .ai-tone-button:hover {
            background-color: rgba(29, 155, 240, 0.1);
          }
          .ai-tone-button:active {
            background-color: rgba(29, 155, 240, 0.2);
          }
        }
        @media (prefers-color-scheme: light) {
          .ai-tone-button {
            border-color: rgb(207, 217, 222);
            color: rgb(29, 155, 240);
          }
          .ai-tone-button:hover {
            background-color: rgba(29, 155, 240, 0.1);
          }
          .ai-tone-button:active {
            background-color: rgba(29, 155, 240, 0.2);
          }
        }
      `;
    document.head.appendChild(style);
  }

  // 3. Inject your button list (only once per container)
  async function injectAiToneButtons(container: HTMLElement) {
    injectStyle();

    if (injectingLock.current) {
      return;
    }

    if (container.parentNode?.querySelector(".ai-tone-buttons")) {
      return;
    }

    injectingLock.current = true;

    setTimeout(() => {
      injectingLock.current = false;
    }, 1000);

    const wrapper = document.createElement("div");
    wrapper.className = "ai-tone-buttons";
    wrapper.style.cssText = `
      z-index: 2;
    `;
    container.parentNode?.insertBefore(wrapper, container.nextSibling);
    // Add style
    const style = document.createElement("style");
    style.textContent = `
    /** it needs to be hsl, used like that hsl(var(--primary)) */
      :root {
        --primary: 203, 89%, 53%;
        --border: 220, 13%, 91%;
      }
    `;
    document.head.appendChild(style);

    installTailwind();
    createRoot(wrapper).render(<Panel siteType="twitter" parent={container} />);
  }
}
