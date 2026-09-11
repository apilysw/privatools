import { marked } from "marked";
import * as yaml from "js-yaml";
import Papa from "papaparse";

export interface MarkdownParseResult {
  html: string;
  frontmatter: Record<string, unknown> | null;
  rawFrontmatter: string;
  cleanMarkdown: string;
  frontmatterError: string | null;
}

export interface DocStats {
  words: number;
  charsWithSpaces: number;
  charsWithoutSpaces: number;
  lines: number;
  readingTimeMinutes: number;
  headingsCount: number;
  tablesCount: number;
  codeBlocksCount: number;
  taskItemsCount: number;
  completedTasksCount: number;
}

export interface HeadingItem {
  level: number;
  text: string;
  id: string;
}

export interface MarkdownPreset {
  id: string;
  name: string;
  description: string;
  content: string;
}

// Client-side HTML sanitization with DOMPurify
export function sanitizeHtml(rawHtml: string): string {
  if (typeof window === "undefined") {
    return rawHtml;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require("dompurify");
  const purify = typeof DOMPurify.sanitize === "function" ? DOMPurify : DOMPurify(window);
  return purify.sanitize(rawHtml, {
    ADD_ATTR: ["target", "rel", "class", "id", "checked", "disabled", "type"],
    ADD_TAGS: ["input"],
  });
}

// Configure marked with GFM options
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Parses Markdown source text, extracting YAML frontmatter,
 * rendering GFM with callout alerts, and sanitizing output HTML.
 */
export function parseMarkdown(source: string): MarkdownParseResult {
  let rawFrontmatter = "";
  let frontmatter: Record<string, unknown> | null = null;
  let frontmatterError: string | null = null;
  let cleanMarkdown = source;

  // Extract YAML frontmatter if delimited by --- or +++
  const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (frontmatterMatch) {
    rawFrontmatter = frontmatterMatch[1];
    cleanMarkdown = source.slice(frontmatterMatch[0].length);
    try {
      const parsed = yaml.load(rawFrontmatter);
      if (typeof parsed === "object" && parsed !== null) {
        frontmatter = parsed as Record<string, unknown>;
      } else {
        frontmatter = { value: parsed };
      }
    } catch (err: unknown) {
      frontmatterError = err instanceof Error ? err.message : String(err);
    }
  }

  // Compile markdown to HTML synchronously
  let html = marked.parse(cleanMarkdown) as string;

  // Enhance GitHub-style Callout Alerts: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
  html = html.replace(
    /<blockquote>\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br\s*\/?>)?([\s\S]*?)<\/blockquote>/gi,
    (_match, type: string, content: string) => {
      const alertType = type.toUpperCase();
      const alertClass = `alert-${alertType.toLowerCase()}`;
      return `<div class="markdown-alert ${alertClass}"><div class="markdown-alert-header"><span class="markdown-alert-type">${alertType}</span></div><div class="markdown-alert-content"><p>${content.trim()}</div></div>`;
    }
  );

  // Sanitize compiled HTML for zero-vulnerability rendering
  const sanitized = sanitizeHtml(html);

  return {
    html: sanitized,
    frontmatter,
    rawFrontmatter,
    cleanMarkdown,
    frontmatterError,
  };
}

/**
 * Calculates comprehensive document statistics (words, characters, reading time, counts).
 */
export function calculateDocStats(source: string): DocStats {
  const lines = source.length > 0 ? source.split(/\r\n|\r|\n/).length : 0;
  const charsWithSpaces = source.length;
  const charsWithoutSpaces = source.replace(/\s/g, "").length;

  // Strip markdown formatting for accurate word count
  const plainText = source
    .replace(/^---[\s\S]*?---/g, "") // remove frontmatter
    .replace(/```[\s\S]*?```/g, "") // remove code fences
    .replace(/`([^`]+)`/g, "$1") // remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, "") // remove images
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // remove link syntax
    .replace(/<[^>]+>/g, "") // remove html tags
    .replace(/[#*_~`>[\]()|=-]/g, " ") // replace md punctuation with spaces
    .trim();

  const words = plainText.length > 0 ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  // Count structure elements
  const headingsCount = (source.match(/^#{1,6}\s+[^\r\n]+/gm) || []).length;
  const tablesCount = (source.match(/^\|(?:\s*:?-+:?\s*\|)+\s*$/gm) || []).length;
  const codeBlocksCount = (source.match(/^```[\s\S]*?```/gm) || []).length;
  const taskItems = source.match(/^(\s*[-*+]\s+\[[ xX]\])/gm) || [];
  const completedTaskItems = source.match(/^(\s*[-*+]\s+\[[xX]\])/gm) || [];

  return {
    words,
    charsWithSpaces,
    charsWithoutSpaces,
    lines,
    readingTimeMinutes,
    headingsCount,
    tablesCount,
    codeBlocksCount,
    taskItemsCount: taskItems.length,
    completedTasksCount: completedTaskItems.length,
  };
}

/**
 * Extracts Table of Contents outline headings (H1-H6).
 */
export function extractHeadingsOutline(source: string): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const lines = source.split(/\r\n|\r|\n/);

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim().replace(/[#*_~`]/g, "");
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      headings.push({ level, text, id });
    }
  }

  return headings;
}

