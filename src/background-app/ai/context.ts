// openai-utils.ts
// 2025-05-24 — simplified, easier to tweak.

import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { tokenManager } from "./token-manager";
import type { ModelType } from "./model-type";
import type { PersonalityType } from "./personality-type";
import type { ActionType } from "./ai-facade";
import { postProcess } from "./post-process";

/* -------------------------------------------------------------------------- */
/*  ✅ Tweak-friendly prompt dictionaries                                      */
/* -------------------------------------------------------------------------- */

export const PERSONALITY_PROMPTS: Record<
  Exclude<PersonalityType, null>,
  string
> = {
  unspecified: "Helpful assistant.",
  analyst: "Data-driven, logical thinker.",
  motivator: "Upbeat and encouraging voice.",
  witty_comedian: "Clever commentator with wit.",
  empathetic_friend: "Supportive, understanding friend.",
  insider_expert: "Authoritative professional insights.",
  visionary_leader: "Bold, future-focused leader.",
  no_nonsense_leader: "Direct, decisive leader.",
  sarcastic_leader: "Witty authority, dry humor.",
  seasoned_pro: "Calm, experienced professional.",
};

export const MODE_PROMPTS: Record<ActionType, string> = {
  simplify: "Simplify while keeping the core message.",
  smarter: "Enrich with deeper insight and refined language.",
  randomize: "Add creative twists and unexpected elements.",
  bro: "Convert to friendly 'bro' speak (light touch).",
  cleanup: "Polish grammar and remove clutter.",
};

/* -------------------------------------------------------------------------- */
/*  🛠 Common helper to hit Chat Completions                                   */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  📝 System prompt builder — override maps if you like                       */
/* -------------------------------------------------------------------------- */

export function buildSystemPrompt({
  mode,
  personalityType,
  personalityMap = {},
  modeMap = {},
  limit = 280,
}: {
  mode: ActionType;
  personalityType?: PersonalityType | null;
  personalityMap?: Partial<typeof PERSONALITY_PROMPTS>;
  modeMap?: Partial<typeof MODE_PROMPTS>;
  limit?: number;
}): string {
  const persona = { ...PERSONALITY_PROMPTS, ...personalityMap };
  const modes = { ...MODE_PROMPTS, ...modeMap };

  const personaLine = persona[personalityType ?? "unspecified"];
  const modeLine = modes[mode];

  return `${personaLine} ${modeLine} Limit to ${limit} characters. Return only the transformed reply.`;
}

/* -------------------------------------------------------------------------- */
/*  ✂️ Main transform function                                                */
/* -------------------------------------------------------------------------- */

export async function editReply({
  key,
  model,
  personalityType = null,
  postText,
  currentReply,
  mode,
  overrides = {},
  maxTokens = 150,
}: {
  key: string;
  model: ModelType;
  personalityType?: PersonalityType | null;
  postText: string;
  currentReply: string;
  mode: ActionType;
  overrides?: {
    personalityMap?: Partial<typeof PERSONALITY_PROMPTS>;
    modeMap?: Partial<typeof MODE_PROMPTS>;
    limit?: number;
  };
  maxTokens?: number;
}): Promise<
  [
    string, // final reply
    ChatCompletionCreateParamsNonStreaming, // raw request
    ChatCompletion, // raw response
  ]
> {
  const systemPrompt = buildSystemPrompt({
    mode,
    personalityType,
    ...overrides,
  });

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Original post:\n${postText}\n\nCurrent reply:\n${currentReply}`,
    },
  ];

  const rawRequest: ChatCompletionCreateParamsNonStreaming = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature: mode === "randomize" ? 0.8 : 0.5,
    response_format: { type: "text" },
  };

  const chatResult = await tokenManager
    .getClient(key)
    .chat.completions.create(rawRequest);

  const reply = postProcess(
    chatResult.choices[0]?.message?.content?.trim() ?? ""
  );

  return [reply, rawRequest, chatResult];
}
