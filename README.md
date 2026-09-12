# Privatools — Zero-Knowledge Privacy Converters

> **100% Client-Side Web Utilities.** Your data, files, certificates, and secrets never leave your browser.

Privatools is a source-available, high-performance suite of utility converters built with **Next.js 15 (Static Export)**, **TypeScript**, and **Tailwind CSS**. All operations execute strictly within the browser's local sandbox (using JavaScript, Canvas APIs, and Web Workers) with **zero data uploads**.


---

## ⚡ Key Highlights

- 🔒 **Zero Data Uploads:** 0 bytes uploaded to any remote server. Everything is parsed, converted, and downloaded locally.
- ✈️ **Offline Capable:** Works with Wi-Fi disconnected or in Airplane mode once loaded.
- ⚡ **Fast Local Execution:** No upload latency, network queuing, or server timeouts.
- 🔍 **Keyboard-First Omnibox:** Press `Cmd + K` or `Ctrl + K` anywhere to jump between tools or search formats instantly.
- 📦 **Static HTML Export:** Compiles to static files (`out/`) that can be hosted on Cloudflare Pages, Vercel, Netlify, GitHub Pages, or S3 with zero server maintenance.

---

## 🛠 Included Converters

### 1. Structured Data Converter (`/tools/data-converter`)
- Bi-directional conversions between **JSON**, **YAML**, **CSV**, and **XML**.
- Real-time syntax validation, error pointers, and execution benchmarks.
- One-click copy, local file download, and drag-and-drop file support.

### 2. Client-Side Image Lab (`/tools/image-converter`)
- In-browser image transcoding between **WebP**, **PNG**, and **JPEG**.
- Configurable compression quality slider with live visual preview.
- Dimensional scaling (Original, 1920px, 1280px, 800px, 400px) and file savings metric.

### 3. Text & Encoding Studio (`/tools/text-converter`)
- **Encodings:** UTF-8 safe Base64, Hex, URL percent-encoding, and HTML entities.
- **Case Converters:** `camelCase`, `snake_case`, `kebab-case`, `PascalCase`, `CONSTANT_CASE`.
- Real-time character, word, and byte size indicators.

### 4. X.509 Certificate Inspector & Exporter (`/tools/cert-inspector`)
- Inspect SSL/TLS certificates client-side: Subject, Issuer, SANs, validity window, serial number, algorithms, and key usages.
- Calculates SHA-256 and SHA-1 cryptographic thumbprints in-browser via Web Crypto.
- Export and convert certificates between **PEM (.crt)**, **Binary DER (.der)**, **Public Key SPKI (.pub.pem)**, and **JSON report**.

### 5. EDI X12 & UN/EDIFACT Viewer & Converter (`/tools/edi-viewer`)
- Humanize cryptic B2B EDI files with dictionary definitions for segments and elements.
- Auto-detects delimiters and standards (ANSI X12 850, 810, 856 and UN/EDIFACT ORDERS, INVOIC).
- Interactive segment tree inspector with real-time segment search and element breakdown.
- Export and convert EDI to **Formatted EDI (.edi)**, **Structured JSON (.json)**, and **Semantic XML (.xml)** with zero data egress.

### 6. JWT & OAuth Token Debugger (`/tools/jwt-inspector`)
- Inspect JSON Web Tokens client-side: Tri-color token segment breakdown, live expiration countdown timer, and claim humanizer.
- Cryptographic signature verification via native Web Crypto for HMAC (HS256, HS384, HS512) and RSA (RS256, RS384, RS512).
- Live token editing and re-signing sandbox for local testing with zero network requests.

