import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/index";

export interface RequestLogItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  profileId: string;
  request: ChatCompletionCreateParamsNonStreaming;
  response: ChatCompletion;
  type: "generate" | "edit" | null;
}
