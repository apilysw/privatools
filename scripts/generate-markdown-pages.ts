import fs from "fs";
import path from "path";
import { TOOLS_REGISTRY } from "../src/lib/registry";
import { TOOLS_CONTENT } from "../src/lib/tool-content";
import { SITE_URL } from "../src/lib/config";

/**
 * Generate Markdown pages for every route in Privatools.
 * Generates both in public/ and in out/ (if out/ exists) so that:
 * 1. LLMs and agents requesting Accept: text/markdown can receive structured Markdown.
 * 2. Static files can be served directly at /<route>.md and /<route>/index.md.
 * 3. The PWA Service Worker can precache all Markdown files for 100% offline access.
 */

function generateToolMarkdown(toolId: string): string {
  const tool = TOOLS_REGISTRY.find((t) => t.id === toolId);
  const content = TOOLS_CONTENT[toolId];

  if (!tool || !content) {
    throw new Error(`Tool metadata or content missing for: ${toolId}`);
  }

  const canonicalUrl = `${SITE_URL}${tool.slug}/`;
  const markdownUrl = `${SITE_URL}${tool.slug}.md`;

  const relatedLinks = content.relatedToolIds
    .map((id) => {
      const rel = TOOLS_REGISTRY.find((t) => t.id === id);
      return rel ? `- [${rel.name}](${SITE_URL}${rel.slug}/)` : null;
    })
    .filter(Boolean)
    .join("\n");

  return `# ${tool.name}

> ${tool.seoTitle || tool.name}
> Canonical URL: [${canonicalUrl}](${canonicalUrl})
> Markdown Alternate: [${markdownUrl}](${markdownUrl})
> Execution Architecture: 100% Client-Side In-Memory Execution (Zero Remote Egress)

## Overview
${content.overview}

## Format Specifications
- **Category:** ${tool.category}
- **Supported Formats:** ${tool.supportedFormats.map((f) => `\`${f}\``).join(", ")}
- **Privacy Guarantee:** 0 bytes uploaded to remote servers. All computation executes locally in browser memory.
- **Compliance:** GDPR, HIPAA & SOC 2 Friendly (process sensitive payloads and PII directly on your local device).

## Technology Stack
${content.techStack.map((tech) => `- ${tech}`).join("\n")}

## How It Works
${content.howItWorks.map((step, idx) => `${idx + 1}. ${step}`).join("\n")}

## Practical Use Cases
${content.useCases.map((u) => `### ${u.title}\n${u.description}`).join("\n\n")}

## Frequently Asked Questions
${content.faqs.map((f) => `### ${f.question}\n${f.answer}`).join("\n\n")}

## Related Tools
${relatedLinks}

---
*Privatools — 100% Client-Side Web Utilities. No tracking, no remote server processing.*
`;
}

function generateHomepageMarkdown(): string {
  const categories = ["Security & Dev", "Media & Images", "Data & Config", "Text & Encodings"] as const;

  const categorySections = categories
    .map((cat) => {
      const tools = TOOLS_REGISTRY.filter((t) => t.category === cat);
      const toolList = tools
        .map(
          (t) =>
            `- [${t.name}](${SITE_URL}${t.slug}/) — ${t.shortDesc} (Formats: ${t.supportedFormats.join(", ")})`
        )
        .join("\n");
      return `### ${cat}\n${toolList}`;
    })
    .join("\n\n");

  return `# Privatools — 100% Client-Side Zero-Knowledge Privacy Utilities

> Private in-browser data converters, image processors, cryptographic engines, and developer utilities.
> Canonical URL: [${SITE_URL}/](${SITE_URL}/)
> Markdown Alternate: [${SITE_URL}/index.md](${SITE_URL}/index.md)
> Machine-Readable LLM Index: [${SITE_URL}/llms.md](${SITE_URL}/llms.md)

## Platform Philosophy & Guarantees
Privatools is a suite of confidential, client-side web utilities engineered to process sensitive enterprise data, personal files, and developer credentials strictly inside your browser sandbox. No file is ever transmitted to any remote server or third-party service.

- **Zero Data Uploads:** 0 bytes uploaded to any remote server. All parsing, transcoding, hashing, and cryptography execute in browser RAM.
- **In-Browser Hardware Acceleration:** WebAssembly (SQLite via sql.js), Web Crypto API (SHA-256, HMAC, PBKDF2), HTML5 Canvas, and Web Workers.
- **Offline Capable:** Full Progressive Web App (PWA) with Cache-First asset caching for 100% offline availability.
- **Compliance:** GDPR, HIPAA, and SOC 2 friendly. Sensitive records remain safely on the user's physical machine.

## Tool Directory
${categorySections}

## Architecture & Verification
- **DevTools Network Proof:** Inspect network traffic via browser DevTools (F12 > Network tab). Notice 0 requests during file conversions.
- **Privacy Audit Guide:** [${SITE_URL}/privacy-audit/](${SITE_URL}/privacy-audit/)
- **About & Creator:** [${SITE_URL}/about/](${SITE_URL}/about/) (Gareth Barlow, UK)
- **Source Repository:** [https://github.com/apilysw/privatools](https://github.com/apilysw/privatools)
- **License:** Business Source License 1.1 (BSL 1.1, converting to MIT on September 12, 2030)
- **Community Support:** [https://buymeacoffee.com/privatools](https://buymeacoffee.com/privatools)
`;
}

