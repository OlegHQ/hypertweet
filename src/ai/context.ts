import type { XProfile, LinkedInProfile } from "../data";
import { tokenManager } from "./token-manager";

export async function buildPersonalitySnippet(
  key: string,
  twitter: XProfile,
  linkedIn: LinkedInProfile
): Promise<string> {
  // 1. curate high‑signal lines  --------------------------
  const tweetsSorted = (twitter.recentTweets ?? [])
    .filter((t) => !t.text.startsWith("RT"))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 2)
    .map((t) => `Tweet: "${t.text.split("\n")[0]}"`);

  const corpus = [
    linkedIn.description,
    linkedIn.positions[0],
    `Based in ${linkedIn.location}`,
    twitter.bio ?? "",
    ...tweetsSorted,
  ].filter(Boolean);

  // 2. craft JSON payload for the LLM  --------------------
  const payload = {
    persona_corpus: corpus,
    target_tokens: 20,
    must_include: ["Tech lead", "Ukraine"],
    tone_key: "friendly",
    return: "personality_snippet",
  };

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
