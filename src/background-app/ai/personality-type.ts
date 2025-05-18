export type PersonalityType =
  | "unspecified"
  | "analyst"
  | "motivator"
  | "witty_comedian"
  | "empathetic_friend"
  | "insider_expert"
  | "visionary_leader"
  | "no_nonsense_leader"
  | "sarcastic_leader"
  | "seasoned_pro";

export const PERSONALITY_TYPES: { value: PersonalityType; label: string }[] = [
  { value: "unspecified", label: "Unspecified" },
  { value: "analyst", label: "The Analyst – data-driven, no fluff" },
  { value: "motivator", label: "The Motivator – upbeat, inspirational" },
  { value: "witty_comedian", label: "The Comedian – clever, playful snark" },
  { value: "empathetic_friend", label: "The Empath – supportive, human touch" },
  { value: "insider_expert", label: "The Insider – authoritative, pro tips" },
  {
    value: "visionary_leader",
    label: "The Visionary Leader – bold, future-focused",
  },
  {
    value: "no_nonsense_leader",
    label: "The No-Nonsense Leader – direct, decisive",
  },
  {
    value: "sarcastic_leader",
    label: "The Sarcastic Captain – dry wit + authority",
  },
  {
    value: "seasoned_pro",
    label: "The Seasoned Pro – calm, best-practice guru",
  },
];
