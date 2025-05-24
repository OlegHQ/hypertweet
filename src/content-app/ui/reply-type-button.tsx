import { useCallback, useState } from "react";
import type { ReplyType } from "../../background-app/domain";
import { extractPostDetails, typeLinkedIn } from "../linkedin/type-actions";
import { typeTweet } from "../twitter/type-tweet";
import { app } from "../../ui/app";
import { useSiteType } from "./use-site-type";
import { useSiteTypeStore } from "./site-type-store";
import { Button } from "./button";
import usePostText from "./use-post-text";
interface ReplyTypeButtonProps {
  replyType: ReplyType;
  disabled: boolean;
  onLoading: (loading: boolean) => void;
}

interface ButtonState {
  loading: boolean;
}

const useReplyTypeButton = (
  replyType: ReplyType,
  disabled: boolean,
  onLoading: (loading: boolean) => void
) => {
  const siteType = useSiteType();
  const [state, setState] = useState<ButtonState>({
    loading: false,
  });
  const parent = useSiteTypeStore((state) => state.parent);

  const onSuperLoading = useCallback(
    (loading: boolean) => {
      setState((prev) => ({ ...prev, loading }));
      onLoading(loading);
    },
    [onLoading]
  );

  const loadPostContent = usePostText();
  const setEditedText = useSiteTypeStore((state) => state.setEditedText);
  const setMode = useSiteTypeStore((state) => state.setMode);

  const handleTwitterReply = async (
    replyType: ReplyType,
    onSuperLoading: (loading: boolean) => void
  ) => {
    const text = document
      .querySelector('[data-testid="tweetText"]')
      ?.textContent?.trim();

    if (!text) {
      console.warn("hypertweet: no tweet text");
      onSuperLoading(false);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const reply = await app.ai.generateReply(
      "twitter",
      replyType.profileId,
      text,
      replyType.prompt
    );

    const res = await loadPostContent();
    const currentReply = res?.currentReply;
    if (currentReply && currentReply !== "") {
      setMode("edit");
      setEditedText(reply);
    } else {
      typeTweet(reply);
    }
  };

  const handleLinkedInReply = async (
    replyType: ReplyType,
    parent: HTMLElement | null,
    onSuperLoading: (loading: boolean) => void
  ) => {
    const postDetails = extractPostDetails(
      parent?.closest(`[role="article"]`) as HTMLElement
    );

    const { text, authorName, authorPosition } = postDetails;
    const fullText = `${text}\n\n${authorName} - ${authorPosition}`;

    if (!fullText) {
      console.warn("hypertweet: no LinkedIn post text");
      onSuperLoading(false);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const reply = await app.ai.generateReply(
      "linkedin",
      replyType.profileId,
      fullText,
      replyType.prompt
    );

    const editor = parent
      ?.closest(`[role="article"]`)
      ?.querySelector(
        'div[data-test-ql-editor-contenteditable="true"]'
      ) as HTMLElement;
    typeLinkedIn(editor, reply);
  };

  const handleDebuggingReply = async (
    replyType: ReplyType,
    onSuperLoading: (loading: boolean) => void
  ) => {
    // For debugging mode, we'll use a mock text
    const mockText = "This is a mock tweet for debugging purposes.";

    alert(mockText);
  };

  const handleReplyTypeClick = async () => {
    onSuperLoading(true);

    try {
      switch (siteType) {
        case "twitter":
          await handleTwitterReply(replyType, onSuperLoading);
          break;
        case "linkedin":
          await handleLinkedInReply(replyType, parent, onSuperLoading);
          break;
        case "debugging":
          await handleDebuggingReply(replyType, onSuperLoading);
          break;
        default:
          console.warn("hypertweet: unknown site type");
      }
    } catch (error) {
      console.error("hypertweet: error generating reply:", error);
    } finally {
      onSuperLoading(false);
    }
  };

  return {
    state,
    handleReplyTypeClick,
  };
};

export default function ReplyTypeButton({
  replyType,
  onLoading,
  disabled,
}: ReplyTypeButtonProps) {
  const { state, handleReplyTypeClick } = useReplyTypeButton(
    replyType,
    disabled,
    onLoading
  );

  return (
    <Button
      className="pr-3"
      disabled={disabled}
      onClick={handleReplyTypeClick}
      loading={state.loading}
      loadingText="Generating..."
    >
      {replyType.icon ? <span className="mr-1">{replyType.icon}</span> : null}
      {replyType.name}
    </Button>
  );
}
