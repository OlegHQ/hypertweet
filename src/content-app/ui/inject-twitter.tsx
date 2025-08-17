import { createRoot } from "react-dom/client";
import Panel from "./panel";
import { injectGlobalStyles } from "./styles";

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
    /** it needs to be hsl, used like that hsl(var(--colors-primary)) */
      :root {
        /* Primary colors */
        --colors-primary: 203, 89%, 53%;
        --colors-primary-50: 210, 100%, 98%;
        --colors-primary-100: 210, 100%, 96%;
        --colors-primary-200: 210, 100%, 90%;
        --colors-primary-300: 210, 100%, 80%;
        --colors-primary-400: 210, 100%, 70%;
        --colors-primary-500: 210, 100%, 60%;
        --colors-primary-600: 210, 100%, 50%;
        --colors-primary-700: 210, 100%, 40%;
        --colors-primary-800: 210, 100%, 30%;
        --colors-primary-900: 210, 100%, 20%;
        --colors-primary-950: 210, 100%, 10%;

        /* Secondary colors */
        --colors-secondary: 215, 16%, 47%;
        --colors-secondary-50: 210, 40%, 98%;
        --colors-secondary-100: 210, 40%, 96%;
        --colors-secondary-200: 214, 32%, 91%;
        --colors-secondary-300: 213, 27%, 84%;
        --colors-secondary-400: 215, 20%, 65%;
        --colors-secondary-500: 215, 16%, 47%;
        --colors-secondary-600: 215, 19%, 35%;
        --colors-secondary-700: 215, 25%, 27%;
        --colors-secondary-800: 217, 33%, 17%;
        --colors-secondary-900: 222, 47%, 11%;
        --colors-secondary-950: 224, 71%, 4%;

        /* Gray colors */
        --colors-gray-50: 210, 20%, 98%;
        --colors-gray-100: 220, 14%, 96%;
        --colors-gray-200: 220, 13%, 91%;
        --colors-gray-300: 216, 12%, 84%;
        --colors-gray-400: 218, 11%, 65%;
        --colors-gray-500: 220, 9%, 46%;
        --colors-gray-600: 215, 14%, 34%;
        --colors-gray-700: 217, 19%, 27%;
        --colors-gray-800: 215, 28%, 17%;
        --colors-gray-900: 221, 39%, 11%;
        --colors-gray-950: 224, 71%, 4%;

        /* Accent colors */
        --colors-accent: 292, 84%, 61%;
        --colors-accent-50: 290, 100%, 98%;
        --colors-accent-100: 290, 100%, 96%;
        --colors-accent-200: 290, 100%, 90%;
        --colors-accent-300: 290, 100%, 80%;
        --colors-accent-400: 290, 100%, 70%;
        --colors-accent-500: 290, 100%, 60%;
        --colors-accent-600: 290, 100%, 50%;
        --colors-accent-700: 290, 100%, 40%;
        --colors-accent-800: 290, 100%, 30%;
        --colors-accent-900: 290, 100%, 20%;
        --colors-accent-950: 290, 100%, 10%;

        /* Success colors */
        --colors-success: 142, 76%, 36%;
        --colors-success-50: 142, 76%, 97%;
        --colors-success-100: 142, 76%, 95%;
        --colors-success-200: 142, 76%, 90%;
        --colors-success-300: 142, 76%, 80%;
        --colors-success-400: 142, 76%, 70%;
        --colors-success-500: 142, 76%, 60%;
        --colors-success-600: 142, 76%, 50%;
        --colors-success-700: 142, 76%, 40%;
        --colors-success-800: 142, 76%, 30%;
        --colors-success-900: 142, 76%, 20%;
        --colors-success-950: 142, 76%, 10%;

        /* Warning colors */
        --colors-warning: 35, 92%, 50%;
        --colors-warning-50: 35, 92%, 97%;
        --colors-warning-100: 35, 92%, 95%;
        --colors-warning-200: 35, 92%, 90%;
        --colors-warning-300: 35, 92%, 80%;
        --colors-warning-400: 35, 92%, 70%;
        --colors-warning-500: 35, 92%, 60%;
        --colors-warning-600: 35, 92%, 50%;
        --colors-warning-700: 35, 92%, 40%;
        --colors-warning-800: 35, 92%, 30%;
        --colors-warning-900: 35, 92%, 20%;
        --colors-warning-950: 35, 92%, 10%;

        /* Error colors */
        --colors-error: 0, 84%, 60%;
        --colors-error-50: 0, 84%, 97%;
        --colors-error-100: 0, 84%, 95%;
        --colors-error-200: 0, 84%, 90%;
        --colors-error-300: 0, 84%, 80%;
        --colors-error-400: 0, 84%, 70%;
        --colors-error-500: 0, 84%, 60%;
        --colors-error-600: 0, 84%, 50%;
        --colors-error-700: 0, 84%, 40%;
        --colors-error-800: 0, 84%, 30%;
        --colors-error-900: 0, 84%, 20%;
        --colors-error-950: 0, 84%, 10%;

        /* Background and foreground */
        --colors-background: 0, 0%, 100%;
        --colors-background-dark: 222, 47%, 11%;
        --colors-foreground: 222, 47%, 11%;
        --colors-foreground-dark: 210, 40%, 98%;

        /* Border */
        --colors-border: 220, 13%, 91%;
        
        --border: 220, 13%, 91%;
        --primary: 203, 89%, 53%;

      }
    `;
    document.head.appendChild(style);

    injectGlobalStyles();
    createRoot(wrapper).render(<Panel siteType="twitter" parent={container} />);
  }
}
