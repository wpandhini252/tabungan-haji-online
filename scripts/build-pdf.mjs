// Generate docs/Tabungan-Haji-API.pdf from README.md.
// Pipeline: Markdown -> HTML (marked) -> PDF (headless Google Chrome).
// Usage: npm run docs:pdf

import { readFileSync, writeFileSync, rmSync, mkdtempSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = join(root, "README.md");
const outPdf = join(root, "docs", "Tabungan-Haji-API.pdf");

function findChrome() {
  const candidates =
    process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ]
      : process.platform === "win32"
        ? [
            "C:/Program Files/Google/Chrome/Application/chrome.exe",
            "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
          ]
        : ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"];
  for (const c of candidates) {
    if (c.includes("/") || c.includes("\\")) {
      if (existsSync(c)) return c;
    } else {
      return c; // rely on PATH lookup
    }
  }
  throw new Error("Google Chrome / Chromium tidak ditemukan. Pasang Chrome untuk membuat PDF.");
}

const css = `
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 11px; line-height: 1.55; color: #1a1a1a; margin: 0;
  }
  h1, h2, h3, h4 { color: #0f3d2e; line-height: 1.25; margin: 1.4em 0 0.5em; }
  h1 { font-size: 26px; border-bottom: 3px solid #0f3d2e; padding-bottom: 8px; }
  h2 { font-size: 19px; border-bottom: 1px solid #cdd8d2; padding-bottom: 4px; margin-top: 1.8em; }
  h3 { font-size: 15px; }
  h4 { font-size: 13px; }
  a { color: #126b4f; text-decoration: none; }
  p { margin: 0.5em 0; }
  code {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 0.88em; background: #eef3f1; padding: 1px 4px; border-radius: 3px;
  }
  pre {
    background: #0f1f1a; color: #e7f0ec; padding: 12px 14px; border-radius: 6px;
    overflow-x: auto; font-size: 10px; line-height: 1.45;
  }
  pre code { background: none; color: inherit; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 10px; }
  th, td { border: 1px solid #c9d4cf; padding: 5px 8px; text-align: left; vertical-align: top; }
  th { background: #e7f0ec; color: #0f3d2e; }
  tr:nth-child(even) td { background: #f6faf8; }
  blockquote {
    margin: 0.8em 0; padding: 6px 14px; border-left: 4px solid #2e9e78;
    background: #f1f8f5; color: #2b3a34;
  }
  ul, ol { margin: 0.5em 0; padding-left: 1.4em; }
  h2 { page-break-after: avoid; }
  pre, table, blockquote { page-break-inside: avoid; }
`;

marked.setOptions({ gfm: true, breaks: false });
const bodyHtml = marked.parse(readFileSync(readmePath, "utf8"));
const html = `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>Tabungan Haji API — Dokumentasi</title><style>${css}</style></head>
<body>${bodyHtml}</body></html>`;

// Temp HTML + Chrome profile live in the OS temp dir, never inside the repo,
// so a build artifact can't accidentally be tracked/committed.
const chrome = findChrome();
const workDir = mkdtempSync(join(tmpdir(), "thaji-pdf-"));
const tmpHtml = join(workDir, "readme.html");
writeFileSync(tmpHtml, html);
try {
  execFileSync(
    chrome,
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--timeout=60000",
      `--user-data-dir=${join(workDir, "profile")}`,
      "--no-pdf-header-footer",
      `--print-to-pdf=${outPdf}`,
      tmpHtml,
    ],
    { stdio: "inherit", timeout: 120000 },
  );
  console.log(`PDF dibuat: ${outPdf}`);
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
