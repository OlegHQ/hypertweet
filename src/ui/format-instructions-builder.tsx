import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "./library/card";
import { Button } from "./library/button";
import { CompactSwitch } from "./library/compact-switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./library/select";
import { Input } from "./library/input";
import { motion } from "framer-motion";

import { app } from "./app";
import { Plus, X } from "lucide-react";
import { ConfigTypeKey } from "src/background-app/data";
import { useGlobalState } from "./state";
import type { InstructionOptions } from "src/background-app/ai/format-instructions";

const FormatInstructionBuilder: React.FC = () => {
  const [options, setOptions] = useState<InstructionOptions | null>(null);
  const [extraDraft, setExtraDraft] = useState("");
  const { selectedProfile } = useGlobalState();
  const [instruction, setInstruction] = useState("");

  // Load saved options when component mounts or profile changes
  useEffect(() => {
    if (!selectedProfile?.id) {
      return;
    }
    const loadSavedOptions = async () => {
      try {
        const savedInstruction = await app.ai.getFormatInstructionOptions(
          selectedProfile.id
        );
        setOptions(savedInstruction);
      } catch (error) {
        console.error("Error loading format instructions:", error);
      }
    };
    loadSavedOptions();
  }, [selectedProfile?.id]);

  useEffect(() => {
    if (!selectedProfile?.id || !options) {
      return;
    }
    app.ai.buildFormatInstructionsPrompt(options).then(async (instruction) => {
      setInstruction(instruction);
      await app.dataLayer.config.set(
        selectedProfile?.id,
        ConfigTypeKey.FORMAT_INSTRUCTIONS,
        options
      );
    });
  }, [options, selectedProfile?.id]);

  const update = useCallback(
    <T extends keyof InstructionOptions>(
      key: T,
      value: InstructionOptions[T]
    ) => {
      setOptions((prev) => {
        if (!prev) {
          return null;
        }
        return { ...prev, [key]: value };
      });
    },
    []
  );

  const addExtra = () => {
    const v = extraDraft.trim();
    if (!v) return;
    update("extras", [...(options?.extras ?? []), v]);
    setExtraDraft("");
  };

  const removeExtra = (index: number) => {
    update("extras", options?.extras?.filter((_, i) => i !== index) ?? []);
  };

  if (!options) {
    return null;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 max-w-3xl mx-auto"
    >
      <Card className="rounded-2xl shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Format Instructions
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Customize how your replies are formatted
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Preview */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
              <pre className="text-sm font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {instruction}
              </pre>
            </div>

            {/* Settings */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Text Style */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Text Style
                </h3>
                <div className="flex flex-wrap gap-2">
                  <CompactSwitch
                    label="Lowercase"
                    checked={options.lowercase}
                    onCheckedChange={(v) => update("lowercase", v)}
                  />
                  <CompactSwitch
                    label="Line Breaks"
                    checked={options.breakLines}
                    onCheckedChange={(v) => update("breakLines", v)}
                  />
                  <CompactSwitch
                    label="Keep Newlines"
                    checked={options.keepNewlines}
                    onCheckedChange={(v) => update("keepNewlines", v)}
                  />
                </div>
              </div>

              {/* Punctuation & Emoji */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Punctuation & Emoji
                </h3>
                <div className="space-y-3">
                  <Select
                    value={options.punctuation}
                    onValueChange={(v: "minimal" | "natural" | "heavy") =>
                      update("punctuation", v)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select density" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="natural">Natural</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2">
                    <CompactSwitch
                      label="Exclamation"
                      checked={options.allowExclamation}
                      onCheckedChange={(v) => update("allowExclamation", v)}
                    />
                    <CompactSwitch
                      label="Emoji"
                      checked={options.allowEmoji}
                      onCheckedChange={(v) => update("allowEmoji", v)}
                    />
                  </div>
                </div>
              </div>

              {/* Extra Rules */}
              <div className="space-y-3 sm:col-span-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Extra Rules
                </h3>
                <div className="space-y-3">
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
                    <Button type="button" onClick={addExtra} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {options.extras.map((rule, index) => (
                      <div
                        key={rule}
                        className="group flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-sm"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {rule}
                        </span>
                        <button
                          onClick={() => removeExtra(index)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FormatInstructionBuilder;
