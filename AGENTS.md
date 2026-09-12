<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Privatools Agent Guide

Welcome to the **Privatools** repository. This guide documents the architectural invariants, coding rules, user preferences, and workflow checklists for any AI agent or developer working on this project.

---

## 1. Project Philosophy & Core Invariants

Privatools is a suite of **100% Client-Side Web Utilities**. Your data, files, certificates, and secrets never leave your browser.

- **Zero Data Uploads / Zero Network Egress**:
  - 0 bytes uploaded to any remote server.
  - All parsing, transcoding, hashing, and cryptography execute strictly in the browser's local sandbox (JavaScript, WebAssembly, Canvas APIs, Web Crypto, Web Workers).
  - **NEVER** introduce remote API endpoints, server actions, tracking pixels, or telemetry SDKs for processing user data.
  - Keep conversions strictly in-memory.
- **Static Export Only (`output: 'export'`)**:
  - The application compiles to pure static HTML/CSS/JS via `next build` into the `out/` directory.
  - **NEVER** use Node server-runtime features (`cookies()`, `headers()`, dynamic API routes, or server-side DB connections) in page or layout components.
  - Always keep `export const dynamic = "force-static"` in route layouts/sitemaps if dynamic bailouts are risked.
- **Copy & Messaging Standards**:
  - Prefer clear, user-friendly phrasing: **"zero data uploads"** and **"100% client-side memory execution"** (rather than overly dense jargon like "zero network egress").
  - Emphasize compliance: *"GDPR, HIPAA & SOC 2 Friendly: Process sensitive payloads and PII directly on your local machine with no remote processing"*.
  - For cryptographic claims: State exact mechanisms clearly (e.g. *"Privatools generates a 256-bit client-side secret via `crypto.getRandomValues()`"*).
- **License & Upstream Repository**:
  - Upstream URL: `https://github.com/apilysw/privatools`
  - License: **Business Source License 1.1 (BSL 1.1)**, converting to **MIT** on September 12, 2030 (see `LICENSE.md`).

---

## 2. Codebase Architecture

```
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root HTML & metadata with AppShell
│   │   ├── page.tsx                # Homepage directory, category tabs, pinned tools, drag & drop reordering
│   │   ├── privacy-audit/page.tsx  # Verifiable DevTools audit proof & GitHub source verification card
│   │   ├── sitemap.ts              # Static XML sitemap generator
│   │   ├── robots.ts               # Robots.txt generator (with Content-Signal for AI crawlers)
│   │   └── tools/                  # 19 standalone tool routes
│   │       └── [tool-name]/
│   │           ├── page.tsx        # Client component with tool interface
│   │           └── layout.tsx      # Server layout with generateMetadata() & ToolLandingContent
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # Omnibox trigger, GitHub link, audit proof link
│   │   │   ├── Footer.tsx          # Feature columns, active tool highlights, PWA status, copyright
│   │   │   ├── CommandPalette.tsx  # Global Cmd+K fuzzy search modal (prioritizes pinned tools)
│   │   │   └── AppShell.tsx        # Layout shell, keyboard shortcuts & client-side ?format=md redirect
│   │   ├── pwa/
│   │   │   ├── PwaManager.tsx      # Offline service worker registration & install prompt modal
│   │   │   └── PwaBadge.tsx        # Status pill in footer
│   │   └── shared/
│   │       ├── ToolHeader.tsx      # Standard tool breadcrumb header with favorite/pin button (takes `toolId`)
│   │       ├── ToolLandingContent.tsx # Injected rich SEO landing content, use cases, FAQs, and JSON-LD schemas
│   │       ├── PrivacyBadge.tsx    # Zero-upload visual indicator
│   │       ├── FileDropzone.tsx    # In-memory drag-and-drop file loader
│   │       └── GithubIcon.tsx      # Clean Octicon SVG (lucide-react has no brand icons)
│   ├── lib/
│   │   ├── converters/             # Pure converter engines (data, image, text, hash, cert, jwt, sqlite, etc.)
│   │   ├── registry.ts             # Central catalog of all tools, slugs, categories, formats, and search keywords
│   │   ├── tool-content.ts         # Rich SEO text, architecture explanations, use cases, FAQs, and JSON-LD metadata
│   │   ├── useToolPreferences.ts   # Custom hook for favorite pinning & custom tool ordering persisted to localStorage
│   │   ├── seo.ts                  # Shared OpenGraph, Twitter & Markdown alternate metadata generator
│   │   └── utils.ts                # Tailwind cn() utility
│   └── proxy.ts                    # Next.js 16 development proxy for local Markdown content negotiation
├── functions/
│   └── _middleware.ts              # Cloudflare Pages edge function for Markdown content negotiation
├── scripts/
│   ├── generate-markdown-pages.ts  # Builds static .md mirror pages for all 22 routes
│   ├── generate-sw-manifest.ts     # Injects precache assets and offline negotiation logic into sw.js
│   ├── generate-tools-json.ts      # Generates public/tools.json catalog
│   ├── generate-favicon.ts         # Generates multi-resolution favicon.ico
│   ├── test-consistency.ts         # Verifies catalog, metadata, JSON-LD, and config invariants
│   ├── test-functional.ts          # Validates in-memory converter engine functionality
│   ├── test-smoke.ts               # Post-build static asset and HTML/MD smoke validation
│   └── test-offline.ts             # Complete offline PWA simulation and cache acceptance tests
├── public/
│   ├── _headers                    # Cloudflare Pages security & content-type headers
│   ├── llms.md                     # Machine-readable LLM context document (Markdown)
│   ├── tools.json                  # Public JSON API catalog of all tools
│   ├── sw.js                       # PWA Service Worker (pre-caching + offline Markdown negotiation)
│   └── manifest.json               # Web App Manifest
```

