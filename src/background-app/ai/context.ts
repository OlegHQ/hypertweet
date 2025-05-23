import type { PersonaPayload } from "./system-prompt-gen";
import { tokenManager } from "./token-manager";
import { ModelType } from "./model-type";
import type { PersonalityType } from "./personality-type";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions";
import { postProcess } from "./post-process";

export async function buildPersonalitySnippet(
  key: string,
  model: ModelType,
  payload: PersonaPayload
): Promise<string> {
  const openai = tokenManager.getClient(key);
  const chat = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You distill profile text into a first‑person personality blurb, ≤20 tokens, casual English. Return ONLY the blurb.",
      },
      { role: "user", content: JSON.stringify(payload) },
    ],
    max_tokens: 30,
    temperature: 0.5,
    stop: ["\n"],
  });

  return chat?.choices?.[0]?.message?.content?.trim() ?? "";
}

function getSystemPrompt(
  mode: "simplify" | "smarter" | "randomize" | "bro",
  personalityType: PersonalityType | null
): string {
  const personalityPrompts: Record<PersonalityType, string> = {
    unspecified: "You are a helpful assistant.",
    analyst:
      "You are a data-driven, analytical thinker who focuses on facts and logic.",
    motivator:
      "You are an upbeat, inspirational voice who encourages and uplifts others.",
    witty_comedian:
      "You are a clever, playful commentator who uses smart humor and wit.",
    empathetic_friend:
      "You are a supportive, understanding friend who shows genuine care.",
    insider_expert:
      "You are an authoritative expert who shares valuable professional insights.",
    visionary_leader:
      "You are a bold, future-focused leader who inspires with big-picture thinking.",
    no_nonsense_leader:
      "You are a direct, decisive leader who cuts through the noise.",
    sarcastic_leader:
      "You are a witty authority figure who uses dry humor and sharp observations.",
    seasoned_pro:
      "You are a calm, experienced professional who shares best practices and wisdom.",
  };

  const modePrompts: Record<
    "simplify" | "smarter" | "randomize" | "bro",
    string
  > = {
    simplify:
      "Simplify the text while maintaining its core message. Make it more concise and easier to understand.",
    smarter:
      "Enhance the text with more sophisticated language and deeper insights while keeping it engaging.",
    randomize:
      "Transform the text with creative variations while preserving its main points. Add some unexpected elements.",
    bro: "Convert the text into casual, friendly 'bro' speak while keeping it authentic and not overdoing it.",
  };

  const personalityPrompt = personalityType
    ? personalityPrompts[personalityType]
    : personalityPrompts.unspecified;
  const modePrompt = modePrompts[mode];

  return `${personalityPrompt} ${modePrompt} Keep the response concise and Twitter-friendly (280 characters or less).`;
}

export async function editReply(
  key: string,
  model: ModelType,
  personalityType: PersonalityType | null,
  postText: string,
  currentReply: string,
  mode: "simplify" | "smarter" | "randomize" | "bro"
): Promise<[string, ChatCompletionCreateParamsNonStreaming, ChatCompletion]> {
  const openai = tokenManager.getClient(key);
  const systemPrompt = getSystemPrompt(mode, personalityType);

  const request: ChatCompletionCreateParamsNonStreaming = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Original post: ${postText}\n\nCurrent reply: ${currentReply}\n\nTransform this reply according to the instructions.`,
      },
    ],
    max_tokens: 150,
    temperature: mode === "randomize" ? 0.8 : 0.5,
  };
  const chat = await openai.chat.completions.create(request);
  const reply = postProcess(chat?.choices?.[0]?.message?.content?.trim() ?? "");
  return [reply, request, chat];
}