### 7. Client-Side PDF Privacy Lab (`/tools/pdf-lab`)
- **Merge Mode:** Combine multiple PDF documents with drag-and-drop / arrow reordering and page statistics.
- **Split & Extract Mode:** Extract page ranges (e.g. `1, 3-5, 8`) or select pages visually using an interactive blueprint grid.
- **Rotate & Organize Mode:** Rotate individual pages (90°, 180°, 270°), bulk rotate, and purge unwanted or blank pages.
- **Sample PDF Generator:** 1-click in-browser generation of a sample 3-page A4 document for immediate testing without local files.
- 100% in-memory execution via `pdf-lib` with zero server uploads or disk caching.

### 8. Cryptographic Checksum & File Hash Studio (`/tools/hash-studio`)
- **File Checksum & Integrity Verifier:** In-memory hardware-accelerated digestion for **SHA-256**, **SHA-512**, **SHA-384**, **SHA-1**, **MD5**, and **CRC-32**.
- **Live Checksum Matcher:** Paste expected vendor/release hashes and get instant green verification with auto-detected algorithms.
- **Live String & Text Hasher:** Instant parallel calculation of all 6 algorithms with test vectors and multi-format output (Lowercase Hex, Uppercase Hex, Base64).
- **HMAC Message Authentication:** Compute keyed signatures (HMAC-SHA256, HMAC-SHA512, etc.) for API webhooks and security tokens.
- **PBKDF2 Key Derivation:** Derive cryptographic master keys from passwords with configurable iterations (10k to 600k), salt generation, and bit lengths.
- **Manifest Export:** Download standard `.sha256` / `checksums.txt` files directly.

### 9. SQLite Database Explorer & Exporter (`/tools/sqlite-lab`)
- **In-Browser WebAssembly Runtime:** Runs the official SQLite C engine compiled to WebAssembly (`sql.js`) with zero network egress.
- **Table Explorer & Data Grid:** Inspect table schemas, column types, primary keys, and browse paginated table records with live search filtering.
- **Interactive SQL Console:** Run arbitrary SQL queries (`SELECT`, `INSERT`, `JOIN`, `GROUP BY`, `PRAGMA`), view sub-millisecond execution benchmarks, and export query result sets.
- **Format Converters:** Export individual tables or custom SQL queries directly to **CSV** and **JSON**.
- **Binary Database Export:** Save modified or newly created databases directly as `.sqlite` / `.db` files.
- **Sample Database Generator:** 1-click generation of an e-commerce database (`customers`, `products`, `orders`) for immediate testing.

### 10. Code & Text Diff / Patch Studio (`/tools/diff-viewer`)
- **Dual Viewing Modes:** Synchronized side-by-side (split) diff view and unified (inline) hunk-based view.
- **Intra-Line Word Highlighting:** Pinpoints exact word and token additions, deletions, and replacements within modified lines.
- **Interactive Controls:** Instant "Swap Sides" diff inversion, ignore whitespace variations, and live dual-pane text editors.
- **Standard Patch Generation:** Conforms to GNU diff and git apply specifications with one-click copy and `.patch` download.
- **Realistic Presets:** Pre-loaded with TypeScript refactoring, JSON configuration drift, and legal contract revisions.

### 11. Offline QR Code & Barcode Studio (`/tools/qr-studio`)
- **Warehousing & Distribution 1D:** Generate and customize **Code 128**, **GS1-128 (SSCC-18 pallet tags, GTIN batch/expiry)**, **ITF-14 (cartons with bearer bars)**, **Code 39**, and **Code 93**.
- **2D Matrix & High-Density:** Generate **QR Code**, **Data Matrix (GS1 parts/serials)**, **PDF417 (bills of lading & shipping manifests)**, and **Aztec Code**.
- **Retail Point-of-Sale:** Standard **EAN-13**, **EAN-8**, **UPC-A**, **UPC-E**, and **Codabar**.
- **Batch Generator:** Multi-code bulk generator with configurable columns and direct 1-click thermal/label sheet printing (`@media print`).
- **Zero-Egress Scanner & Decoder:** Decode barcodes via image drop/paste or live camera stream. Includes built-in GS1 Application Identifier parser and Wi-Fi credential decoder.
- **Vector & Raster Export:** Infinite-resolution `.svg` and 300 DPI `.png` download, plus direct clipboard image copy.