---

## 3. Tool Preferences & Reordering System

User customization is persisted locally:
- **Hook**: `src/lib/useToolPreferences.ts`
- **Storage**: `localStorage` key `privatools_tool_preferences`.
- **Syncing**: Built using React's `useSyncExternalStore` and a custom event `privatools:prefs-changed` for multi-tab and multi-component instant updates.
- **Key Invariant**: When creating or modifying a tool page, always pass `toolId` to `<ToolHeader toolId="..." />` so the header displays the quick favorite/pin star.

---

## 4. Checklist for Adding a New Tool

When creating a new utility tool, complete every step in this checklist:

1. **Converter Engine**: Create pure, well-typed in-memory functions in `src/lib/converters/<tool-name>.ts`.
2. **Catalog Registration**:
   - Add the tool definition to `TOOLS` array in `src/lib/registry.ts`.
   - Ensure comprehensive `keywords` (including file extensions like `mp3`, `flac`, `json`, common aliases, and alternate spellings).
3. **Rich Landing Content & SEO**:
   - Add rich content entry in `src/lib/tool-content.ts` (headline, architecture details, technologies, how-it-works steps, use cases, FAQs, related tools).
4. **Tool Page & Layout**:
   - Create `src/app/tools/<tool-name>/page.tsx`:
     - Mark `'use client'`
     - Include `<ToolHeader toolId="..." ... />`
   - Create `src/app/tools/<tool-name>/layout.tsx`:
     - Export metadata using `generateToolMetadata()` from `src/lib/seo.ts`
     - Render children and `<ToolLandingContent toolId="..." />` at the bottom
5. **Update Public Discovery Files**:
   - Update `public/llms.md` with tool description and architecture.
   - Update `public/tools.json` with the new tool entry.
   - Verify `src/app/sitemap.ts` includes the route.
6. **Lint & Build Verification**:
   - Run `npm run lint` — verify 0 errors.
   - Run `npm run build` — verify static HTML generation succeeds for the new route.
   - Run `npm test` — verify all consistency, functional, and offline tests pass.

---

## 5. Markdown Content Negotiation & LLM Integration

Privatools supports native Markdown delivery for LLMs, autonomous agents, and CLI users (`curl`).

- **Supported Negotiation Triggers**:
  - `Accept: text/markdown`
  - `Content-Type: text/markdown`
  - Query parameter `?format=md` or `?format=markdown`
  - Direct file request `/<route>.md` (e.g. `/tools/text-converter.md`)
