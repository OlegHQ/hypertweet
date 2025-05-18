import { describe, expect, it } from "bun:test";
import {
  buildFormatInstructionsPrompt,
  defaultOptions,
  type InstructionOptions,
} from "./format-instructions";

describe("buildFormatInstructionsPrompt", () => {
  it("should return default format instructions", () => {
    const result = buildFormatInstructionsPrompt(defaultOptions);
    expect(result).toBe(
      "lowercase (except names), break lines freely, no newlines, use commas & periods naturally, no emoji, avoid exclamation"
    );
  });

  it("should handle uppercase option", () => {
    const options: InstructionOptions = {
      ...defaultOptions,
      lowercase: false,
    };
    const result = buildFormatInstructionsPrompt(options);
    expect(result).toBe(
      "proper capitalization, break lines freely, no newlines, use commas & periods naturally, no emoji, avoid exclamation"
    );
  });

  it("should handle line break options", () => {
    const options: InstructionOptions = {
      ...defaultOptions,
      breakLines: false,
      keepNewlines: true,
    };
    const result = buildFormatInstructionsPrompt(options);
    expect(result).toBe(
      "lowercase (except names), use commas & periods naturally, no emoji, avoid exclamation"
    );
  });

  it("should handle different punctuation styles", () => {
    const minimalOptions: InstructionOptions = {
      ...defaultOptions,
      punctuation: "minimal",
    };
    expect(buildFormatInstructionsPrompt(minimalOptions)).toContain(
      "minimal punctuation"
    );

    const heavyOptions: InstructionOptions = {
      ...defaultOptions,
      punctuation: "heavy",
    };
    expect(buildFormatInstructionsPrompt(heavyOptions)).toContain(
      "rich punctuation"
    );
  });

  it("should handle emoji and exclamation options", () => {
    const options: InstructionOptions = {
      ...defaultOptions,
      allowEmoji: true,
      allowExclamation: true,
    };
    const result = buildFormatInstructionsPrompt(options);
    expect(result).toContain("emoji allowed");
    expect(result).toContain("exclamation allowed");
  });

  it("should include extra rules when provided", () => {
    const options: InstructionOptions = {
      ...defaultOptions,
      extras: ["use hashtags", "keep it short"],
    };
    const result = buildFormatInstructionsPrompt(options);
    expect(result).toContain("use hashtags");
    expect(result).toContain("keep it short");
  });

  it("should handle empty extras array", () => {
    const options: InstructionOptions = {
      ...defaultOptions,
      extras: [],
    };
    const result = buildFormatInstructionsPrompt(options);
    expect(result).not.toContain("undefined");
    expect(result).not.toContain("null");
  });

  it("should combine multiple custom options", () => {
    const options: InstructionOptions = {
      lowercase: false,
      breakLines: false,
      keepNewlines: true,
      punctuation: "heavy",
      allowEmoji: true,
      allowExclamation: true,
      extras: ["be professional", "use industry terms"],
    };
    const result = buildFormatInstructionsPrompt(options);
    expect(result).toBe(
      "proper capitalization, rich punctuation, emoji allowed, exclamation allowed, be professional, use industry terms"
    );
  });
});
