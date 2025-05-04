import type { PersonaPayload } from "./system-prompt-gen";
import { tokenManager } from "./token-manager";

export async function buildPersonalitySnippet(
  key: string,
  payload: PersonaPayload
): Promise<string> {
  // 3. hit GPT‑3.5‑turbo  ---------------------------------
  const openai = tokenManager.getClient(key);
  const chat = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You distill profile text into a first‑person personality blurb, ≤20 tokens, casual English. Must include: Tech lead, Ukraine. Return ONLY the blurb.",
      },
      { role: "user", content: JSON.stringify(payload) },
    ],
    max_tokens: 30,
    temperature: 0.5,
    stop: ["\n"],
  });

  return chat?.choices?.[0]?.message?.content?.trim() ?? "";
}
