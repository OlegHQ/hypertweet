import React, { useEffect, useState } from "react";
import { useGlobalState } from "./state";
import { app } from "./app";
import { Card, CardContent, CardHeader } from "./library/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./library/select";
import { ConfigTypeKey } from "src/background-app/data";
import type { PersonalityType } from "src/background-app/ai/personality-type";

const PERSONALITY_TYPES: { value: PersonalityType; label: string }[] = [
  { value: "unspecified", label: "Unspecified" },
  { value: "leader", label: "The Leader" },
  { value: "reluctant_hero", label: "The Reluctant Hero" },
  { value: "reporter", label: "The Reporter or Crusader" },
  { value: "adventurer", label: "The Adventurer or Crusader" },
];

export default function PersonalityTypeSelector() {
  const { selectedProfile } = useGlobalState();
  const [selectedType, setSelectedType] =
    useState<PersonalityType>("unspecified");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedProfile) {
      loadPersonalityType();
    }
  }, [selectedProfile]);

  const loadPersonalityType = async () => {
    if (!selectedProfile) return;
    try {
      const type = await app.dataLayer.config.get<PersonalityType>(
        selectedProfile.id,
        ConfigTypeKey.PERSONALITY_TYPE
      );
      if (type) {
        setSelectedType(type);
      }
    } catch (error) {
      console.error("Error loading personality type:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeChange = async (value: string) => {
    if (!selectedProfile) return;
    try {
      await app.dataLayer.config.set(
        selectedProfile.id,
        ConfigTypeKey.PERSONALITY_TYPE,
        value as PersonalityType
      );
      setSelectedType(value as PersonalityType);
    } catch (error) {
      console.error("Error saving personality type:", error);
    }
  };

  if (!selectedProfile || isLoading) {
    return null;
  }

  return (
    <Card className="rounded-2xl shadow-xl">
      <CardHeader className="font-semibold text-xl">
        Personality Type
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Choose your primary personality type to help shape your content
            generation style.
          </p>
          <Select value={selectedType} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select personality type" />
            </SelectTrigger>
            <SelectContent>
              {PERSONALITY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