/**
 * Converts raw CSV / TSV clipboard or file content into a neatly formatted Markdown table.
 */
export function csvToMarkdownTable(
  csvContent: string,
  alignments?: ("left" | "center" | "right")[]
): string {
  const parsed = Papa.parse<string[]>(csvContent.trim(), {
    skipEmptyLines: true,
  });

  if (!parsed.data || parsed.data.length === 0) {
    return "";
  }

  const rows = parsed.data;
  const numCols = Math.max(...rows.map((r) => r.length));

  // Calculate maximum column widths
  const colWidths = new Array(numCols).fill(3);
  for (const row of rows) {
    for (let c = 0; c < numCols; c++) {
      const cellVal = (row[c] || "").trim();
      if (cellVal.length > colWidths[c]) {
        colWidths[c] = cellVal.length;
      }
    }
  }

  const outputLines: string[] = [];

  // Header row
  const headerRow = rows[0] || [];
  const formattedHeaders = colWidths.map((w, i) => (headerRow[i] || `Col ${i + 1}`).trim().padEnd(w));
  outputLines.push(`| ${formattedHeaders.join(" | ")} |`);

  // Delimiter row with alignment
  const delimiterRow = colWidths.map((w, i) => {
    const align = alignments?.[i] || "left";
    if (align === "center") {
      return `:${"-".repeat(Math.max(1, w - 2))}:`;
    } else if (align === "right") {
      return `${"-".repeat(Math.max(2, w - 1))}:`;
    } else {
      return `:${"-".repeat(Math.max(2, w - 1))}`;
    }
  });
  outputLines.push(`| ${delimiterRow.join(" | ")} |`);

  // Data rows
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const formattedCells = colWidths.map((w, c) => (row[c] || "").trim().padEnd(w));
    outputLines.push(`| ${formattedCells.join(" | ")} |`);
  }

  return outputLines.join("\n");
}

/**
 * Prettifies / aligns unpadded Markdown table columns.
 */
export function formatMarkdownTable(tableMarkdown: string): string {
  const lines = tableMarkdown.trim().split(/\r\n|\r|\n/);
  const parsedRows: string[][] = [];
  const alignments: ("left" | "center" | "right")[] = [];

  let delimiterIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|") && !line.includes("|")) continue;

    // Split cells by pipe
    const rawCells = line.split("|");
    // Drop first and last empty elements caused by leading/trailing pipes
    if (line.startsWith("|")) rawCells.shift();
    if (line.endsWith("|")) rawCells.pop();

    const cells = rawCells.map((c) => c.trim());

    // Check if this is the separator row
    const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));
    if (isSeparator && delimiterIndex === -1) {
      delimiterIndex = parsedRows.length;
      for (const c of cells) {
        if (c.startsWith(":") && c.endsWith(":")) {
          alignments.push("center");
        } else if (c.endsWith(":")) {
          alignments.push("right");
        } else {
          alignments.push("left");
        }
      }
    }
    parsedRows.push(cells);
  }

  if (parsedRows.length === 0) return tableMarkdown;

  const numCols = Math.max(...parsedRows.map((r) => r.length));
  const colWidths = new Array(numCols).fill(3);

  for (let r = 0; r < parsedRows.length; r++) {
    if (r === delimiterIndex) continue;
    for (let c = 0; c < numCols; c++) {
      const cell = parsedRows[r][c] || "";
      if (cell.length > colWidths[c]) {
        colWidths[c] = cell.length;
      }
    }
  }

  const resultLines: string[] = [];
  for (let r = 0; r < parsedRows.length; r++) {
    if (r === delimiterIndex) {
      const sep = colWidths.map((w, c) => {
        const align = alignments[c] || "left";
        if (align === "center") return `:${"-".repeat(Math.max(1, w - 2))}:`;
        if (align === "right") return `${"-".repeat(Math.max(2, w - 1))}:`;
        return `:${"-".repeat(Math.max(2, w - 1))}`;
      });
      resultLines.push(`| ${sep.join(" | ")} |`);
    } else {
      const cells = colWidths.map((w, c) => {
        const val = parsedRows[r][c] || "";
        const align = alignments[c] || "left";
        if (align === "right") return val.padStart(w);
        if (align === "center") {
          const padTotal = w - val.length;
          const padLeft = Math.floor(padTotal / 2);
          const padRight = padTotal - padLeft;
          return " ".repeat(padLeft) + val + " ".repeat(padRight);
        }
        return val.padEnd(w);
      });
      resultLines.push(`| ${cells.join(" | ")} |`);
    }
  }

  return resultLines.join("\n");
}

