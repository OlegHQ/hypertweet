import type { App } from "./background-app";
import { browserApi } from "./browser-api";
import { makeContentApp } from "./content-app/context";
import { createProxyHandler, makePathInvoker } from "./data/proxy-handler";
const app = makeContentApp();
const invoker = makePathInvoker(app);
console.log(" hype content script loaded");
browserApi.runtime.onMessage.addListener(async (message) => {
  const { name, path, args } = message;
  if (name === "content-proxy") {
    return await invoker(path, args);
  }
  throw new Error("unknown message");
});

const bgApp = createProxyHandler<App>(async (path, args) => {
  return await browserApi.runtime.sendMessage({ name: "proxy", path, args });
});

function injectReplyStuff() {
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
  const isInjected = { current: false };
  // 3. Inject your button list (only once per container)
  async function injectAiToneButtons(container: HTMLElement) {
    if (isInjected.current) {
      return;
    }
    isInjected.current = true;
    const profileId = await bgApp.system.getCurrentProfileId();
    if (!profileId) {
      console.warn("hypertweet: no profile id");
      return;
    }

    const replyTypes = await bgApp.replyTypes.getAll(profileId);

    const wrapper = document.createElement("div");
    wrapper.className = "ai-tone-buttons";
    wrapper.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: -10px;
      margin-bottom: 8px;
      padding-left: 16px;
      padding-right: 16px;
      justify-content: center;
      z-index: 2;
    `;

    replyTypes.forEach((t) => {
      const btn = document.createElement("button");
      btn.textContent = t.name;
      btn.className = "ai-tone-button";
      btn.style.cssText = `
        padding: 3px 8px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 500;
        border: 1px solid rgba(83, 100, 113, 0.5);
        background-color: transparent;
        color: rgb(29, 155, 240);
        transition: background-color 0.2s;
        cursor: pointer;
        white-space: nowrap;
        letter-spacing: 0.02em;
      `;

      // Add hover and active states
      btn.addEventListener("mouseenter", () => {
        btn.style.backgroundColor = "rgba(29, 155, 240, 0.1)";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.backgroundColor = "transparent";
      });
      btn.addEventListener("mousedown", () => {
        btn.style.backgroundColor = "rgba(29, 155, 240, 0.2)";
      });
      btn.addEventListener("mouseup", () => {
        btn.style.backgroundColor = "rgba(29, 155, 240, 0.1)";
      });

      btn.addEventListener("click", () => {
        // your click handler here
        console.log(`You clicked: ${t}`, replyTypes);
      });
      wrapper.appendChild(btn);
    });

    // Add styles for dark mode support
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
    container.parentNode?.insertBefore(wrapper, container.nextSibling);
  }
}
console.log("injecting reply stuff");
injectReplyStuff();
