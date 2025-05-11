import React, { useState } from "react";
import { Layout } from "./layout";
import { PageHeader } from "./page-header";
import { Card, CardContent, CardHeader } from "./library/card";
import { Button } from "./library/button";
import { Input } from "./library/input";
import { Textarea } from "./library/textarea";
import { motion } from "framer-motion";
import { ClipboardCopy, MessageSquare } from "lucide-react";
import { Toast } from "./library/toast";

interface PromptTemplate {
  task: string;
  context: string;
  requirements: string[];
  outputFormat: string;
}

const defaultTemplate: PromptTemplate = {
  task: "",
  context: "",
  requirements: [""],
  outputFormat: "json",
};

export default function ChatGPTPromptsPage() {
  const [template, setTemplate] = useState<PromptTemplate>(defaultTemplate);
  const [showCopied, setShowCopied] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const updateTemplate = <K extends keyof PromptTemplate>(
    key: K,
    value: PromptTemplate[K]
  ) => {
    setTemplate((prev) => ({ ...prev, [key]: value }));
  };

  const addRequirement = () => {
    setTemplate((prev) => ({
      ...prev,
      requirements: [...prev.requirements, ""],
    }));
  };

  const removeRequirement = (index: number) => {
    setTemplate((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setTemplate((prev) => ({
      ...prev,
      requirements: prev.requirements.map((req, i) =>
        i === index ? value : req
      ),
    }));
  };

  const generatePrompt = () => {
    const prompt = {
      task: template.task,
      context: template.context,
      requirements: template.requirements.filter(Boolean),
      outputFormat: template.outputFormat,
    };

    setGeneratedPrompt(JSON.stringify(prompt, null, 2));
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <Layout>
      <PageHeader title="ChatGPT Task Prompts" backRoute="/" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 max-w-3xl mx-auto space-y-6"
      >
        <Card className="rounded-2xl shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Generate Task Prompt
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Create structured prompts for ChatGPT to generate better content
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Task Description
                </label>
                <Textarea
                  value={template.task}
                  onChange={(e) => updateTemplate("task", e.target.value)}
                  placeholder="Describe the main task or goal..."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Context
                </label>
                <Textarea
                  value={template.context}
                  onChange={(e) => updateTemplate("context", e.target.value)}
                  placeholder="Provide relevant context or background information..."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Requirements
                </label>
                <div className="space-y-2 mt-1">
                  {template.requirements.map((req, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={req}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        placeholder={`Requirement ${index + 1}...`}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeRequirement(index)}
                        className="shrink-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addRequirement}
                    className="w-full"
                  >
                    Add Requirement
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Output Format
                </label>
                <Input
                  value={template.outputFormat}
                  onChange={(e) => updateTemplate("outputFormat", e.target.value)}
                  placeholder="json, markdown, etc."
                  className="mt-1"
                />
              </div>
            </div>

            <Button onClick={generatePrompt} className="w-full">
              Generate Prompt
            </Button>
          </CardContent>
        </Card>

        {generatedPrompt && (
          <Card className="rounded-2xl shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Generated Prompt
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2"
                >
                  <ClipboardCopy className="h-4 w-4" />
                  {showCopied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
                <pre className="text-sm font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {generatedPrompt}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </Layout>
  );
} 