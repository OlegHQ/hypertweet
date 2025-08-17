import { useEffect, useState } from "react";
import type { ReplyType } from "../../background-app/domain";
import ReplyTypeButton from "./reply-type-button";
import { motion } from "framer-motion";
import { bgApp } from "../bg-app";
import { replyTypesPanelStyles, spacing } from "./styles";

interface ReplyTypesPanelProps {
  mode: "complex" | "simple" | "edit";
}

export default function ReplyTypesPanel({ mode }: ReplyTypesPanelProps) {
  const [replyTypes, setReplyTypes] = useState<ReplyType[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        display: "flex",
        flexDirection: "row",
        gap: spacing[2],
      }}
    >
      <motion.div style={{
        flex: 1,
        display: "flex",
        flexWrap: "wrap",
        gap: spacing[1],
        marginBottom: spacing[2],
        padding: `0 ${spacing[4]}`,
      }}>
        {replyTypes.map((replyType, index) => (
          <motion.div
            key={replyType.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.2,
              delay: index * 0.05,
              ease: "easeOut",
            }}
          >
            <ReplyTypeButton
              replyType={replyType}
              disabled={loading}
              onLoading={setLoading}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
