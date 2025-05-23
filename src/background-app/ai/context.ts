import type { PersonaPayload } from "./system-prompt-gen";
import { tokenManager } from "./token-manager";
import { ModelType } from "./model-type";

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

export async function editReply(
  key: string,
  model: ModelType,
  text: string,
  mode: "simplify" | "smarter" | "randomize" | "bro"
) {
  const openai = tokenManager.getClient(key);
  const chat = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: text },
    ],
  });
}
