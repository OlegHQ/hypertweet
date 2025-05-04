export function typeTweet(text = "") {
  const editor = document.querySelector(
    'div[contenteditable="true"][data-testid="tweetTextarea_0"]'
  ) as HTMLElement;
  if (!editor) return;

  editor?.focus?.();
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(true);
  sel?.removeAllRanges();
  sel?.addRange(range);

  document.execCommand("selectAll", false, undefined);
  document.execCommand("insertText", false, text);
}
