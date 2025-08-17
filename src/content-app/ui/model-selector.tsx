import { useEffect, useState } from "react";
import { ModelType } from "../../background-app/ai/model-type";
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

export default function ModelSelector() {
  const [selectedModel, setSelectedModel] = useState<ModelType>(
    ModelType.GPT_3_5_TURBO
  );
  const [isLoading, setIsLoading] = useState(false);
  const lastUsedProfileId = useLastUsedProfileId();

  useEffect(() => {
    if (lastUsedProfileId) {
      loadModel();
    }
  }, [lastUsedProfileId]);

  const loadModel = async () => {
    if (!lastUsedProfileId) return;
    try {
      const model = await bgApp.dataLayer.config.get<string>(
        lastUsedProfileId,
        ConfigTypeKey.COMPLETION_MODEL
      );
      if (model) {
        setSelectedModel(model as ModelType);
      }
    } catch (error) {
      console.error("Error loading model:", error);
    }
  };

  const handleModelChange = async (value: string) => {
    if (!lastUsedProfileId) return;
    setIsLoading(true);
    try {
      await bgApp.dataLayer.config.set(
        lastUsedProfileId,
        ConfigTypeKey.COMPLETION_MODEL,
        value
      );
      setSelectedModel(value as ModelType);
    } catch (error) {
      console.error("Error saving model:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: "120px" }}>
      <Select
        value={selectedModel}
        onValueChange={handleModelChange}
        disabled={isLoading}
      >
        <SelectTrigger
          onMouseEnter={() => {
            document.body.style.overflow = "hidden";
          }}
          onMouseLeave={() => {
            document.body.style.overflow = "auto";
          }}
          style={{ height: "28px", fontSize: "12px", border: 0, background: "transparent", padding: "0 8px" }}
        >
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ModelType.GPT_3_5_TURBO}>GPT-3.5</SelectItem>
          <SelectItem value={ModelType.GPT_4O_MINI}>GPT-4o Mini</SelectItem>
          <SelectItem value={ModelType.GPT_4_1_MINI}>GPT-4.1 Mini</SelectItem>
          <SelectItem value={ModelType.GPT_4_1}>GPT-4.1</SelectItem>
          <SelectItem value={ModelType.GPT_4_0}>GPT-4o</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
