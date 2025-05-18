import { createRoot } from "react-dom/client";
import Panel from "./panel";

export function injectLinkedInReplyStuff() {
  // 1. Set up a MutationObserver to watch the whole page
  const observer = new MutationObserver((mutations) => {
    for (const { addedNodes } of mutations) {
      for (const node of Array.from(addedNodes) as HTMLElement[]) {
        if (node.nodeType !== 1) continue; // skip non-elements

        // 2. Check if this node _is_ your target editor, or contains it
        const editorNode = node.matches(
          '[data-test-ql-editor-contenteditable="true"]'
        )
          ? node
          : node.querySelector('[data-test-ql-editor-contenteditable="true"]');

        if (editorNode) {
          // Find the parent form
          const formElement = (editorNode as HTMLElement).closest(
            "form.comments-comment-box__form"
          );
          if (formElement) {
            injectAiToneButtons(formElement as HTMLElement);
          }
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
        /* Styles for the button container itself */
        .ai-tone-buttons {
          display: flex;
          justify-content: flex-start; /* Or flex-end, depending on desired alignment */
          padding-top: 8px; /* Add some spacing */
          gap: 8px; /* Spacing between buttons if Panel renders multiple */
        }
      `;
    document.head.appendChild(style);
  }

  // 3. Inject your button list (only once per form)
  async function injectAiToneButtons(formElement: HTMLElement) {
    injectStyle();

    if (injectingLock.current) {
      return;
    }

    // Check if buttons are already injected in this specific form
    if (formElement.querySelector(".ai-tone-buttons")) {
      return;
    }

    injectingLock.current = true;
    // Release lock after a short delay to prevent race conditions during rapid DOM changes
    setTimeout(() => {
      injectingLock.current = false;
    }, 500);

    const wrapper = document.createElement("div");
    wrapper.className = "ai-tone-buttons";
    // CSS for the wrapper is now handled by the injected stylesheet

    formElement.appendChild(wrapper); // Append as the last child of the form
    createRoot(wrapper).render(
      <Panel siteType="linkedin" parent={formElement} />
    );
  }
}
