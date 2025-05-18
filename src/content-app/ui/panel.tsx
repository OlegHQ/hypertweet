import { useEffect, useState } from "react";
import type { ReplyType } from "../../background-app/domain";
import ReplyTypeButton from "./reply-type-button";
import { motion } from "framer-motion";
import { useSiteTypeStore } from "./site-type-store";
import { bgApp } from "../bg-app";

export default function Panel({
  siteType: type,
  parent,
}: {
  siteType: "twitter" | "linkedin";
  parent: HTMLElement;
}) {
  const [replyTypes, setReplyTypes] = useState<ReplyType[]>([]);
  const setSiteType = useSiteTypeStore((state) => state.setSiteType);
  const setParent = useSiteTypeStore((state) => state.setParent);
  useEffect(() => {
    setSiteType(type);
    setParent(parent);
  }, [type, setSiteType, setParent, parent]);

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ display: "flex", flexDirection: "row", gap: "8px" }}
    >
      <motion.div
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
