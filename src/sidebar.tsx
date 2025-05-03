import React from "react";
import { install } from "@twind/core";
import presetAutoprefix from "@twind/preset-autoprefix";
import presetTailwind from "@twind/preset-tailwind";
import { createRoot } from "react-dom/client";
import Router from "./ui/router";
// Initialize Twind
install({
  presets: [presetAutoprefix(), presetTailwind()],
});

// Initialize React
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<Router />);
}
