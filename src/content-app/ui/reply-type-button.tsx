import { useCallback, useState, useEffect } from "react";
import type { ReplyType } from "../../background-app/domain";
import { extractPostDetails, typeLinkedIn } from "../linkedin/type-actions";
import { typeTweet } from "../twitter/type-tweet";
import { app } from "../../ui/app";
import { useSiteType } from "./use-site-type";
import { useSiteTypeStore } from "./site-type-store";
import { LinkButton } from "./link-button";
import { BubbleButton } from "./bubble-button";
import usePostText from "./use-post-text";
import { bgApp } from "../bg-app";
import { ConfigTypeKey } from "src/background-app/domain/models/config-type-key";
import { cn } from "src/ui/library/utils";
import useApplyText from "./use-apply-text";

interface ReplyTypeButtonProps {
  replyType: ReplyType;
  disabled: boolean;
  onLoading: (loading: boolean) => void;
}

interface ButtonState {
  loading: boolean;
}

type ReplyTypeButtonTheme = "links" | "bubbles";

const useReplyTypeButton = (
  replyType: ReplyType,
  disabled: boolean,
  onLoading: (loading: boolean) => void
) => {
  const siteType = useSiteType();
  const [state, setState] = useState<ButtonState>({
    loading: false,
  });
  const [theme, setTheme] = useState<ReplyTypeButtonTheme>("links");
  const parent = useSiteTypeStore((state) => state.parent);

  useEffect(() => {
    async function loadTheme() {
      const profileId = await bgApp.system.getCurrentProfileId();
      if (!profileId) return;

      const savedTheme = await bgApp.dataLayer.config.get<string>(
        profileId,
        ConfigTypeKey.REPLY_TYPE_BUTTON_THEME
      );
      if (savedTheme) {
        setTheme(savedTheme as ReplyTypeButtonTheme);
      }
    }
    loadTheme();
  }, []);

  const onSuperLoading = useCallback(
    (loading: boolean) => {
      setState((prev) => ({ ...prev, loading }));
      onLoading(loading);
    },
    [onLoading]
  );

  const loadPostContent = usePostText();
  const applyText = useApplyText();

  const handleReply = async (
    replyType: ReplyType,
    onSuperLoading: (loading: boolean) => void
  ) => {
    const x = await loadPostContent();
    const text = x?.postText;
    if (!text) {
      console.warn("hypertweet: no tweet text");
      onSuperLoading(false);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const reply = await app.ai.generateReply(
      siteType as "twitter" | "linkedin",
      replyType.profileId,
      text ?? "",
      replyType.prompt
    );

    applyText(reply);
  };

  const handleReplyTypeClick = async () => {
    onSuperLoading(true);

    try {
      await handleReply(replyType, onSuperLoading);
    } catch (error) {
      console.error("hypertweet: error generating reply:", error);
    } finally {
      onSuperLoading(false);
    }
  };

  return {
    state,
    handleReplyTypeClick,
    theme,
  };
};

export default function ReplyTypeButton({
  replyType,
  onLoading,
  disabled,
}: ReplyTypeButtonProps) {
  const { state, handleReplyTypeClick, theme } = useReplyTypeButton(
    replyType,
    disabled,
    onLoading
  );

  const ButtonComponent = theme === "bubbles" ? BubbleButton : LinkButton;

  return (
    <ButtonComponent
      className={cn("pr-3")}
      disabled={disabled}
      onClick={handleReplyTypeClick}
      loading={state.loading}
      loadingText="Generating..."
    >
      {replyType.icon ? <span className="mr-1">{replyType.icon}</span> : null}
      {replyType.name}
    </ButtonComponent>
  );
}
