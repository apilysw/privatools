export type TextOperation =
  | "base64-encode"
  | "base64-decode"
  | "hex-encode"
  | "hex-decode"
  | "url-encode"
  | "url-decode"
  | "html-escape"
  | "html-unescape"
  | "case-camel"
  | "case-snake"
  | "case-kebab"
  | "case-pascal"
  | "case-constant";

export interface TextTransformResult {
  output: string;
  durationMs: number;
  wordCount: number;
  charCount: number;
  byteCount: number;
  error?: string;
}

// UTF-8 safe Base64 encoding
export function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// UTF-8 safe Base64 decoding
export function fromBase64(str: string): string {
  const binary = atob(str.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function toHex(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

export function fromHex(hex: string): string {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  if (clean.length % 2 !== 0) {
    throw new Error("Invalid Hex length (must be pairs of characters).");
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function unescapeHtml(str: string): string {
  const doc = new DOMParser().parseFromString(str, "text/html");
  return doc.documentElement.textContent || "";
}

// Simple case conversions
function splitWords(str: string): string[] {
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function toCamelCase(str: string): string {
  const words = splitWords(str);
  return words
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join("");
}

export function toSnakeCase(str: string): string {
  return splitWords(str)
    .map((w) => w.toLowerCase())
    .join("_");
}

export function toKebabCase(str: string): string {
  return splitWords(str)
    .map((w) => w.toLowerCase())
    .join("-");
}

export function toPascalCase(str: string): string {
  return splitWords(str)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

export function toConstantCase(str: string): string {
  return splitWords(str)
    .map((w) => w.toUpperCase())
    .join("_");
}

export function processText(input: string, op: TextOperation): TextTransformResult {
  const startTime = performance.now();
  const trimmed = input.trim();

  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = input.length;
  const byteCount = new Blob([input]).size;

  if (!input) {
    return {
      output: "",
      durationMs: 0,
      wordCount: 0,
      charCount: 0,
      byteCount: 0,
    };
  }

  try {
    let output = "";
    switch (op) {
      case "base64-encode":
        output = toBase64(input);
        break;
      case "base64-decode":
        output = fromBase64(input);
        break;
      case "hex-encode":
        output = toHex(input);
        break;
      case "hex-decode":
        output = fromHex(input);
        break;
      case "url-encode":
        output = encodeURIComponent(input);
        break;
      case "url-decode":
        output = decodeURIComponent(input);
        break;
      case "html-escape":
        output = escapeHtml(input);
        break;
      case "html-unescape":
        output = unescapeHtml(input);
        break;
      case "case-camel":
        output = toCamelCase(input);
        break;
      case "case-snake":
        output = toSnakeCase(input);
        break;
      case "case-kebab":
        output = toKebabCase(input);
        break;
      case "case-pascal":
        output = toPascalCase(input);
        break;
      case "case-constant":
        output = toConstantCase(input);
        break;
      default:
        throw new Error(`Unknown text operation: ${op}`);
    }

    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
    return {
      output,
      durationMs,
      wordCount,
      charCount,
      byteCount,
    };
  } catch (err) {
    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
    return {
      output: "",
      durationMs,
      wordCount,
      charCount,
      byteCount,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
