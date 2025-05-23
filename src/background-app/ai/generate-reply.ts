import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletion,
  ChatCompletionMessageParam,
} from "openai/resources/chat";
import { getSiteContext } from "./get-site-context";
import type { ModelType } from "./model-type";
import { postProcess } from "./post-process";
import { tokenManager } from "./token-manager";
import { PERSONALITY_TYPES, type PersonalityType } from "./personality-type";

export async function generateReply(
  key: string,
  model: ModelType,
  personaSnippet: string | null,
  personalityType: PersonalityType | null,
  prompt: string,
  formatInstructions: string,
  postText: string,
  siteType: "twitter" | "linkedin"
): Promise<
  [
    string,
    ChatCompletionCreateParamsNonStreaming,
    ChatCompletion & {
      _request_id?: string | null;
    },
  ]
> {
  const messages: ChatCompletionMessageParam[] = [];
  if (personaSnippet) {
    messages.push({ role: "system", content: "BIO: " + personaSnippet });
  }
  if (personalityType === null || personalityType !== "unspecified") {
    messages.push({
      role: "system",
      content:
        "PERSONALITY: " +
        PERSONALITY_TYPES.find((p) => p.value === personalityType)?.label,
    });
  }

  messages.push({ role: "system", content: getSiteContext(siteType) });
  messages.push({
    role: "system",
    content: "FORMAT: " + formatInstructions,
  });
  messages.push({ role: "system", content: "REPLY_PROMPT: " + prompt });
  messages.push({
    role: "user",
    content: `POST: """${postText.slice(0, 400)}"""`,
  });

  const openai = tokenManager.getClient(key);
  const request = {
    model,
    messages,
    max_tokens: 60,
    temperature: 0.7,
    stop: ["\n"],
  };
  const response = await openai.chat.completions.create(request);
  const formattedResponse = postProcess(
    response?.choices?.[0]?.message?.content?.trim() ?? ""
  );

  return [formattedResponse, request, response];
}
