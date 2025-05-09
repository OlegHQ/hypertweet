import React, { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "./library/card";
import { Button } from "./library/button";
import { Switch } from "./library/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./library/select";
import { Input } from "./library/input";
import { ClipboardCopy } from "lucide-react";
import { motion } from "framer-motion";

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

const defaultOptions: InstructionOptions = {
  lowercase: true,
  breakLines: true,
  keepNewlines: false,
  punctuation: "natural",
  allowEmoji: false,
  allowExclamation: false,
  extras: [],
};

const buildInstructions = (opts: InstructionOptions): string => {
  const parts: string[] = [];

  // casing
  if (opts.lowercase) parts.push("lowercase (except names)");
  else parts.push("preserve casing");

  // line handling
  if (opts.breakLines) parts.push("break lines freely");
  if (!opts.keepNewlines) parts.push("no newlines");

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
};

/* ------------------------------------------------------------------ */
const FormatInstructionBuilder: React.FC = () => {
  const [options, setOptions] = useState<InstructionOptions>(defaultOptions);
  const [extraDraft, setExtraDraft] = useState("");

  const instruction = useMemo(() => buildInstructions(options), [options]);

  const update = useCallback(
    <T extends keyof InstructionOptions>(
      key: T,
      value: InstructionOptions[T]
    ) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const addExtra = () => {
    const v = extraDraft.trim();
    if (!v) return;
    update("extras", [...options.extras, v]);
    setExtraDraft("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid lg:grid-cols-2 gap-6 p-4 max-w-4xl mx-auto"
    >
      {/* CONTROLS */}
      <Card className="rounded-2xl shadow-xl">
        <CardHeader className="font-semibold text-xl">
          formatting knobs
        </CardHeader>
        <CardContent className="space-y-4">
          {/* lowercase */}
          <ToggleRow
            label="force lowercase (except names)"
            value={options.lowercase}
            onChange={(v) => update("lowercase", v)}
          />

          {/* break lines */}
          <ToggleRow
            label="let GPT insert line breaks"
            value={options.breakLines}
            onChange={(v) => update("breakLines", v)}
          />

          {/* keep newlines */}
          <ToggleRow
            label="keep existing newlines"
            value={options.keepNewlines}
            onChange={(v) => update("keepNewlines", v)}
          />

          {/* punctuation density */}
          <div className="space-y-1">
            <span className="text-sm font-medium">punctuation density</span>
            <Select
              value={options.punctuation}
              onValueChange={(v: "minimal" | "natural" | "heavy") => update("punctuation", v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">minimal</SelectItem>
                <SelectItem value="natural">natural</SelectItem>
                <SelectItem value="heavy">heavy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* emoji / exclamation */}
          <ToggleRow
            label="allow emoji"
            value={options.allowEmoji}
            onChange={(v) => update("allowEmoji", v)}
          />
          <ToggleRow
            label="allow exclamation marks"
            value={options.allowExclamation}
            onChange={(v) => update("allowExclamation", v)}
          />

          {/* extras */}
          <div className="space-y-1">
            <label className="text-sm font-medium">extra rules</label>
            <div className="flex gap-2">
              <Input
                value={extraDraft}
                placeholder="e.g. avoid hashtags, first‑person only…"
                onChange={(e) => setExtraDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addExtra();
                  }
                }}
              />
              <Button type="button" onClick={addExtra}>
                add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {options.extras.map((rule) => (
                <span
                  key={rule}
                  className="bg-muted rounded-full px-2 py-0.5 text-xs"
                >
                  {rule}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PREVIEW */}
      <Card className="rounded-2xl shadow-xl flex flex-col">
        <CardHeader className="font-semibold text-xl flex items-center justify-between">
          preview
          <Button
            size="icon"
            variant="secondary"
            onClick={() => navigator.clipboard.writeText(instruction)}
          >
            <ClipboardCopy className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 font-mono text-sm whitespace-pre-wrap flex-1">
          {instruction}
        </CardContent>
      </Card>
    </motion.div>
  );
};

/* --------------- tiny helper sub‑component -------------------------*/
interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}
const ToggleRow: React.FC<ToggleRowProps> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium">{label}</span>
    <Switch checked={value} onCheckedChange={onChange} />
  </div>
);

export default FormatInstructionBuilder;
