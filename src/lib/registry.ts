export interface ToolMetadata {
  id: string;
  name: string;
  slug: string;
  category: "Data & Config" | "Media & Images" | "Text & Encodings" | "Security & Dev";
  shortDesc: string;
  description: string;
  icon: string;
  badge?: string;
  supportedFormats: string[];
  keywords: string[];
  status: "ready" | "preview" | "planned";
}

export const TOOLS_REGISTRY: ToolMetadata[] = [
  {
    id: "data-converter",
    name: "Structured Data Converter",
    slug: "/tools/data-converter",
    category: "Data & Config",
    shortDesc: "Convert between JSON, YAML, CSV, and XML instantly with live preview.",
    description:
      "Bi-directional, zero-latency converter supporting JSON, YAML, CSV, and XML. Formats and validates structures client-side with zero data egress.",
    icon: "FileSpreadsheet",
    badge: "Most Popular",
    supportedFormats: ["JSON", "YAML", "CSV", "XML"],
    keywords: ["json", "yaml", "csv", "xml", "convert", "table", "excel", "parse", "format"],
    status: "ready",
  },
  {
    id: "image-converter",
    name: "Client-Side Image Lab",
    slug: "/tools/image-converter",
    category: "Media & Images",
    shortDesc: "Transcode WebP, PNG, JPEG with quality compression and zero uploads.",
    description:
      "Fast, private image converter using browser Canvas & Blob APIs. Convert between modern WebP, PNG, and JPEG formats, scale dimensions, and inspect file size savings.",
    icon: "Image",
    badge: "100% Local",
    supportedFormats: ["WebP", "PNG", "JPEG", "AVIF", "SVG"],
    keywords: ["image", "webp", "png", "jpeg", "jpg", "compress", "resize", "convert", "privacy"],
    status: "ready",
  },
  {
    id: "text-converter",
    name: "Text & Encoding Studio",
    slug: "/tools/text-converter",
    category: "Text & Encodings",
    shortDesc: "Encode/decode Base64, Hex, URL encoding, HTML entities, and Markdown.",
    description:
      "Essential text and string transformation utilities including Base64 encode/decode, Hex, URL percent-encoding, HTML entity escaping, and Markdown-to-HTML preview.",
    icon: "Binary",
    badge: "Fast",
    supportedFormats: ["Base64", "Hex", "URL", "HTML", "Markdown"],
    keywords: ["base64", "hex", "url", "encode", "decode", "markdown", "html", "strings", "hash"],
    status: "ready",
  },
  {
    id: "cert-inspector",
    name: "X.509 Certificate Inspector & Exporter",
    slug: "/tools/cert-inspector",
    category: "Security & Dev",
    shortDesc: "Inspect SSL/TLS certificates and convert between PEM, DER, and Public Key formats.",
    description:
      "Decode and validate X.509 certificates client-side. Inspect SANs, validity timelines, fingerprints, and export or convert between PEM, binary DER, Public Key SPKI, and JSON reports.",
    icon: "ShieldCheck",
    badge: "Zero Egress",
    supportedFormats: ["PEM", "DER", "CRT", "CER", "Public Key", "JSON"],
    keywords: ["ssl", "tls", "certificate", "x509", "pem", "der", "san", "security", "csr", "export", "convert"],
    status: "ready",
  },
  {
    id: "edi-viewer",
    name: "EDI X12 & EDIFACT Viewer & Converter",
    slug: "/tools/edi-viewer",
    category: "Security & Dev",
    shortDesc: "Inspect ANSI X12 and EDIFACT documents and convert between EDI, JSON, and XML.",
    description:
      "Humanize cryptic EDI documents with dictionary definitions for segments and elements. Translate ANSI X12 (850, 810, 856) and UN/EDIFACT into interactive trees, formatted EDI, structured JSON, and XML with zero data egress.",
    icon: "Code2",
    badge: "Zero Egress",
    supportedFormats: ["X12", "EDIFACT", "JSON", "XML", "EDI"],
    keywords: ["edi", "x12", "edifact", "850", "810", "856", "orders", "invoic", "xml", "json", "supply chain", "hipaa", "b2b"],
    status: "ready",
  },
  {
    id: "jwt-inspector",
    name: "JWT & OAuth Token Debugger",
    slug: "/tools/jwt-inspector",
    category: "Security & Dev",
    shortDesc: "Decode, verify Web Crypto signatures, and inspect OAuth tokens client-side.",
    description:
      "Inspect JSON Web Tokens client-side. Live expiration countdown, RFC 7519 claim humanizer, and Web Crypto signature verification for HS256/384/512 and RS256 with zero data egress.",
    icon: "Key",
    badge: "Zero Egress",
    supportedFormats: ["JWT", "JWS", "OAuth", "OIDC", "JSON"],
    keywords: ["jwt", "token", "oauth", "oidc", "bearer", "auth", "decode", "verify", "hs256", "rs256", "security"],
    status: "ready",
  },
  {
    id: "pdf-lab",
    name: "Client-Side PDF Privacy Lab",
    slug: "/tools/pdf-lab",
    category: "Data & Config",
    shortDesc: "Merge, split, extract, rotate, and organize PDF documents with zero server uploads.",
    description:
      "Perform confidential PDF transformations directly in your browser. Combine multiple PDF documents, extract page ranges with an interactive picker, rotate orientations, and purge unwanted pages with 100% in-memory privacy.",
    icon: "FileText",
    badge: "Zero Egress",
    supportedFormats: ["PDF", "Merge", "Split", "Rotate", "Extract"],
    keywords: ["pdf", "merge", "split", "extract", "rotate", "combine", "pages", "privacy", "document", "organize"],
    status: "ready",
  },
  {
    id: "hash-studio",
    name: "Cryptographic Checksum & File Hash Studio",
    slug: "/tools/hash-studio",
    category: "Security & Dev",
    shortDesc: "Compute and verify SHA-256, SHA-512, MD5, CRC32, HMACs, and PBKDF2 keys.",
    description:
      "Hardware-accelerated cryptographic hash calculation and file checksum verification. Compute SHA-256, SHA-512, MD5, CRC32, generate keyed HMACs, and derive PBKDF2 keys in local memory with zero data egress.",
    icon: "Hash",
    badge: "Zero Egress",
    supportedFormats: ["SHA-256", "SHA-512", "MD5", "CRC-32", "HMAC", "PBKDF2"],
    keywords: ["hash", "checksum", "sha256", "sha512", "md5", "crc32", "hmac", "pbkdf2", "crypto", "verify", "digest", "signature"],
    status: "ready",
  },
  {
    id: "sqlite-lab",
    name: "SQLite Database Explorer & Exporter",
    slug: "/tools/sqlite-lab",
    category: "Data & Config",
    shortDesc: "Open, query, browse tables, and export SQLite databases via in-browser WebAssembly.",
    description:
      "Run the official SQLite engine compiled to WebAssembly locally in your browser. Inspect table schemas, browse paginated records, run arbitrary SQL queries, and export tables to CSV or JSON with zero data egress.",
    icon: "Database",
    badge: "Zero Egress",
    supportedFormats: ["SQLite", "DB", "SQL", "CSV", "JSON"],
    keywords: ["sqlite", "db", "sql", "database", "query", "table", "schema", "csv", "json", "export", "wasm"],
    status: "ready",
  },
  {
    id: "diff-viewer",
    name: "Code & Text Diff / Patch Studio",
    slug: "/tools/diff-viewer",
    category: "Data & Config",
    shortDesc: "Compare code and text side-by-side with word-level highlighting and patch export.",
    description:
      "Perform private code, configuration, and text comparisons. View synchronized side-by-side or unified diffs, inspect intra-line word replacements, generate standard GNU/Git .patch files, and compare revisions with zero data egress.",
    icon: "GitCompare",
    badge: "Zero Egress",
    supportedFormats: ["Diff", "Patch", "Code", "JSON", "Text"],
    keywords: ["diff", "patch", "git", "compare", "side-by-side", "unified", "code", "merge", "changes"],
    status: "ready",
  },
  {
    id: "qr-studio",
    name: "Offline QR Code & Barcode Studio",
    slug: "/tools/qr-studio",
    category: "Media & Images",
    shortDesc: "Generate, batch print, and decode 1D/2D barcodes and QR codes client-side.",
    description:
      "Generate, customize, batch print, and decode 1D and 2D barcodes for warehousing, distribution, retail, and logistics. Supports Code 128, GS1-128 (SSCC), ITF-14, Data Matrix, QR Code, PDF417, EAN-13, and UPC-A with zero data egress.",
    icon: "QrCode",
    badge: "Zero Egress",
    supportedFormats: ["QR", "Code 128", "GS1-128", "ITF-14", "Data Matrix", "PDF417", "EAN-13", "UPC-A"],
    keywords: [
      "qr",
      "barcode",
      "code128",
      "gs1",
      "sscc",
      "itf14",
      "datamatrix",
      "pdf417",
      "ean13",
      "upc",
      "pallet",
      "distribution",
      "warehouse",
      "logistics",
      "scanner",
      "generator",
      "batch",
    ],
    status: "ready",
  },
  {
    id: "regex-studio",
    name: "Client-Side Regex Workbench & Tester",
    slug: "/tools/regex-studio",
    category: "Security & Dev",
    shortDesc: "Test regular expressions with real-time match highlighting, group extraction, and substitution.",
    description:
      "Interactive client-side regular expression workbench. Real-time visual match highlighting, named capturing group breakdown, string substitution sandbox, multi-language code generators, and regex cheat sheet with zero data egress.",
    icon: "Regex",
    badge: "Zero Egress",
    supportedFormats: ["Regex", "RegExp", "PCRE", "ECMAScript", "Pattern"],
    keywords: [
      "regex",
      "regexp",
      "regular expression",
      "tester",
      "matcher",
      "substitute",
      "replace",
      "groups",
      "pattern",
      "log",
      "parser",
      "workbench",
    ],
    status: "ready",
  },
];

export const TOOL_CATEGORIES = [
  "All",
  "Data & Config",
  "Media & Images",
  "Text & Encodings",
  "Security & Dev",
] as const;
