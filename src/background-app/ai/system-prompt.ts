import { ConfigTypeKey, type DataLayer } from "../domain";
import {
  replyExampleToXML,
  type ReplyExample,
} from "../domain/models/reply-example";

export async function buildSystemPrompt(
  profileId: string,
  datalayer: DataLayer
) {
  const identity = await datalayer.config.get<string>(
    profileId,
    ConfigTypeKey.SYSTEM_PROMPT
  );

  const instructions = await datalayer.config.get<string[]>(
    profileId,
    ConfigTypeKey.SYSTEM_INSTRUCTIONS
  );

  const replyExamples = await datalayer.config.get<ReplyExample[]>(
    profileId,
    ConfigTypeKey.TWITTER_REPLY_EXAMPLES
  );

  let systemPrompt = `# Identity

${identity}
`;

  if (instructions) {
    systemPrompt += `
# Instructions

${instructions.map((instruction) => `- ${instruction}`).join("\n")}`;
  }

  if (replyExamples) {
    systemPrompt += `
    
# Examples

${replyExamples.map((example) => `${replyExampleToXML(example)}`).join("\n")}`;
  }

  return systemPrompt;
}
