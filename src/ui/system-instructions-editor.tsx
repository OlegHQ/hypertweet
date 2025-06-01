import React, { useEffect } from "react";
import { useGlobalState } from "./state";
import { app } from "./app";
import { Card, CardContent, CardHeader } from "./library/card";
import { Button } from "./library/button";
import { Textarea } from "./library/textarea";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Edit2,
  Trash2,
  Save,
  Sparkles,
  AlertTriangle,
  Plus,
  GripVertical,
  MessageSquare,
  List,
  Reply,
  Check,
  X,
} from "lucide-react";
import { ConfigTypeKey } from "src/background-app/domain";
import { Input } from "./library/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./library/select";

interface SystemInstructionsEditorProps {
  selectedProfile: { id: string };
  instructions: string[];
  setInstructions: (instructions: string[]) => void;
  isLoading: boolean;
  setError: (error: string | null) => void;
}

export default function SystemInstructionsEditor({
  selectedProfile,
  instructions,
  setInstructions,
  isLoading,
  setError,
}: SystemInstructionsEditorProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [newInstruction, setNewInstruction] = React.useState("");
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editingText, setEditingText] = React.useState("");

  const handleSave = async () => {
    if (!selectedProfile) return;
    try {
      await app.dataLayer.config.set(
        selectedProfile.id,
        ConfigTypeKey.SYSTEM_INSTRUCTIONS,
        instructions
      );
      setIsEditing(false);
    } catch (error) {
      setError("Failed to save instructions");
      console.error("Error saving instructions:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedProfile) return;
    try {
      await app.dataLayer.config.set(
        selectedProfile.id,
        ConfigTypeKey.SYSTEM_INSTRUCTIONS,
        null
      );
      setInstructions([]);
      setIsEditing(false);
    } catch (error) {
      setError("Failed to delete instructions");
      console.error("Error deleting instructions:", error);
    }
  };

  const handleAddInstruction = () => {
    if (newInstruction.trim()) {
      setInstructions([...instructions, newInstruction.trim()]);
      setNewInstruction("");
    }
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleStartEditing = (index: number) => {
    const instruction = instructions[index];
    if (instruction !== undefined) {
      setEditingIndex(index);
      setEditingText(instruction);
    }
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editingText.trim()) return;
    const newInstructions = [...instructions];
    newInstructions[editingIndex] = editingText.trim();
    setInstructions(newInstructions);
    setEditingIndex(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText("");
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          System Instructions
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Add specific instructions for how the AI should behave and respond.
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newInstruction}
                    onChange={(e) => setNewInstruction(e.target.value)}
                    placeholder="Enter a new instruction..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddInstruction();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddInstruction}
                    disabled={!newInstruction.trim()}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                <Reorder.Group
                  axis="y"
                  values={instructions}
                  onReorder={setInstructions}
                  className="space-y-2"
                >
                  {instructions.map((instruction, index) => (
                    <Reorder.Item
                      key={instruction}
                      value={instruction}
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700"
                    >
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                      {editingIndex === index ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveEdit();
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSaveEdit}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 text-gray-700 dark:text-gray-300">
                            {instruction}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEditing(index)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveInstruction(index)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 min-h-[8rem]">
                {instructions.length > 0 ? (
                  <div className="space-y-2">
                    {instructions.map((instruction, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-gray-500 dark:text-gray-400">
                          {index + 1}.
                        </span>
                        {instruction}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400">
                    No instructions set
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
                {instructions.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
