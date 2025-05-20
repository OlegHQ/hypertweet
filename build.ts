/* bun build script for hypertweet */
import { spawn } from "bun";
import {
  mkdirSync,
  writeFileSync,
  existsSync,
  cpSync,
  lstatSync,
} from "node:fs";
import { join } from "node:path";

// -------------------- CLI FLAGS --------------------
const cli = Bun.argv.slice(2);
const watch = cli.includes("--watch");
const buildAll = cli.includes("--all");
const singleChrome = cli.includes("--chrome");

// determine targets
const targets: ("firefox" | "chrome")[] = buildAll
  ? ["firefox", "chrome"]
  : [singleChrome ? "chrome" : "firefox"];

// -------------------- UTILITIES --------------------
function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function copyImages(outDir: string) {
  const srcImg = "./img";
  if (!existsSync(srcImg) || !lstatSync(srcImg).isDirectory()) return;
  const destImg = join(outDir, "img");
  ensureDir(destImg);
  // Node 16+ cpSync supports recursive copy
  cpSync(srcImg, destImg, { recursive: true });
}

function writeHtml(outDir: string, filename: string) {
  const html =
    `<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head>` +
    `<body><div id=\"root\"></div>` +
    `<script type=\"module\" src=\"${filename}.js\"></script></body></html>`;
  writeFileSync(join(outDir, filename + ".html"), html);
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
    background: {
      service_worker: "background.js",
      scripts: ["background.js"],
    },
    action: { default_title: "hypertweet" },
    side_panel: { default_path: "sidebar.html" },
    sidebar_action: {
      default_icon: { "16": "img/icon-16.png", "48": "img/icon-48.png" },
      default_title: "hypertweet",
      default_panel: "sidebar.html",
      open_at_install: true,
    },
    web_accessible_resources: [
      {
        resources: ["debugging.html"],
        matches: ["<all_urls>"],
      },
    ],
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
    delete (manifest as any).background.scripts;
  } else {
    delete (manifest as any).side_panel;
    delete (manifest as any).background.service_worker;
    manifest.permissions = Array.from(
      (() => {
        const x = new Set((manifest as any).permissions ?? []);
        x.delete("sidePanel");
        return x;
      })()
    );
  }

  writeFileSync(
    join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
}

function prepareStatics(outDir: string, chrome: boolean) {
  ensureDir(outDir);
  writeHtml(outDir, "sidebar");
  writeHtml(outDir, "debugging");
  writeManifest(outDir, chrome);
  copyImages(outDir);
}

// -------------------- BUILD FUNCTION --------------------
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
    "--entrypoints",
    "./src/debugging.tsx",
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

// -------------------- MAIN --------------------
async function main() {
  if (watch) {
    // parallel watch builds
    await Promise.all(targets.map(runBuild));
    await new Promise(() => {}); // keep process alive
  } else {
    // sequential one-off builds
    for (const target of targets) {
      const code = await runBuild(target);
      if (code !== 0) process.exit(code);
    }
    console.log("✅ Build complete");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
