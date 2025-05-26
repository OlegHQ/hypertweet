import { useCallback } from "react";
import { typeTweet } from "../twitter/type-tweet";
import { useSiteTypeStore } from "./site-type-store";
import usePostText from "./use-post-text";
import { typeLinkedIn } from "../linkedin/type-actions";

export default function useApplyText() {
  const loadPostContent = usePostText();
  const setMode = useSiteTypeStore((state) => state.setMode);
  const setEditedText = useSiteTypeStore((state) => state.setEditedText);
  const siteType = useSiteTypeStore((state) => state.siteType);
  const parent = useSiteTypeStore((state) => state.parent);

  const applyText = useCallback(
    async (reply: string) => {
      const res = await loadPostContent();
      const currentReply = res?.currentReply;
      if (currentReply && currentReply !== "") {
        setMode("edit");
        setEditedText(reply);
      } else {
        if (siteType === "twitter") {
          typeTweet(reply);
        } else if (siteType === "linkedin") {
          const editor = parent
            ?.closest(`[role="article"]`)
            ?.querySelector(
              'div[data-test-ql-editor-contenteditable="true"]'
            ) as HTMLElement;
          typeLinkedIn(editor, reply);
        } else {
          console.warn("hypertweet: no site type");
          alert("typing: " + reply);
        }
      }
    },
    [loadPostContent, setMode, setEditedText]
  );
  return applyText;
}
