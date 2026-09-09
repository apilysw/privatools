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
    name: "X.509 Certificate Inspector",
    slug: "/tools/cert-inspector",
    category: "Security & Dev",
    shortDesc: "Inspect SSL/TLS PEM certificates, SANs, validity, and fingerprint hashes.",
    description:
      "Decode PEM/CRT/CSR certificates client-side. Inspect expiration dates, issuer hierarchies, Subject Alternative Names, and SHA-256 fingerprints.",
    icon: "ShieldCheck",
    badge: "Planned",
    supportedFormats: ["PEM", "CRT", "CER", "CSR"],
    keywords: ["ssl", "tls", "certificate", "x509", "pem", "san", "security", "csr"],
    status: "planned",
  },
  {
    id: "edi-viewer",
    name: "EDI X12 & EDIFACT Viewer",
    slug: "/tools/edi-viewer",
    category: "Security & Dev",
    shortDesc: "Translate cryptic EDI segments into structured tree views and JSON.",
    description:
      "Humanize ANSI X12 (850, 810, 856) and EDIFACT documents. Expands cryptic element definitions and converts EDI to clean JSON.",
    icon: "Code2",
    badge: "Planned",
    supportedFormats: ["X12", "EDIFACT", "JSON"],
    keywords: ["edi", "x12", "edifact", "850", "810", "segments", "supply chain"],
    status: "planned",
  },
];

export const TOOL_CATEGORIES = [
  "All",
  "Data & Config",
  "Media & Images",
  "Text & Encodings",
  "Security & Dev",
] as const;