function generateAboutMarkdown(): string {
  return `# About Privatools & The Privacy Mission

> Canonical URL: [${SITE_URL}/about/](${SITE_URL}/about/)
> Markdown Alternate: [${SITE_URL}/about.md](${SITE_URL}/about.md)
> Creator: Gareth Barlow (Independent Software Engineer & Privacy Advocate, United Kingdom)

## The Mission
Every day, developers, analysts, and everyday users upload sensitive company code, database dumps, customer PII, SSL certificates, and personal media to random online converter websites. Most converter sites upload your files to remote cloud servers where they can be logged, scraped, retained, or leaked.

Privatools was built to prove that web applications can be fast, capable, and completely private by executing 100% of computations inside the browser's local sandbox.

## Architecture
- **Zero Server Endpoints:** Privatools has no backend API routes, server actions, or file upload endpoints.
- **In-Memory WebAssembly:** Applications like SQLite Database Explorer run official SQLite compiled to WebAssembly (sql.js) entirely in local RAM.
- **Hardware-Accelerated Web Crypto:** Cryptographic hashing and token verification use browser \`crypto.subtle\` with zero third-party telemetry.
- **Canvas & Web Audio:** Media manipulations use browser GPU pipelines and garbage-collect all buffers immediately.

## Verification & Open Source
- Inspect network requests using DevTools (F12 > Network tab).
- Step-by-step audit guide: [${SITE_URL}/privacy-audit/](${SITE_URL}/privacy-audit/)
- Source code available on GitHub: [https://github.com/apilysw/privatools](https://github.com/apilysw/privatools)
- Report issues or request features: [https://github.com/apilysw/privatools/issues](https://github.com/apilysw/privatools/issues)
- Support the project: [https://buymeacoffee.com/privatools](https://buymeacoffee.com/privatools)
`;
}

function generatePrivacyAuditMarkdown(): string {
  return `# Privatools DevTools Verification & Zero-Egress Audit Proof

> Canonical URL: [${SITE_URL}/privacy-audit/](${SITE_URL}/privacy-audit/)
> Markdown Alternate: [${SITE_URL}/privacy-audit.md](${SITE_URL}/privacy-audit.md)
> Proof Method: Verifiable DevTools Network Tab Inspection

## How to Verify Zero Network Egress Yourself
1. Open DevTools by pressing F12 or Right-Click > Inspect.
2. Switch to the **Network** tab.
3. Check the **Preserve log** option and filter by **Fetch/XHR**.
4. Disconnect your internet connection (or enable Airplane Mode / Offline throttling).
5. Load a file, convert structured data, inspect an X.509 certificate, or calculate cryptographic hashes.
6. Notice that **zero network requests** are dispatched during any tool operation.

## Architecture Guarantees
- **Static Export Only:** Compiled to static HTML/JS/CSS with no server-side Node.js runtime.
- **No Analytics or Trackers:** Zero Google Analytics, Facebook Pixels, or telemetry SDKs.
- **Local Browser Storage:** User preferences and pinned favorites are stored only in \`localStorage\`.
- **BSL 1.1 License:** Source available and auditable on GitHub ([https://github.com/apilysw/privatools](https://github.com/apilysw/privatools)).
`;
}

export function generateAllMarkdownPages() {
  console.log("\n📝 Generating static Markdown pages for LLMs and agentic content negotiation...\n");

  const targets = [
    { relPath: "index.md", content: generateHomepageMarkdown() },
    { relPath: "about.md", content: generateAboutMarkdown() },
    { relPath: "privacy-audit.md", content: generatePrivacyAuditMarkdown() },
    ...TOOLS_REGISTRY.map((tool) => ({
      relPath: `tools/${tool.id}.md`,
      content: generateToolMarkdown(tool.id),
    })),
  ];

  const writeTargets = (baseDir: string) => {
    if (!fs.existsSync(baseDir)) return 0;
    let count = 0;
    for (const item of targets) {
      const fullPath = path.join(baseDir, item.relPath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, item.content, "utf8");
      count++;

      // Also create index.md inside directory if appropriate (e.g. tools/<tool>/index.md)
      if (item.relPath !== "index.md") {
        const withoutExt = item.relPath.slice(0, -".md".length);
        const indexMdPath = path.join(baseDir, withoutExt, "index.md");
        const indexDir = path.dirname(indexMdPath);
        if (!fs.existsSync(indexDir)) {
          fs.mkdirSync(indexDir, { recursive: true });
        }
        fs.writeFileSync(indexMdPath, item.content, "utf8");
      }
    }
    return count;
  };

  const publicDir = path.join(process.cwd(), "public");
  const publicCount = writeTargets(publicDir);

  const outDir = path.join(process.cwd(), "out");
  const outCount = writeTargets(outDir);

  console.log(`  ✅ Wrote ${publicCount} Markdown pages to public/`);
  if (outCount > 0) {
    console.log(`  ✅ Wrote ${outCount} Markdown pages (with directory aliases) to out/`);
  }
}

if (require.main === module) {
  generateAllMarkdownPages();
}
