# Privatools — Zero-Knowledge Privacy Converters

> **100% Client-Side Web Utilities.** Your data, files, certificates, and secrets never leave your browser.

Privatools is an open, high-performance suite of utility converters built with **Next.js 15 (Static Export)**, **TypeScript**, and **Tailwind CSS**. All operations execute strictly within the browser's local sandbox (using JavaScript, Canvas APIs, and Web Workers) with **zero network egress**.

---

## ⚡ Key Highlights

- 🔒 **Zero Data Egress:** 0 bytes uploaded to any remote server. Everything is parsed, converted, and downloaded locally.
- ✈️ **Offline Capable:** Works with Wi-Fi disconnected or in Airplane mode once loaded.
- ⚡ **Sub-Millisecond Execution:** No upload latency, network queuing, or server timeouts.
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

### 6. Verifiable Privacy Audit (`/privacy-audit`)
- Transparent documentation and 3-step DevTools guide for verifying zero network requests.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (tested on Node v26)
- npm 10+

### Installation & Local Development

```bash
# Clone the repository
git clone <repo-url>
cd "Utility Websites"

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

## 📜 License
MIT License. Built for speed, privacy, and developer ergonomics.