/**
 * Converts a Markdown table into standard CSV format.
 */
export function markdownTableToCsv(markdownTable: string): string {
  const lines = markdownTable.trim().split(/\r\n|\r|\n/);
  const rows: string[][] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.includes("|")) continue;

    const rawCells = trimmed.split("|");
    if (trimmed.startsWith("|")) rawCells.shift();
    if (trimmed.endsWith("|")) rawCells.pop();

    const cells = rawCells.map((c) => c.trim());
    // Skip delimiter row
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;

    rows.push(cells);
  }

  return Papa.unparse(rows);
}

/**
 * Converts rich HTML content into standard Markdown format client-side.
 */
export function htmlToMarkdown(htmlString: string): string {
  if (typeof window === "undefined") return htmlString;

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();
    const childrenText = Array.from(el.childNodes).map(processNode).join("");

    switch (tagName) {
      case "h1":
        return `\n\n# ${childrenText.trim()}\n\n`;
      case "h2":
        return `\n\n## ${childrenText.trim()}\n\n`;
      case "h3":
        return `\n\n### ${childrenText.trim()}\n\n`;
      case "h4":
        return `\n\n#### ${childrenText.trim()}\n\n`;
      case "h5":
        return `\n\n##### ${childrenText.trim()}\n\n`;
      case "h6":
        return `\n\n###### ${childrenText.trim()}\n\n`;
      case "p":
        return `\n\n${childrenText.trim()}\n\n`;
      case "strong":
      case "b":
        return `**${childrenText}**`;
      case "em":
      case "i":
        return `*${childrenText}*`;
      case "del":
      case "s":
      case "strike":
        return `~~${childrenText}~~`;
      case "code": {
        if (el.parentElement?.tagName.toLowerCase() === "pre") {
          return childrenText;
        }
        return `\`${childrenText}\``;
      }
      case "pre": {
        const codeEl = el.querySelector("code");
        const codeText = codeEl ? codeEl.textContent || "" : childrenText;
        const langMatch = (codeEl?.className || "").match(/language-(\w+)/);
        const lang = langMatch ? langMatch[1] : "";
        return `\n\n\`\`\`${lang}\n${codeText.trim()}\n\`\`\`\n\n`;
      }
      case "blockquote":
        return `\n\n> ${childrenText.trim().replace(/\n/g, "\n> ")}\n\n`;
      case "ul": {
        const items = Array.from(el.children).map((li) => {
          const taskCheck = li.querySelector("input[type='checkbox']");
          if (taskCheck) {
            const isChecked = (taskCheck as HTMLInputElement).checked;
            const textWithoutInput = Array.from(li.childNodes)
              .filter((n) => n !== taskCheck)
              .map(processNode)
              .join("")
              .trim();
            return `- [${isChecked ? "x" : " "}] ${textWithoutInput}`;
          }
          return `- ${Array.from(li.childNodes).map(processNode).join("").trim()}`;
        });
        return `\n\n${items.join("\n")}\n\n`;
      }
      case "ol": {
        const items = Array.from(el.children).map((li, idx) => {
          return `${idx + 1}. ${Array.from(li.childNodes).map(processNode).join("").trim()}`;
        });
        return `\n\n${items.join("\n")}\n\n`;
      }
      case "a": {
        const href = el.getAttribute("href") || "#";
        const title = el.getAttribute("title");
        return `[${childrenText.trim()}](${href}${title ? ` "${title}"` : ""})`;
      }
      case "img": {
        const src = el.getAttribute("src") || "";
        const alt = el.getAttribute("alt") || "";
        return `![${alt}](${src})`;
      }
      case "hr":
        return `\n\n---\n\n`;
      case "br":
        return `  \n`;
      case "table": {
        const rows: string[][] = [];
        const tableRows = el.querySelectorAll("tr");
        tableRows.forEach((tr) => {
          const cells = Array.from(tr.querySelectorAll("th, td")).map((c) =>
            (c.textContent || "").trim()
          );
          if (cells.length > 0) rows.push(cells);
        });
        if (rows.length === 0) return "";
        const csv = Papa.unparse(rows);
        return `\n\n${csvToMarkdownTable(csv)}\n\n`;
      }
      default:
        return childrenText;
    }
  }

  const result = processNode(doc.body);
  // Clean up excess consecutive newlines
  return result.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Generates a standalone, self-contained HTML document with embedded CSS.
 */
