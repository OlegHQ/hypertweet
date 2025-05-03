import React from "react";

import { useEffect } from "react";
import { app } from "./app";
import { useGlobalState } from "./state";
import SidebarUI from "./sidebar-ui";
import ProfileSelector from "./profile-selector";

export default function Router() {
  const { selectedProfile } = useGlobalState();

  if (!selectedProfile) {
    return <ProfileSelector />;
  }

  return <pre>A: {JSON.stringify(selectedProfile, null, 2)}</pre>;
}
