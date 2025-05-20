import { useState, useEffect } from "react";
import { ConfigTypeKey } from "src/background-app/domain";
import { bgApp } from "../bg-app";

export function useLastUsedProfileId() {
  const [lastUsedProfileId, setLastUsedProfileId] = useState<string | null>(
    null
  );

  useEffect(() => {
    bgApp.dataLayer.config
      .get<string>(null, ConfigTypeKey.LAST_USED_PROFILE_ID)
      .then((model) => {
        setLastUsedProfileId(model);
      });
  }, []);

  return lastUsedProfileId;
}
