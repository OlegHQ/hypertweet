import type { ReplyType } from "../data/models/reply-type";

export function defaultReplyTypes(): ReplyType[] {
  return [
    {
      id: "nice",
      name: "Nice",
      prompt: "Upbeat & kind, 1–2 sentences.",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystem: true,
    },
    {
      id: "thanks",
      name: "Thanks",
      prompt: "Brief thank‑you, 1 sentence.",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystem: true,
    },
    {
      id: "asking",
      name: "Asking",
      prompt: "Friendly question, 1 sentence.",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystem: true,
    },
    {
      id: "insightful",
      name: "Insightful",
      prompt: "Thoughtful insight, ≤2 sentences.",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystem: true,
    },
    {
      id: "sarcastic",
      name: "Sarcastic",
      prompt: "Light sarcasm, 1 witty sentence.",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystem: true,
    },
  ];
}