export function generateStandaloneHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "Markdown Document"}</title>
  <style>
    :root {
      --bg: #ffffff;
      --text: #171717;
      --muted: #737373;
      --border: #e5e5e5;
      --code-bg: #f5f5f5;
      --accent: #10b981;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #09090b;
        --text: #f4f4f5;
        --muted: #a1a1aa;
        --border: #27272a;
        --code-bg: #18181b;
        --accent: #34d399;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.65;
      color: var(--text);
      background-color: var(--bg);
      margin: 0;
      padding: 2.5rem 1rem;
    }
    .markdown-container {
      max-width: 52rem;
      margin: 0 auto;
    }
    h1, h2, h3, h4, h5, h6 {
      color: var(--text);
      font-weight: 700;
      line-height: 1.25;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    h1 { font-size: 2.25rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    h2 { font-size: 1.65rem; border-bottom: 1px solid var(--border); padding-bottom: 0.35rem; }
    h3 { font-size: 1.3rem; }
    p, ul, ol, blockquote, table, pre {
      margin-top: 0;
      margin-bottom: 1.25rem;
    }
    a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875em;
      background: var(--code-bg);
      padding: 0.2em 0.4em;
      border-radius: 4px;
      border: 1px solid var(--border);
    }
    pre {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
    }
    pre code { background: transparent; padding: 0; border: none; }
    blockquote {
      border-left: 4px solid var(--accent);
      padding-left: 1rem;
      color: var(--muted);
      margin-left: 0;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 0.6rem 0.85rem;
      text-align: left;
    }
    th { background: var(--code-bg); font-weight: 600; }
    hr {
      border: 0;
      height: 1px;
      background: var(--border);
      margin: 2rem 0;
    }
    .markdown-alert {
      border-left: 4px solid;
      border-radius: 0 8px 8px 0;
      padding: 0.85rem 1.15rem;
      margin-bottom: 1.25rem;
      background: var(--code-bg);
    }
    .alert-note { border-color: #3b82f6; }
    .alert-tip { border-color: #10b981; }
    .alert-important { border-color: #8b5cf6; }
    .alert-warning { border-color: #f59e0b; }
    .alert-caution { border-color: #ef4444; }
    .markdown-alert-header {
      font-weight: 700;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.35rem;
    }
    .alert-note .markdown-alert-header { color: #3b82f6; }
    .alert-tip .markdown-alert-header { color: #10b981; }
    .alert-important .markdown-alert-header { color: #8b5cf6; }
    .alert-warning .markdown-alert-header { color: #f59e0b; }
    .alert-caution .markdown-alert-header { color: #ef4444; }
  </style>
</head>
<body>
  <div class="markdown-container">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

// Sample Markdown Presets
export const MARKDOWN_PRESETS: MarkdownPreset[] = [
  {
    id: "rfc-architecture",
    name: "Technical RFC / Spec",
    description: "Architecture Request for Comments document with frontmatter, callout alerts, code blocks, and checklist.",
    content: `---
title: "RFC-104: Zero-Egress In-Browser Data Pipeline"
status: "APPROVED"
author: "Engineering Architecture Board"
created: "2026-09-11"
version: "1.4.0"
tags:
  - architecture
  - security
  - privacy
  - wasm
---

# RFC-104: Zero-Egress In-Browser Data Pipeline

## 1. Executive Summary

This RFC establishes architectural standards for executing customer data processing entirely within the browser client sandbox. Under this model, proprietary secrets, medical records, and financial tokens never cross the network perimeter.

> [!IMPORTANT]
> Zero-knowledge guarantees must be strictly verifiable through client-side browser developer tools. No network requests may be initiated when parsing user inputs.

## 2. Core Tenets

1. **Local-First Execution:** SQLite WebAssembly, Canvas, and Web Crypto handle all computation in local RAM.
2. **Deterministic Outputs:** Transformations must be reproducible across Chromium, WebKit, and Gecko engines.
3. **No Third-Party Telemetry:** No analytics scripts, remote fonts, or CDN bundles loaded dynamically at runtime.

> [!TIP]
> Use \`WebAssembly.instantiateStreaming\` where supported to compile in-memory engines concurrently with asset fetches.

## 3. Architecture Specification

\`\`\`
+-------------------------------------------------------------+
|                 Browser Execution Sandbox                   |
|                                                             |
|  +--------------------+             +--------------------+  |
|  |   User Dropzone    |             |  WebAssembly Engine|  |
|  |  (Local File/Blob) | ----------> |   (SQLite / V8)    |  |
|  +--------------------+             +--------------------+  |
|                                                |            |
|                                                v            |
|  +--------------------+             +--------------------+  |
|  |   Export Blob      | <---------- | In-Memory Transform|  |
|  |  (CSV / JSON / DB) |             | (Zero Network I/O) |  |
|  +--------------------+             +--------------------+  |
+-------------------------------------------------------------+
\`\`\`

## 4. Performance Benchmarks

| Component | Dataset Size | Execution Time (ms) | Memory Peak (MB) |
| :--- | :---: | :---: | ---: |
| SQLite WASM Engine | 50,000 rows | 48 ms | 14.2 MB |
| Cryptographic Hasher | 100 MB file | 120 ms | 4.8 MB |
| Barcode Vectorizer | 1,000 labels | 82 ms | 9.1 MB |
| Diff Match Engine | 20,000 lines | 35 ms | 6.5 MB |

> [!WARNING]
> Processing files exceeding 500 MB in 32-bit browser environments may exceed heap limits. Use chunked ArrayBuffer streaming for large payloads.

## 5. Implementation Checklist

- [x] Integrate WebAssembly SQLite runtime with browser virtual filesystem
- [x] Implement Web Crypto SHA-256 and HMAC hardware acceleration
- [x] Configure Content Security Policy (\`connect-src 'none'\`)
- [ ] Add WebGPU acceleration for neural tensor decoding
- [ ] Publish automated verification test harness
`,
  },
  {
    id: "release-notes",
    name: "Release Notes & Changelog",
    description: "Semantic versioning release announcement with highlights, breaking changes, and contributor acknowledgments.",
    content: `---
version: "2.4.0"
date: "2026-09-11"
codename: "Quantum Vault"
type: "minor"
stability: "stable"
---

# Release Notes: Privatools v2.4.0 (Quantum Vault)

We are thrilled to announce **Privatools v2.4.0**, introducing the **Offline QR Code & Barcode Studio**, **Regex Workbench**, and our complete **Markdown Documentation Studio**.

## Highlights

* **12+ Barcode Symbologies:** Full support for GS1-128 (SSCC), ITF-14, Code 128, Data Matrix, PDF417, and QR codes.
* **Vector SVG & 300 DPI Export:** Crisp, print-ready barcodes for logistics and warehousing label printers.
* **Zero Egress Verification:** Complete privacy audit guide with instructions to verify network isolation.

> [!WARNING]
> **Breaking Change:** Deprecated \`exportAsRasterPng\` parameter \`quality\` in favor of explicit \`dpi\` resolution scale. Please update your custom print presets.

## Changelog

### 🚀 Features & Enhancements
- Added Client-Side Regex Workbench with live match highlighting and named capture groups.
- Implemented multi-code batch sheet printer with custom column grid layouts.
- Added support for Web Crypto RS256 signature verification in JWT Inspector.

### 🐛 Bug Fixes
- Resolved SVG viewport dimension collapse in Flexbox wrappers on Chrome 132+.
- Fixed vertical alignment of \`Clear Input\` buttons across all tool sample preset bars.
- Prevented canvas redraw flickering during rapid slider scrubbing in Image Lab.

## Contributor Recognition

Special thanks to our open source privacy champions who contributed to this milestone:
* **@gareth** - Barcode batch generator and GS1 AI parser
* **@alex-sec** - Web Crypto signature verification tests
* **@elena-dev** - SQLite WASM memory leak profiling
`,
  },
  {
    id: "api-spec",
    name: "API Documentation Spec",
    description: "REST & RPC API documentation with authentication headers, endpoints, parameter tables, and JSON payloads.",
    content: `---
title: "Vault Key Management API"
version: "v1.2.0"
baseUrl: "https://api.internal.network/v1"
authScheme: "Bearer <JWT>"
protocol: "HTTPS / TLS 1.3"
---

# Vault Key Management API Specification

## 1. Authentication

All requests to the Vault API must include an authorized JSON Web Token in the \`Authorization\` header:

\`\`\`http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

> [!NOTE]
> Tokens expire 60 minutes after issuance. Rotate tokens using the \`/auth/refresh\` endpoint before expiration.

## 2. Endpoints

### \`POST /vault/keys/derive\`

Derives a hardware-isolated symmetric key using PBKDF2 with SHA-512 and salt.

#### Request Parameters

| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| \`passphrase\` | string | **Yes** | Master passphrase (min 16 characters) |
| \`salt\` | string | **Yes** | Hex-encoded cryptographic salt (min 32 chars) |
| \`iterations\` | integer | No | Iteration rounds (default: \`100,000\`, min: \`50,000\`) |
| \`keyLength\` | integer | No | Derived key size in bits (default: \`256\`) |

#### Sample Request

\`\`\`json
{
  "passphrase": "correct-horse-battery-staple",
  "salt": "a4f891b2c3d4e5f60718293a4b5c6d7e",
  "iterations": 100000,
  "keyLength": 256
}
\`\`\`

#### Sample Response (\`200 OK\`)

\`\`\`json
{
  "status": "success",
  "keyId": "key_9f81a7b0c2",
  "derivedKeyHex": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "algorithm": "PBKDF2-HMAC-SHA512",
  "createdAt": "2026-09-11T22:00:00Z"
}
\`\`\`

## 3. Status Codes

| Code | Status | Meaning |
| :---: | :--- | :--- |
| **200** | OK | Key derivation completed successfully. |
| **400** | Bad Request | Invalid parameter types or insufficient salt entropy. |
| **401** | Unauthorized | Missing or expired Bearer token. |
| **429** | Too Many Requests | Rate limit exceeded (100 req/min per IP). |
`,
  },
  {
    id: "github-readme",
    name: "GitHub Project README",
    description: "Standard open-source project README template with badges, quick start, directory structure, and license.",
    content: `# 🛡️ Privatools: Zero-Egress Developer Utilities

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.4-black.svg)](https://nextjs.org)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org)
[![Zero Egress](https://img.shields.io/badge/Security-Zero_Egress-10b981.svg)](#zero-knowledge-guarantee)

**Privatools** is a modern suite of client-side web utilities for engineers, security auditors, logistics managers, and data analysts. Every single computation executes in your browser's local sandbox with **zero data transmission**.

---

## ⚡ Quick Start

Clone and run the development server locally:

\`\`\`bash
git clone https://github.com/privatools/privatools.git
cd privatools
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧩 Included Utilities

- **Data & Config:**
  - Structured Data Converter (JSON ↔ YAML ↔ CSV ↔ XML)
  - Client-Side PDF Privacy Lab (Merge, Split, Rotate, Extract)
  - SQLite Database Explorer (In-Browser WebAssembly)
  - Code & Text Diff / Patch Studio (Word-level highlighting & .patch export)
- **Media & Images:**
  - Client-Side Image Lab (WebP, PNG, JPEG, AVIF compression)
  - Offline QR Code & Barcode Studio (12+ 1D/2D symbologies & batch printing)
- **Security & Dev:**
  - X.509 Certificate Inspector & Exporter (PEM ↔ DER ↔ SPKI)
  - EDI X12 & EDIFACT Supply Chain Viewer
  - JWT & OAuth Token Debugger with Web Crypto Verification
  - Cryptographic Checksum & Hash Studio (SHA-256, MD5, HMAC, PBKDF2)
  - Client-Side Regex Workbench & Tester
- **Text & Encodings:**
  - Text & Encoding Studio (Base64, Hex, URL, HTML Entities)
  - Markdown & Technical Documentation Studio

---

## 🔒 Zero-Knowledge Guarantee

* **No Backend Server Required:** Built with Next.js static export (\`output: 'export'\`).
* **Zero External Network Calls:** Check your browser's Network tab — zero bytes leave your machine.
* **Offline Capable:** Works without an internet connection once loaded.

---

## 📜 License

Distributed under the **MIT License**. See \`LICENSE\` for more information.
`,
  },
];
