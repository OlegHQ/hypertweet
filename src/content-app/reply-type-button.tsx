import { useCallback, useState } from "react";
import type { ReplyType } from "../background-app/data";
import { extractPostDetails, typeLinkedIn, typeTweet } from "./type-actions";
import { app } from "../ui/app";
import { Button } from "./button";
import { useSiteType } from "./use-site-type";
import { useSiteTypeStore } from "./site-type-store";
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
  const contentType = useSiteType();
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

  const handleReplyTypeClick = async () => {
    onSuperLoading(true);
    const getText = () => {
      if (contentType === "twitter") {
        return document
          .querySelector('[data-testid="tweetText"]')
          ?.textContent?.trim();
      } else if (contentType === "linkedin") {
        const postDetails = extractPostDetails(
          parent?.closest(`[role="article"]`) as HTMLElement
        );

        const { text, authorName, authorPosition } = postDetails;
        return `${text}\n\n${authorName} - ${authorPosition}`;
      }
    };
    console.log("getText", getText());
    const text = getText();
    if (!text) {
      console.warn("hypertweet: no tweet text");
      onSuperLoading(false);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const reply = await app.ai.generateReply(
      contentType,
      replyType.profileId,
      text,
      replyType.prompt
    );

    if (contentType === "twitter") {
      typeTweet(reply);
    } else {
      const editor = parent
        ?.closest(`[role="article"]`)
        ?.querySelector(
          'div[data-test-ql-editor-contenteditable="true"]'
        ) as HTMLElement;
      typeLinkedIn(editor, reply);
    }
    onSuperLoading(false);
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
