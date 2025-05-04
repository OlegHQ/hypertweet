import nlp from "compromise";
import { removeStopwords } from "stopword";
import type { LinkedInProfile, Tweet, XProfile } from "../data";

export type PersonaPayload = ReturnType<typeof buildPersonaPayload>;
export function buildPersonaPayload(
  twitter: XProfile | null,
  linkedin: LinkedInProfile | null
) {
  const rawLines: string[] = [];

  if (linkedin) {
    rawLines.push(linkedin.description);
    for (const position of linkedin.positions) {
      rawLines.push(position);
    }
    if (linkedin.companies[0]) rawLines.push(linkedin.companies[0]);
    if (linkedin.location) rawLines.push(`Based in ${linkedin.location}`);
  }

  if (twitter) {
    if (twitter.bio) rawLines.push(twitter.bio);
    if (twitter.location) rawLines.push(`Based in ${twitter.location}`);
    rawLines.push(...topLikedTweets(twitter.recentTweets ?? [], 2));
  }

  const keywords = extractKeywords(rawLines.join(". "), 8); // ≤8 best tokens/phrases
  const mustInclude = pickMustInclude(keywords, []);

  return {
    persona_corpus: rawLines,
    target_tokens: 20,
    must_include: mustInclude,
    return: "personality_snippet",
  };
}

// pick two most‑liked non‑RT tweets
function topLikedTweets(tweets: Tweet[], n: number) {
  return tweets
    .filter((t) => !t.text.startsWith("RT"))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, n)
    .map((t) => `Tweet: "${t.text.split("\n")[0]}"`);
}

// ----------- lightweight keyword extractor -----------------
function extractKeywords(text: string, max = 8): string[] {
  const doc = nlp(text);

  // 1‑3‑word noun phrases
  const phrases = doc
    .match("#Noun+")
    .out("array")
    .map((phrase: string) => phrase.trim());

  // + single nouns/adjectives
  const singles = doc
    .match("#Noun|#Adjective")
    .out("array")
    .map((term: string) => term.trim());

  const all = [...phrases, ...singles]
    .map((p) => p.replace(/[^a-z0-9 ]/gi, ""))
    .filter(Boolean);

  // strip stop‑words & short tokens
  const clean = removeStopwords(all).filter((w) => w.length > 2);

  // frequency × length score
  const score: Record<string, number> = {};
  for (const w of clean) {
    score[w] = (score[w] || 0) + w.split(" ").length;
  }

  return Object.entries(score)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([k]) => titleCase(k));
}

function pickMustInclude(candidates: string[], hints: string[]) {
  const chosen = [];
  for (const hint of hints) {
    const found = candidates.find((c) =>
      c.toLowerCase().includes(hint.toLowerCase())
    );
    if (found) chosen.push(found);
    if (chosen.length === 2) break;
  }
  // back‑fill if <2
  return [...chosen, ...candidates].slice(0, 2);
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
