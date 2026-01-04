import { Streamdown } from '@phaserjs/streamdown-lite';

interface MarkdownProps {
  children: string;
  onInsertReply?: (text: string) => void;
  isReddit?: boolean;
}

interface ContentPart {
  type: 'text' | 'reply';
  content: string;
}

function parseReplyBlocks(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const replyBlockRegex = /```reply\s*\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = replyBlockRegex.exec(content)) !== null) {
    // Add text before the reply block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push({ type: 'text', content: textBefore });
      }
    }

    // Add the reply block content
    const replyContent = match[1]?.trim();
    if (replyContent) {
      parts.push({ type: 'reply', content: replyContent });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last reply block
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex);
    if (remaining.trim()) {
      parts.push({ type: 'text', content: remaining });
    }
  }

  // If no reply blocks found, return entire content as text
  if (parts.length === 0 && content.trim()) {
    parts.push({ type: 'text', content });
  }

  return parts;
}

function ReplyBlock({
  content,
  onInsert,
  isReddit = false,
}: {
  content: string;
  onInsert: ((text: string) => void) | undefined;
  isReddit: boolean;
}): React.ReactElement {
  const handleClick = (): void => {
    onInsert?.(content);
  };

  return (
    <div className="ht-reply-block">
      <div className="ht-reply-block-content">{content}</div>
      {onInsert && (
        <button
          className="ht-reply-block-btn"
          onClick={handleClick}
          title={isReddit ? 'Copy to clipboard' : 'Insert reply'}
        >
          {isReddit ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
          <span>{isReddit ? 'Copy' : 'Insert'}</span>
        </button>
      )}
    </div>
  );
}

export function Markdown({
  children,
  onInsertReply,
  isReddit,
}: MarkdownProps): React.ReactElement {
  const parts = parseReplyBlocks(children);

  return (
    <>
      {parts.map((part, index) =>
        part.type === 'reply' ? (
          <ReplyBlock
            key={index}
            content={part.content}
            onInsert={onInsertReply}
            isReddit={isReddit ?? false}
          />
        ) : (
          <Streamdown key={index}>{part.content}</Streamdown>
        )
      )}
    </>
  );
}
