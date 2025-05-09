import { useEffect, useState } from "react";
import { bgApp } from "./bg-app";
import type { ReplyType } from "../background-app/data";
import ReplyTypeButton from "./reply-type-button";
import { Button } from "./button";
import { typeTweet } from "./type-tweet";

export default function Panel() {
  const [replyTypes, setReplyTypes] = useState<ReplyType[]>([]);

  useEffect(() => {
    async function load() {
      const profileId = await bgApp.system.getCurrentProfileId();
      if (!profileId) {
        console.warn("hypertweet: no profile id");
        return;
      }

      let replyTypes = await bgApp.replyTypes.getAll(profileId);
      replyTypes = replyTypes.filter((x) => !x.isHidden);
      setReplyTypes(replyTypes);
    }
    load();
  }, []);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: "8px" }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          marginTop: "-10px",
          marginBottom: "8px",
          paddingLeft: "16px",
          paddingRight: "16px",
          justifyContent: "center",
        }}
      >
        {replyTypes.map((replyType) => (
          <ReplyTypeButton
            key={replyType.id}
            replyType={replyType}
            disabled={loading}
            onLoading={setLoading}
          />
        ))}
      </div>
    </div>
  );
}
