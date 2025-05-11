/* ------------------------------------------------------------------
 * THIS COMPONENT BUILDS A "FORMAT_INSTRUCTIONS" STRING THAT YOU CAN
 * FEED DIRECTLY TO GPT WHEN ASKING IT TO WRITE A TWEET‑STYLE REPLY.
 * Every toggle instantly rewrites the preview so you can copy‑paste it.
 * ----------------------------------------------------------------*/

export interface InstructionOptions {
  lowercase: boolean;
  breakLines: boolean; // let GPT insert line breaks where it wants
  keepNewlines: boolean; // preserve existing \n in the final tweet
  punctuation: "natural" | "minimal" | "heavy";
  allowEmoji: boolean;
  allowExclamation: boolean;
  extras: string[]; // any custom rules you type in
}

export function buildFormatInstructionsPrompt(
  opts: InstructionOptions
): string {
  const parts: string[] = [];

  // casing
  if (opts.lowercase) {
    parts.push("lowercase (except names)");
  } else {
    parts.push("preserve casing");
  }

  // line handling
  if (opts.breakLines) {
    parts.push("break lines freely");
  }
  if (!opts.keepNewlines) {
    parts.push("no newlines");
  }

  // punctuation density
  switch (opts.punctuation) {
    case "minimal":
      parts.push("minimal punctuation");
      break;
    case "heavy":
      parts.push("rich punctuation");
      break;
    default:
      parts.push("use commas & periods naturally");
  }

  // stylistic flavours
  parts.push(opts.allowEmoji ? "emoji allowed" : "no emoji");
  parts.push(
    opts.allowExclamation ? "exclamation allowed" : "avoid exclamation"
  );

  // extra user‑supplied rules
  if (opts.extras.length) parts.push(...opts.extras);

  return `Format: ${parts.join(", ")}`;
}
