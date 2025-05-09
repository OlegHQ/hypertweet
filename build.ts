/* bun build script for hypertweet */
import { spawn } from "bun";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// -------------------- CLI FLAGS --------------------
const cli = Bun.argv.slice(2);
const watch = cli.includes("--watch");
const buildAll = cli.includes("--all");
const singleChrome = cli.includes("--chrome");

// decide targets
const targets: ("firefox" | "chrome")[] = buildAll
  ? ["firefox", "chrome"]
  : [singleChrome ? "chrome" : "firefox"];

// -------------------- STATIC HELPERS ---------------
function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writeSidebar(outDir: string) {
  const html =
    `<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head>` +
    `<body><div id=\"root\"></div>` +
    `<script type=\"module\" src=\"sidebar.js\"></script></body></html>`;
  writeFileSync(join(outDir, "sidebar.html"), html);
}

function writeManifest(outDir: string, chrome: boolean) {
  const manifest: Record<string, unknown> = {
    manifest_version: 3,
    name: "hypertweet",
    version: "1.0",
    description:
      "Copies tweets and their replies to the clipboard when clicked.",
    permissions: [
      "activeTab",
      "tabs",
      "scripting",
      "clipboardWrite",
      "sidePanel",
    ],
    host_permissions: ["https://x.com/*", "*://*.linkedin.com/*"],
    background: { service_worker: "background.js" },
    action: { default_title: "hypertweet" },
    side_panel: { default_path: "sidebar.html" },
    sidebar_action: {
      default_icon: { "16": "img/icon-16.png", "48": "img/icon-48.png" },
      default_title: "hypertweet",
      default_panel: "sidebar.html",
      open_at_install: true,
    },
    content_scripts: [
      {
        matches: ["https://x.com/*", "*://*.linkedin.com/*"],
        js: ["content.js"],
      },
    ],
    icons: {
      "16": "img/icon-16.png",
      "48": "img/icon-48.png",
      "128": "img/icon-128.png",
    },
  };

  if (chrome) {
    delete (manifest as any).sidebar_action;
  } else {
    delete (manifest as any).side_panel;
  }

  writeFileSync(
    join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
}

function prepareStatics(outDir: string, chrome: boolean) {
  ensureDir(outDir);
  writeSidebar(outDir);
  writeManifest(outDir, chrome);
}

// -------------------- BUILD FUNC -------------------
async function runBuild(target: "firefox" | "chrome") {
  const outDir = target === "chrome" ? "./out-chrome" : "./out-firefox";
  const isChrome = target === "chrome";

  prepareStatics(outDir, isChrome);

  const bunArgs = [
    "build",
    "--entrypoints",
    "./src/background.ts",
    "--entrypoints",
    "./src/content.ts",
    "--entrypoints",
    "./src/sidebar.tsx",
    "--outdir",
    outDir,
  ];

  if (watch) {
    bunArgs.push("--watch", "--sourcemap=inline");
  }

  console.log(`▶ bun ${bunArgs.join(" ")}`);
  const proc = spawn(["bun", ...bunArgs], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  return proc.exited;
}

// -------------------- MAIN -------------------------
async function main() {
  if (watch) {
    // start all watchers concurrently and never exit
    await Promise.all(targets.map(runBuild));
    await new Promise(() => {}); // keep alive
  } else {
    // sequential builds so log output isn't jumbled
    for (const t of targets) {
      const code = await runBuild(t);
      if (code !== 0) process.exit(code);
    }
    console.log("✅ Build complete");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
