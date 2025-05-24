import { useEffect, useState } from "react";
import { User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "src/ui/library/select";
import { bgApp } from "../bg-app";
import { ConfigTypeKey } from "../../background-app/domain";
import { useLastUsedProfileId } from "./use-last-used-profile-id";
import {
  PERSONALITY_TYPES,
  type PersonalityType,
} from "../../background-app/ai/personality-type";

export default function PersonalityTypeSelector() {
  const [selectedType, setSelectedType] =
    useState<PersonalityType>("unspecified");
  const [isLoading, setIsLoading] = useState(false);
  const lastUsedProfileId = useLastUsedProfileId();

  useEffect(() => {
    if (lastUsedProfileId) {
      loadPersonalityType();
    }
  }, [lastUsedProfileId]);

  const loadPersonalityType = async () => {
    if (!lastUsedProfileId) return;
    try {
      const type = await bgApp.dataLayer.config.get<PersonalityType>(
        lastUsedProfileId,
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
    if (!lastUsedProfileId) return;
    setIsLoading(true);
    try {
      await bgApp.dataLayer.config.set(
        lastUsedProfileId,
        ConfigTypeKey.PERSONALITY_TYPE,
        value as PersonalityType
      );
      setSelectedType(value as PersonalityType);
    } catch (error) {
      console.error("Error saving personality type:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[180px]">
      <div>
        <Select
          value={selectedType}
          onValueChange={handleTypeChange}
          disabled={isLoading}
        >
          <SelectTrigger
            onMouseEnter={() => {
              document.body.style.overflow = "hidden";
            }}
            onMouseLeave={() => {
              document.body.style.overflow = "auto";
            }}
            className="h-7 text-xs border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 px-2"
          >
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-[#1d9bf0]" />
              <SelectValue placeholder="Select type" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {PERSONALITY_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label.replace("The ", "").split(" – ")[0]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
