export interface ToolMetadata {
  id: string;
  name: string;
  seoTitle?: string;
  slug: string;
  category: "Data & Config" | "Media & Images" | "Text & Encodings" | "Security & Dev";
  shortDesc: string;
  metaDescription?: string;
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
    seoTitle: "Private JSON to YAML, CSV & XML Converter | Privatools",
    slug: "/tools/data-converter",
    category: "Data & Config",
    shortDesc: "Convert between JSON, YAML, CSV, and XML instantly with live preview.",
    metaDescription: "Convert JSON, YAML, CSV, and XML with instant live preview. Process sensitive structured files 100% client-side in browser memory with zero data uploads.",
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
    seoTitle: "Private Image Converter & WebP Lab | Privatools",
    slug: "/tools/image-converter",
    category: "Media & Images",
    shortDesc: "Transcode WebP, PNG, JPEG with quality compression and zero uploads.",
    metaDescription: "Convert and compress WebP, PNG, and JPEG images locally. Fast client-side image processing in browser Canvas memory with zero file uploads or tracking.",
    description:
      "Fast, private image converter using browser Canvas & Blob APIs. Import WebP, PNG, JPEG, AVIF, SVG, or BMP and export optimized WebP, PNG, and JPEG files, scale dimensions, and inspect file size savings in local memory.",
    icon: "Image",
    badge: "100% Local",
    supportedFormats: ["WebP", "PNG", "JPEG"],
    keywords: [
      "image",
      "webp",
      "png",
      "jpeg",
      "jpg",
      "avif",
      "svg",
      "bmp",
      "ico",
      "compress",
      "resize",
      "convert",
      "privacy",
      "photo",
    ],
    status: "ready",
  },
  {
    id: "text-converter",
    name: "Text & Encoding Studio",
    seoTitle: "Private Text & Base64 Hex Encoder / Decoder | Privatools",
    slug: "/tools/text-converter",
    category: "Text & Encodings",
    shortDesc: "Encode/decode Base64, Hex, URL encoding, HTML entities, and Markdown.",
    metaDescription: "Encode and decode Base64, Hex, URL encoding, HTML entities, and Markdown. Fast text transformations 100% client-side in browser memory with zero uploads.",
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
    seoTitle: "Private X.509 Certificate Inspector & Parser | Privatools",
    slug: "/tools/cert-inspector",
    category: "Security & Dev",
    shortDesc: "Inspect SSL/TLS certificates and convert between PEM, DER, and Public Key formats.",
    metaDescription: "Inspect SSL/TLS certificates and convert between PEM, DER, and Public Key formats. Executed 100% client-side in browser memory with zero data uploads.",
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
    name: "EDI X12 & UN/EDIFACT Viewer & Converter",
    seoTitle: "Private EDI X12 & EDIFACT Viewer & Validator | Privatools",
    slug: "/tools/edi-viewer",
    category: "Security & Dev",
    shortDesc: "Inspect ANSI X12 and EDIFACT documents and convert between EDI, JSON, and XML.",
    metaDescription: "Inspect ANSI X12 and EDIFACT documents and convert between EDI, JSON, and XML. Executed 100% client-side in browser memory with zero data uploads.",
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
    seoTitle: "Private JWT Decoder & Signature Verifier | Privatools",
    slug: "/tools/jwt-inspector",
    category: "Security & Dev",
    shortDesc: "Decode, verify Web Crypto signatures, and inspect OAuth tokens client-side.",
    metaDescription: "Decode, verify Web Crypto signatures, and inspect OAuth tokens client-side. Executed 100% client-side in browser memory with zero data uploads.",
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
    seoTitle: "Private PDF Merge, Split & Organize Lab | Privatools",
    slug: "/tools/pdf-lab",
    category: "Data & Config",
    shortDesc: "Merge, split, extract, rotate, and organize PDF documents with zero server uploads.",
    metaDescription: "Merge, split, extract, rotate, and organize PDF documents with zero server uploads. Executed 100% client-side in browser memory with zero data uploads.",
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
    seoTitle: "Private File Checksum & SHA-256 Hash Studio | Privatools",
    slug: "/tools/hash-studio",
    category: "Security & Dev",
    shortDesc: "Compute and verify SHA-256, SHA-512, MD5, CRC32, HMACs, and PBKDF2 keys.",
    metaDescription: "Compute and verify SHA-256, SHA-512, MD5, HMAC, and PBKDF2 checksums. Executed 100% client-side in browser memory with zero file or data uploads.",
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
    seoTitle: "Online SQLite Viewer — No Uploads | Privatools",
    slug: "/tools/sqlite-lab",
    category: "Data & Config",
    shortDesc: "Open, query, browse tables, and export SQLite databases via in-browser WebAssembly.",
    metaDescription: "Open, query, browse tables, and export SQLite databases via in-browser WebAssembly. Executed 100% client-side in browser memory with zero data uploads.",
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
    seoTitle: "Private Code & Text Diff Checker | Privatools",
    slug: "/tools/diff-viewer",
    category: "Data & Config",
    shortDesc: "Compare code and text side-by-side with word-level highlighting and patch export.",
    metaDescription: "Compare code and text side-by-side with word-level highlighting and patch export. Executed 100% client-side in browser memory with zero data uploads.",
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
    seoTitle: "Offline QR Code & Barcode Generator | Privatools",
    slug: "/tools/qr-studio",
    category: "Media & Images",
    shortDesc: "Generate, batch print, and decode 1D/2D barcodes and QR codes client-side.",
    metaDescription: "Generate, customize, and scan QR codes and barcodes with live camera support. Executed 100% client-side in browser memory with zero data uploads.",
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
    seoTitle: "Private Regex Tester & Match Workbench | Privatools",
    slug: "/tools/regex-studio",
    category: "Security & Dev",
    shortDesc: "Test regular expressions with real-time match highlighting, group extraction, and substitution.",
    metaDescription: "Test regular expressions with real-time match highlighting and substitution. Executed 100% client-side in browser memory with zero data uploads.",
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
  {
    id: "markdown-lab",
    name: "Markdown & Technical Documentation Studio",
    seoTitle: "Private Markdown Editor & Live PDF Preview | Privatools",
    slug: "/tools/markdown-lab",
    category: "Text & Encodings",
    shortDesc: "Author, preview, and format Markdown documents with frontmatter, tables, and HTML/PDF export.",
    metaDescription: "Preview, edit, and export GitHub-flavored Markdown to clean HTML and PDF. Executed 100% client-side in browser memory with zero data uploads.",
    description:
      "Interactive client-side Markdown and technical documentation studio. Real-time GitHub Flavored Markdown (GFM) preview, YAML frontmatter inspector, CSV table converter and formatter, HTML-to-MD compiler, document metrics, and standalone HTML/PDF export with zero data egress.",
    icon: "BookOpen",
    badge: "Zero Egress",
    supportedFormats: ["Markdown", "GFM", "Frontmatter", "HTML", "PDF", "CSV"],
    keywords: [
      "markdown",
      "md",
      "gfm",
      "editor",
      "preview",
      "frontmatter",
      "yaml",
      "documentation",
      "rfc",
      "readme",
      "changelog",
      "table",
      "csv",
      "html",
      "export",
      "pdf",
    ],
    status: "ready",
  },
  {
    id: "media-lab",
    name: "Media Privacy Lab & Metadata Scrubber",
    seoTitle: "Private EXIF & Photo Metadata Scrubber | Privatools",
    slug: "/tools/media-lab",
    category: "Media & Images",
    shortDesc: "Inspect & strip EXIF/GPS metadata from photos losslessly and trim audio waveforms.",
    metaDescription: "Inspect & strip EXIF/GPS metadata from photos losslessly and trim audio waveforms. Executed 100% client-side in browser memory with zero data uploads.",
    description:
      "Client-side media privacy studio. Audit embedded GPS coordinates, camera serials, and device fingerprints. Strip metadata losslessly from JPEG/PNG images with zero recompression, batch scrub photo albums, and visually trim audio files with the Web Audio API in local RAM with zero data egress.",
    icon: "Camera",
    badge: "Zero Egress",
    supportedFormats: ["EXIF", "JPEG", "PNG", "WebP", "TIFF", "WAV", "MP3"],
    keywords: [
      "exif",
      "gps",
      "metadata",
      "scrub",
      "strip",
      "camera",
      "serial",
      "privacy",
      "clean",
      "photo",
      "image",
      "audio",
      "wav",
      "trim",
      "waveform",
      "batch",
    ],
    status: "ready",
  },
  {
    id: "subnet-calculator",
    name: "Network & Subnet CIDR Studio",
    seoTitle: "Private IPv4 & IPv6 Subnet CIDR Calculator | Privatools",
    slug: "/tools/subnet-calculator",
    category: "Security & Dev",
    shortDesc: "IPv4 & IPv6 CIDR subnet calculator, VLSM planner, IP collision detector, and bitmask visualizer.",
    metaDescription: "Calculate IPv4 and IPv6 CIDR subnets, plan VLSM, and check VPC collisions. Executed 100% client-side in browser memory with zero data uploads.",
    description:
      "High-precision client-side IP subnet calculator. Decompose 32-bit IPv4 binary bitmasks, compute Cisco wildcard masks, divide networks with Variable Length Subnet Masking (VLSM), detect cloud VPC routing collisions, and calculate IPv6 addresses with zero data egress.",
    icon: "Network",
    badge: "Zero Egress",
    supportedFormats: ["IPv4", "IPv6", "CIDR", "VLSM", "Binary", "Hex"],
    keywords: [
      "subnet",
      "cidr",
      "ip",
      "ipv4",
      "ipv6",
      "vlsm",
      "mask",
      "wildcard",
      "network",
      "broadcast",
      "cisco",
      "vpc",
      "routing",
      "binary",
      "bitmask",
      "rfc1918",
    ],
    status: "ready",
  },
  {
    id: "date-time-calculator",
    name: "Date, Time, Epoch & Cron Precision Studio",
    seoTitle: "Private Unix Epoch Timestamp & Cron Studio | Privatools",
    slug: "/tools/date-time-calculator",
    category: "Text & Encodings",
    shortDesc: "High-precision Unix epoch converter (s/ms/µs/ns), date math, timezone matrix, and cron explainer.",
    metaDescription: "Convert Unix timestamps (s/ms/µs/ns), calculate date offsets, and parse crons. Executed 100% client-side in browser memory with zero data uploads.",
    description:
      "Client-side temporal precision workbench. Live running Unix epoch ticker in seconds, milliseconds, microseconds, and nanoseconds. Bi-directional ISO/RFC date conversions, business days duration math, 24-hour visual world meeting matrix, and Cron schedule syntax explainer with next 10 runs calculation in zero-egress local memory.",
    icon: "Clock",
    badge: "Zero Egress",
    supportedFormats: ["Epoch", "ISO-8601", "RFC-2822", "RFC-3339", "Cron", "Timezone"],
    keywords: [
      "epoch",
      "timestamp",
      "unix",
      "date",
      "time",
      "duration",
      "business days",
      "working days",
      "timezone",
      "utc",
      "gmt",
      "world clock",
      "meeting",
      "cron",
      "scheduler",
      "y2038",
      "leap year",
    ],
    status: "ready",
  },
  {
    id: "video-lab",
    name: "Video & Audio Transcoder Studio",
    seoTitle: "Private Video & Audio Converter Lab | Privatools",
    slug: "/tools/video-lab",
    category: "Media & Images",
    shortDesc: "Strip audio losslessly, extract and convert MP3/FLAC/WAV/OGG/AAC, transcode video, and export animated GIFs.",
    metaDescription: "Convert video formats, extract MP3 audio, create animated GIFs, and trim clips. Executed 100% client-side in browser memory with zero data uploads.",
    description:
      "Zero-egress client-side media lab. Lossless MP4/WebM audio stripper with ISOBMFF demuxing, video-to-audio extractor (MP3, FLAC, WAV, OGG), bi-directional audio format converter (MP3, WAV, FLAC, OGG, AAC), resolution & bitrate transcoder, animated GIF generator, and visual timeline trimmer.",
    icon: "Video",
    badge: "Zero Egress",
    supportedFormats: ["MP4", "WebM", "MOV", "MP3", "FLAC", "WAV", "OGG", "AAC", "GIF", "Audio", "Video"],
    keywords: [
      "video",
      "audio",
      "transcoder",
      "convert",
      "strip audio",
      "mute video",
      "extract audio",
      "mp3",
      "flac",
      "wav",
      "ogg",
      "aac",
      "m4a",
      "mp4",
      "webm",
      "mov",
      "gif",
      "trim",
      "cut",
      "resize",
      "downscale",
      "lossless",
      "isobmff",
      "sound",
      "music",
      "audio converter",
      "video converter",
      "transcode",
      "media",
      "video lab",
      "media lab",
    ],
    status: "ready",
  },
  {
    id: "color-studio",
    name: "CSS & Modern Color Palette Studio",
    seoTitle: "Private Color Converter & Contrast Checker | Privatools",
    slug: "/tools/color-studio",
    category: "Media & Images",
    shortDesc: "Bi-directional HEX/RGB/HSL/OKLCH conversions, WCAG & APCA contrast checker, color blindness simulator, and harmonies.",
    metaDescription: "Convert HEX, RGB, HSL, and OKLCH colors, audit WCAG contrast, and test blindness. Executed 100% client-side in memory with zero data uploads.",
    description:
      "Comprehensive client-side color studio. Convert between HEX, RGB, HSL, HWB, modern OKLCH (CSS Color 4), and CIE-LAB. Verify WCAG 2.1 AA/AAA and APCA contrast with an intelligent auto-fixer, simulate 8 color blindness profiles, explore interactive harmonies on an SVG color wheel, and generate Tailwind 11-step design token shade scales in 100% private local memory.",
    icon: "Palette",
    badge: "Zero Egress",
    supportedFormats: ["HEX", "RGB", "HSL", "OKLCH", "HWB", "LAB", "CMYK", "Tailwind", "CSS"],
    keywords: [
      "color",
      "colour",
      "css",
      "palette",
      "oklch",
      "oklab",
      "hex",
      "rgb",
      "rgba",
      "hsl",
      "hsla",
      "hwb",
      "cmyk",
      "contrast",
      "wcag",
      "apca",
      "accessibility",
      "color blindness",
      "cvd",
      "protanopia",
      "deuteranopia",
      "tritanopia",
      "harmonies",
      "complementary",
      "triadic",
      "shades",
      "tokens",
      "tailwind",
      "generator",
      "picker",
      "eyedropper",
      "wheel",
    ],
    status: "ready",
  },
  {
    id: "random-studio",
    name: "Provably Fair & Random Studio",
    seoTitle: "Private Provably Fair Random Number Studio | Privatools",
    slug: "/tools/random-studio",
    category: "Security & Dev",
    shortDesc: "Provably fair commit-reveal, polyhedral dice, Gaussian normal distribution, and Diceware.",
    metaDescription: "Generate provably fair random seeds, dice rolls, and Diceware passphrases. Executed 100% client-side in browser memory with zero data uploads.",
    description:
      "Zero-egress randomness studio featuring SHA-256/HMAC-SHA256 provably fair commit-reveal verification, tabletop polyhedral dice roller (d4–d100), Box-Muller Gaussian normal distribution, Fisher-Yates shuffler, EFF Diceware passphrases, UUID v4/v7, and Chi-Square statistical audit.",
    icon: "Dices",
    badge: "Zero Egress",
    supportedFormats: ["CSPRNG", "HMAC-SHA256", "EFF Diceware", "UUID v7", "Dice Notation", "JSON", "CSV"],
    keywords: [
      "random",
      "rng",
      "provably fair",
      "dice",
      "d20",
      "polyhedral",
      "diceware",
      "passphrase",
      "password",
      "uuid",
      "uuidv7",
      "uuid v7",
      "nanoid",
      "shuffle",
      "raffle",
      "teams",
      "gaussian",
      "normal distribution",
      "box-muller",
      "chi-square",
      "entropy",
      "csprng",
      "hmac",
      "lottery",
      "d&d",
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

/**
 * Intelligent relevance-scored search matcher across all tool metadata:
 * name, slug, shortDesc, description, category, supportedFormats, and keywords.
 * - Handles slashed expressions ('mp3/flac', 'json/yaml'), commas, and pluses as OR queries.
 * - Handles multi-word queries ('qr code', 'sqlite export') with exact-match precedence.
 * - Strips leading file extension dots ('.mp3' -> 'mp3').
 * - Ranks results by match quality and relevance.
 */
export function searchTools(query: string, category: string = "All"): ToolMetadata[] {
  const raw = query.toLowerCase().trim();
  const pool =
    category === "All"
      ? TOOLS_REGISTRY
      : TOOLS_REGISTRY.filter((t) => t.category === category);

  if (!raw) return pool;

  const isOrSearch = raw.includes("/") || raw.includes("|") || raw.includes(",");
  const terms = raw
    .split(/[\s/|+,]+/)
    .map((t) => t.replace(/^\./, "").trim())
    .filter(Boolean);

  if (terms.length === 0) return pool;

  interface ScoredTool {
    tool: ToolMetadata;
    score: number;
    matchedTermsCount: number;
  }

  const scored: ScoredTool[] = [];

  for (const tool of pool) {
    const name = tool.name.toLowerCase();
    const shortDesc = tool.shortDesc.toLowerCase();
    const desc = tool.description.toLowerCase();
    const cat = tool.category.toLowerCase();
    const formats = tool.supportedFormats.map((f) => f.toLowerCase());
    const keywords = tool.keywords.map((k) => k.toLowerCase());
    const allFields = [name, shortDesc, desc, cat, ...formats, ...keywords];

    let score = 0;
    let matchedTermsCount = 0;

    // 1. Full phrase match bonus
    if (name.includes(raw)) score += 100;
    else if (keywords.some((k) => k === raw)) score += 85;
    else if (formats.some((f) => f === raw)) score += 80;
    else if (shortDesc.includes(raw)) score += 60;
    else if (desc.includes(raw)) score += 40;
    else if (allFields.some((f) => f.includes(raw))) score += 30;

    // 2. Term-by-term match scoring
    for (const term of terms) {
      let termMatched = false;
      if (name.includes(term)) {
        score += 25;
        termMatched = true;
      }
      if (formats.some((f) => f === term)) {
        score += 25;
        termMatched = true;
      } else if (formats.some((f) => f.includes(term))) {
        score += 12;
        termMatched = true;
      }

      if (keywords.some((k) => k === term)) {
        score += 20;
        termMatched = true;
      } else if (keywords.some((k) => k.includes(term))) {
        score += 10;
        termMatched = true;
      }

      if (shortDesc.includes(term)) {
        score += 8;
        termMatched = true;
      }
      if (desc.includes(term)) {
        score += 4;
        termMatched = true;
      }

      if (termMatched) matchedTermsCount++;
    }

    if (score > 0) {
      scored.push({ tool, score, matchedTermsCount });
    }
  }

  if (scored.length === 0) return [];

  // For multi-word queries without explicit OR operators, prioritize tools matching all terms
  if (!isOrSearch && terms.length > 1) {
    const allTermsMatches = scored.filter((s) => s.matchedTermsCount === terms.length);
    if (allTermsMatches.length > 0) {
      allTermsMatches.sort((a, b) => b.score - a.score);
      return allTermsMatches.map((s) => s.tool);
    }
  }

  // Sort descending by score, then number of matched terms
  scored.sort((a, b) => b.score - a.score || b.matchedTermsCount - a.matchedTermsCount);
  return scored.map((s) => s.tool);
}

export function getToolById(id: string): ToolMetadata | undefined {
  return TOOLS_REGISTRY.find((t) => t.id === id);
}

export function getToolBySlug(slug: string): ToolMetadata | undefined {
  return TOOLS_REGISTRY.find((t) => t.slug === slug || t.slug === `/tools/${slug}`);
}
