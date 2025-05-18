export function typeLinkedIn(editor: HTMLElement | null, text = "") {
  if (!editor) {
    console.warn("LinkedIn editor not found for typing.");
    return;
  }

  editor.focus(); // Ensure editor has focus

  const selection = window.getSelection();
  if (!selection) {
    console.warn("Could not get window selection.");
    return;
  }

  // Position cursor at the start of the editor, then select all.
  // This ensures that 'selectAll' command works as expected starting from within the editor.
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(true); // Collapse to the start
  selection.removeAllRanges();
  selection.addRange(range);

  // Now select all content
  document.execCommand("selectAll", false, undefined);

  // Prepare HTML content
  // Split text by newline characters. Map each line to a <p> tag.
  // If a line is empty (e.g., from "text\n\nmore text"), use <br> inside the <p> for an empty paragraph.
  const lines = text.split("\n");
  const htmlContent = lines.map((line) => `<p>${line || "<br>"}</p>`).join("");

  // Insert the HTML, replacing the selected content (which is everything)
  const success = document.execCommand("insertHTML", false, htmlContent);
  if (!success) {
    console.error(
      "Failed to insert HTML using execCommand. Content may not have been updated."
    );
    // As a last resort, one might use editor.innerHTML = htmlContent, but execCommand is preferred.
  }
}

interface PostDetails {
  text: string;
  authorName: string;
  authorPosition: string;
}

/**
 * Extracts the full text, author name, and author position from a LinkedIn-like post element.
 * Assumes semantic class names are assigned in the markup:
 *  - .post-text: the container for the post's main text content
 *  - .author-name: the element containing the author's full name
 *  - .author-position: the element containing the author's position/title
 *
 * @param postElement - The root HTMLElement of the post thread
 * @returns An object with the post text, author name, and author position
 */
export function extractPostDetails(postElement: HTMLElement): PostDetails {
  const textEl = postElement.querySelector<HTMLElement>(
    `.update-components-text`
  );
  const authorEl = postElement.querySelector<HTMLElement>(
    `.update-components-actor__title span[aria-hidden="true"]`
  );
  const positionEl = postElement.querySelector<HTMLElement>(
    ".update-components-actor__description"
  );

  if (!textEl) {
    throw new Error("Post text element (.post-text) not found");
  }
  if (!authorEl) {
    throw new Error("Author name element (.author-name) not found");
  }
  if (!positionEl) {
    throw new Error("Author position element (.author-position) not found");
  }

  const text = textEl.innerText.trim();
  const authorName = authorEl.innerText.trim();
  const authorPosition = positionEl.innerText.trim();

  return { text, authorName, authorPosition };
}
