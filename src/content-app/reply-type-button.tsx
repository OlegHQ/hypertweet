import { useCallback, useState } from "react";
import type { ReplyType } from "../background-app/data";
import { typeTweet } from "./type-tweet";
import { app } from "../ui/app";
import { Button } from "./button";

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
  const [state, setState] = useState<ButtonState>({
    loading: false,
  });

  const onSuperLoading = useCallback(
    (loading: boolean) => {
      setState(prev => ({ ...prev, loading }));
      onLoading(loading);
    },
    [onLoading]
  );

  const handleReplyTypeClick = async () => {
    onSuperLoading(true);
    const tweetText = document
      .querySelector('[data-testid="tweetText"]')
      ?.textContent?.trim();
    if (!tweetText) {
      console.warn("hypertweet: no tweet text");
      onSuperLoading(false);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const reply = await app.ai.generateReply(
      replyType.profileId,
      tweetText,
      replyType.prompt
    );
    typeTweet(reply);
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
      {replyType.name}
    </Button>
  );
}
