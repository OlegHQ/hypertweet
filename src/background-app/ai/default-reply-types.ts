import type { ReplyType } from "../data/models/reply-type";

export function defaultReplyTypes(profileId: string): ReplyType[] {
  return [
    {
      id: "nice",
      name: "Nice",
      icon: "😊",
      prompt: "Upbeat & kind, 1–2 sentences.",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystem: true,
      profileId,
    },
    {
      id: "thanks",
      name: "Thanks",
      icon: "🙏",
      prompt: "Brief thank‑you, 1 sentence.",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystem: true,
      profileId,
    },
    {
      id: "asking",
      name: "Asking",
      icon: "❓",
      prompt: "Friendly question, 1 sentence.",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystem: true,
      profileId,
    },
    {
      id: "insightful",
      name: "Insightful",
      icon: "💡",
      prompt: "Thoughtful insight, ≤2 sentences.",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystem: true,
      profileId,
    },
    {
      id: "sarcastic",
      name: "Sarcastic",
      icon: "😏",
      prompt: "Light sarcasm, 1 witty sentence.",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystem: true,
      profileId,
    },
  ];
}