### 12. Client-Side Regex Workbench & Tester (`/tools/regex-studio`)
- **Real-Time Match Highlighting:** Color-coded match spans directly within the test text with intra-text navigation.
- **Capturing Groups Inspector:** Detailed breakdown of numbered (`$1`, `$2`) and named (`$<name>`) capturing groups, start/end bounds, and line/col locations.
- **Substitution Sandbox:** Live string replacement with support for `$1`, `$<name>`, `$&`, etc., and instant transformed output copy.
- **Multi-Language Code Generator:** Instant copy-paste snippets for **TypeScript/JavaScript**, **Python**, **Go**, **Rust**, **Java**, **C#**, and **Bash / grep / sed**.
- **Comprehensive Cheat Sheet:** Quick-reference syntax drawer for character classes, quantifiers, anchors, lookaheads, and lookbehinds.

### 13. Verifiable Privacy Audit (`/privacy-audit`)
- Transparent documentation and 3-step DevTools guide for verifying zero network requests.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (tested on Node v26)
- npm 10+

### Installation & Local Development

```bash
# Clone the repository
git clone https://github.com/apilysw/privatools.git
cd privatools

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building Static Production Export

```bash
# Compile and export static HTML to /out
npm run build
```

The resulting `out/` directory contains standard static HTML/CSS/JS ready for deployment to any static hosting provider.

---

## 📁 Project Architecture

```
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root HTML & metadata with AppShell
│   │   ├── page.tsx                # Homepage directory & search
│   │   ├── privacy-audit/page.tsx  # Verifiable privacy proof guide
│   │   └── tools/
│   │       ├── data-converter/     # JSON ↔ YAML ↔ CSV ↔ XML page
│   │       ├── image-converter/    # WebP, PNG, JPEG Image Lab page
│   │       └── text-converter/     # Base64, Hex, URL, and Case Studio
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # Top navigation with search trigger & badge
│   │   │   ├── Footer.tsx          # Architectural summary and links
│   │   │   ├── CommandPalette.tsx  # Global Cmd+K fuzzy search modal
│   │   │   └── AppShell.tsx        # Responsive layout shell & keyboard listener
│   │   └── shared/
│   │       ├── PrivacyBadge.tsx    # Zero-egress visual indicator
│   │       ├── FileDropzone.tsx    # Drag-and-drop local file reader
│   │       └── ToolHeader.tsx      # Standardized tool header with breadcrumbs
│   └── lib/
│       ├── converters/
│       │   ├── data.ts             # YAML/JSON/CSV/XML parser & serializer engines
│       │   ├── image.ts            # Client-side Canvas image transcoding engine
│       │   └── text.ts             # String transformations & encodings
│       ├── registry.ts             # Central catalog of all tools & keywords
│       └── utils.ts                # Tailwind classnames merger helper
├── next.config.ts                  # Configured with output: 'export'
├── tailwind.config.ts / globals.css# Modern dark/light styling
└── tsconfig.json
```

---

## 📱 Privatools PWA — Offline & Ad-Free

Love Privatools? Get the **installable offline app** — all 20+ tools on your home screen, no internet required, no ads. One-time purchase, no subscription.

👉 **[Get it on Gumroad](https://privatools.gumroad.com/l/pwa)** — ~£3 / ~$4

---

## 📜 License

This project is licensed under the **[Business Source License 1.1](./LICENSE.md)** (BSL 1.1).

- ✅ **Permitted:** Personal use, educational use, evaluation, development, and contributions.
- ❌ **Restricted:** Production/commercial self-hosting or offering as a hosted service without a commercial license.
- 🔄 **Change Date:** September 12, 2030 — on this date the license automatically converts to **MIT**, making it fully open source.

See [LICENSE.md](./LICENSE.md) for the full terms.

