import { toXML } from "jstoxml";

export type SocialMediaType = "twitter" | "linkedin" | "reddit";
export type PostType = "regular" | "thread" | "reply";

export interface ReplyExample {
  id: string;
  socialMediaType: SocialMediaType;
  postType: PostType;
  content: string | string[] | { original: string; reply: string };
}

export function replyExampleToXML(example: ReplyExample): string {
  const xmlOptions = {
    header: false,
    indent: "  ",
  };

  const contentToXML = (
    content: string | string[] | { original: string; reply: string }
  ) => {
    if (typeof content === "string") {
      return {
        _name: "content",
        _attrs: { type: "text" },
        _content: content,
      };
    }

    if (Array.isArray(content)) {
      return {
        _name: "thread",
        _attrs: { type: "thread" },
        _content: content.map((post, index) => ({
          _name: "post",
          _attrs: { index: index + 1 },
          _content: post,
        })),
      };
    }

    return [
      {
        _name: "social_media_post",
        _content: content.original,
      },
      {
        _name: "user_reply",
        _content: content.reply,
      },
    ];
  };

  const xml = {
    _name: "example",
    _attrs: {
      platform: example.socialMediaType,
      type: example.postType,
    },
    _content: contentToXML(example.content),
  };

  return toXML(xml, xmlOptions);
}
