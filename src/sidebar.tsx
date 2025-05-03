import React from "react";
import { install } from "@twind/core";
import presetAutoprefix from "@twind/preset-autoprefix";
import presetTailwind from "@twind/preset-tailwind";
import { createRoot } from 'react-dom/client';
import SidebarUI from "./ui/sidebar-ui";

// Initialize Twind
install({
  presets: [presetAutoprefix(), presetTailwind()],
});

// Initialize React
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<SidebarUI />);
}
