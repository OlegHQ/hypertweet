import type { ChatCompletionMessageParam } from "openai/resources/chat";
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

const TWEET_CONTEXT =
  "You are composing a reply tweet. Output only the reply text, no greeting, no hashtags unless present in the post.";


export async function generateReply(
  key: string,
  model: ModelType,
  personaSnippet: string | null,
  prompt: string,
  formatInstructions: string,
  postText: string
): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [];
  if (personaSnippet) {
    messages.push({ role: "system", content: personaSnippet });
  }
  messages.push({ role: "system", content: TWEET_CONTEXT });
  messages.push({ role: "system", content: prompt });
  messages.push({
    role: "system",
    content: formatInstructions,
  });
  messages.push({
    role: "user",
    content: `Tweet: """${postText.slice(0, 400)}"""`,
  });

  const openai = tokenManager.getClient(key);
  const res = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: 60,
    temperature: 0.7,
    stop: ["\n"],
  });

  return postProcess(res?.choices?.[0]?.message?.content?.trim() ?? "");
}

function postProcess(text: string): string {
  // replace “ and ” with "
  text = text.replace(/“/g, '"');
  text = text.replace(/”/g, '"');

  // replace ’ with '
  text = text.replace(/’/g, "'");
  text = text.replace(/—/g, ",");

  return text;
}