- **Execution Layers**:
  1. **Development Server (`src/proxy.ts`)**:
     - Intercepts requests matching negotiation criteria and streams the generated `.md` file with `Content-Type: text/markdown; charset=utf-8`.
  2. **Edge / Cloudflare Pages (`functions/_middleware.ts`)**:
     - Fetches asset candidates cleanly using `new Request(mdUrl.toString(), { method: "GET" })` without forwarding client conditional cache headers (`If-None-Match`), preventing empty `304 Not Modified` responses.
     - Adds `Vary: Accept, Content-Type`, `Cache-Control: public, max-age=3600, must-revalidate`, and `Access-Control-Allow-Origin: *`.
  3. **PWA Service Worker (`public/sw.js` via `scripts/generate-sw-manifest.ts`)**:
     - Pre-caches all `.md` files at install time.
     - Intercepts offline fetch events and serves Markdown responses even with zero network connectivity.
  4. **Client-Side Static Fallback (`src/components/layout/AppShell.tsx`)**:
     - Detects `?format=md` in browser URL queries and redirects (`window.location.replace`) to the static `.md` alternate.
- **Cloudflare Header Deduplication Invariant**:
  - In `public/_headers`, use a single unified `/*.md` rule. Avoid adding overlapping `/llms.md` or `/tools/*.md` blocks with duplicate directives, as Cloudflare Pages concatenates matching rules additively.

---

## 6. Testing & Build Pipeline

Privatools maintains an automated multi-tier verification suite:

- **Consistency Tests (`scripts/test-consistency.ts` / `npm run test:consistency`)**:
  - Verifies exact catalog count (19 tools), category associations, canonical URLs, JSON-LD schemas, and configuration invariants.
- **Functional Tests (`scripts/test-functional.ts` / `npm run test:functional`)**:
  - 68 tests exercising pure converter engines (Base64/Hex, EXIF scrubber, diff parser, YAML/JSON, audio encoders, hash functions).
  - Validates zero network egress during computations.
- **Static Smoke Tests (`scripts/test-smoke.ts` / `npm run test:smoke`)**:
  - 427 checks inspecting the compiled `out/` directory for valid HTML, `.md` files, metadata tags, security headers, and domain references.
- **Offline Acceptance Tests (`scripts/test-offline.ts` / `npm run test:offline`)**:
  - Simulates offline cache storage, verifies precaching of all 310+ assets (including SQLite WASM binaries), and tests offline Markdown negotiation across all 22 routes.
- **Full Test Run**: `npm test` runs consistency, functional, and offline tests.
- **Production Build**: `npm run build` runs `prebuild` -> `next build` -> `generate-markdown-pages` -> `generate-sw-manifest` -> `postbuild` (smoke & offline tests).

---

## 7. Development Guidelines & Common Pitfalls

### React 19 / Turbopack Strictness
- **Compiler Purity**: Do NOT set state synchronously in render phase or in `useEffect` in a way that triggers cascading render loops.
- **Initial State**: Use lazy initializers `useState(() => ...)` when generating client values or seeds on mount.
- **Derived State**: Prefer `useMemo` for derived projections rather than synchronizing state in effects.
- **External Links**: Always use `target="_blank"` and `rel="noopener noreferrer"`.

### Typography & Font Loading
- **Monospace Preload**: In `src/app/layout.tsx`, keep `preload: false` on `Geist_Mono` to prevent Chromium preload warnings for fonts not used above the fold.
- **Body Font Anchor**: In `src/app/globals.css`, anchor body typography to `var(--font-geist-sans)` for consistent font rendering.

### TypeScript & ESLint
- **Zero Tolerance Policy**: Always leave the project with 0 ESLint errors and 0 warnings (`npm run lint`).
- **Strict Typing**: Avoid `any`. Use strict interfaces, generics, or `Record<string, unknown>`.

### Terminal Execution Environment
- In this environment, Node/npm commands (`npm run lint`, `npm run build`, and `git commit`) must be run with `BypassSandbox: true` due to standard sandbox socket reset behavior.
- Always run both `npm run lint` and `npm run build` before considering any task complete.

---

## 8. User Preferences & Style
- High thoroughness and attention to detail.
- Clean, responsive UI with dark/light mode parity.
- Fast sub-millisecond client-side performance.
- Clean git commits with clear conventional commit messages.
- Always verify changes before reporting completion.

