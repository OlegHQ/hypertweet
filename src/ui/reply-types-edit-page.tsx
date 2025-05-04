import { useEffect, useState } from "react";
import { Layout } from "./layout";
import { useGlobalState } from "./state";
import { app } from "./app";

export default function ReplyTypeEditPage() {
  const { currentRoute, setCurrentRoute, selectedProfile } = useGlobalState();
  const id = currentRoute.split("/").pop();
  useEffect(() => {
    app.replyTypes.getReplyType(selectedProfile?.id!, id!);
  }, [id, setCurrentRoute]);

  return (
    <Layout>
      <div>ReplyTypeEditPage</div>
    </Layout>
  );
}
