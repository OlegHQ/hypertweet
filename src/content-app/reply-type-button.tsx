import { useCallback, useState } from "react";
import type { ReplyType } from "../background-app/data";
import { typeTweet } from "./type-tweet";

interface ReplyTypeButtonProps {
  replyType: ReplyType;
  disabled: boolean;
  onLoading: (loading: boolean) => void;
}

export default function ReplyTypeButton({
  replyType,
  onLoading,
  disabled,
}: ReplyTypeButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const buttonStyle = {
    padding: "3px 8px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: 500,
    border: "1px solid rgba(83, 100, 113, 0.5)",
    backgroundColor: isActive
      ? "rgba(29, 155, 240, 0.2)"
      : isHovered
      ? "rgba(29, 155, 240, 0.1)"
      : "transparent",
    color: "rgb(29, 155, 240)",
    transition: "background-color 0.2s",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    letterSpacing: "0.02em",
    opacity: disabled ? 0.5 : 1,
  };

  const [loading, setLoading] = useState(false);
  const onSuperLoading = useCallback(
    (loading: boolean) => {
      setLoading(loading);
      onLoading(loading);
    },
    [setLoading, onLoading]
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
    const message = "facts!";
    typeTweet(message);
    onSuperLoading(false);
  };

  return (
    <button
      disabled={disabled}
      style={buttonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      onClick={() => handleReplyTypeClick()}
    >
      {loading ? "Generating..." : replyType.name}
    </button>
  );
}
