/**
 * Client-Side Cryptographic Hash & Checksum Engine
 * Uses hardware-accelerated Web Crypto API for SHA-1, SHA-256, SHA-384, SHA-512,
 * HMAC, and PBKDF2, paired with pure TypeScript implementations of MD5 and CRC32.
 * 100% Zero-Knowledge & in-memory processing.
 */

export type HashFormat = "hex-lower" | "hex-upper" | "base64";

export interface ComputedHashes {
  md5: string;
  sha1: string;
  sha256: string;
  sha384: string;
  sha512: string;
  crc32: string;
}

export interface VerificationResult {
  matched: boolean;
  matchedAlgorithm?: "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512" | "CRC32";
  normalizedTarget: string;
}

// Convert ArrayBuffer to Hex String
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

// Convert ArrayBuffer to Base64 String safely
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Format a hex hash into desired representation
export function formatHashOutput(hexHash: string, format: HashFormat): string {
  const cleanHex = hexHash.toLowerCase().replace(/[^a-f0-9]/g, "");
  if (format === "hex-lower") {
    return cleanHex;
  }
  if (format === "hex-upper") {
    return cleanHex.toUpperCase();
  }
  if (format === "base64") {
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    }
    return bufferToBase64(bytes);
  }
  return cleanHex;
}

// ---------------------------------------------------------------------------
// Pure TypeScript CRC32 (Standard 0xEDB88320 polynomial)
// ---------------------------------------------------------------------------
let crcTable: Uint32Array | null = null;

function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

export function computeCrc32(bytes: Uint8Array): string {
  if (!crcTable) {
    crcTable = makeCrcTable();
  }
  let crc = 0 ^ -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
  }
  const result = (crc ^ -1) >>> 0;
  return result.toString(16).padStart(8, "0");
}

// ---------------------------------------------------------------------------
// Pure TypeScript MD5 (RFC 1321)
// ---------------------------------------------------------------------------
function safeAdd(x: number, y: number): number {
  const lsw = (x & 0xffff) + (y & 0xffff);
  const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xffff);
}

function bitRotateLeft(num: number, cnt: number): number {
  return (num << cnt) | (num >>> (32 - cnt));
}

function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn((b & c) | (~b & d), a, b, x, s, t);
}

function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
}

function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}

export function computeMd5(inputBytes: Uint8Array): string {
  // Convert bytes to array of 32-bit words (little-endian)
  const len = inputBytes.length;
  const wordCount = ((len + 8) >> 6) + 1;
  const words: number[] = new Array(wordCount * 16).fill(0);

  for (let i = 0; i < len; i++) {
    words[i >> 2] |= inputBytes[i] << ((i % 4) * 8);
  }

  // Padding
  words[len >> 2] |= 0x80 << ((len % 4) * 8);
  // Length in bits (little-endian 64-bit integer)
  const bitLen = len * 8;
  words[wordCount * 16 - 2] = bitLen & 0xffffffff;
  words[wordCount * 16 - 1] = Math.floor(bitLen / 0x100000000) & 0xffffffff;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < words.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    a = md5ff(a, b, c, d, words[i], 7, -680876936);
    d = md5ff(d, a, b, c, words[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, words[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, words[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, words[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, words[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, words[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, words[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, words[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, words[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, words[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, words[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, words[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, words[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, words[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, words[i + 15], 22, 1236535329);

    a = md5gg(a, b, c, d, words[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, words[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, words[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, words[i], 20, -373897302);
    a = md5gg(a, b, c, d, words[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, words[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, words[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, words[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, words[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, words[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, words[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, words[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, words[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, words[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, words[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, words[i + 12], 20, -1926607734);

    a = md5hh(a, b, c, d, words[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, words[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, words[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, words[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, words[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, words[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, words[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, words[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, words[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, words[i], 11, -358537222);
    c = md5hh(c, d, a, b, words[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, words[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, words[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, words[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, words[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, words[i + 2], 23, -995338651);

    a = md5ii(a, b, c, d, words[i], 6, -198630844);
    d = md5ii(d, a, b, c, words[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, words[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, words[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, words[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, words[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, words[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, words[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, words[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, words[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, words[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, words[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, words[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, words[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, words[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, words[i + 9], 21, -343485551);

    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  const resultBytes = [
    a & 0xff, (a >> 8) & 0xff, (a >> 16) & 0xff, (a >> 24) & 0xff,
    b & 0xff, (b >> 8) & 0xff, (b >> 16) & 0xff, (b >> 24) & 0xff,
    c & 0xff, (c >> 8) & 0xff, (c >> 16) & 0xff, (c >> 24) & 0xff,
    d & 0xff, (d >> 8) & 0xff, (d >> 16) & 0xff, (d >> 24) & 0xff,
  ];

  return resultBytes.map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Native Web Crypto Digestion
// ---------------------------------------------------------------------------
export async function computeDigest(
  buffer: ArrayBuffer | Uint8Array,
  algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512"
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algorithm, buffer as BufferSource);
  return bufferToHex(hashBuffer);
}

// Computes all 6 common hashes concurrently
export async function computeAllHashes(
  data: ArrayBuffer | Uint8Array
): Promise<ComputedHashes> {
  const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);

  // Compute Web Crypto hashes concurrently
  const [sha1, sha256, sha384, sha512] = await Promise.all([
    computeDigest(uint8, "SHA-1"),
    computeDigest(uint8, "SHA-256"),
    computeDigest(uint8, "SHA-384"),
    computeDigest(uint8, "SHA-512"),
  ]);

  // Compute pure TypeScript hashes
  const md5 = computeMd5(uint8);
  const crc32 = computeCrc32(uint8);

  return {
    md5,
    sha1,
    sha256,
    sha384,
    sha512,
    crc32,
  };
}

// Compute all hashes from string input (UTF-8)
export async function computeAllTextHashes(text: string): Promise<ComputedHashes> {
  const bytes = new TextEncoder().encode(text);
  return computeAllHashes(bytes);
}

// ---------------------------------------------------------------------------
// HMAC Message Authentication
// ---------------------------------------------------------------------------
export async function computeHmac(
  message: string,
  secretKey: string,
  algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512"
): Promise<string> {
  const keyBytes = new TextEncoder().encode(secretKey);
  const dataBytes = new TextEncoder().encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: { name: algorithm } },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBytes);
  return bufferToHex(signature);
}

// ---------------------------------------------------------------------------
// PBKDF2 Key Derivation
// ---------------------------------------------------------------------------
export async function deriveKeyPbkdf2(
  password: string,
  salt: string,
  iterations: number,
  keyLengthBits: number, // 128, 256, 512
  hashAlg: "SHA-256" | "SHA-512"
): Promise<string> {
  const passwordBytes = new TextEncoder().encode(password);
  const saltBytes = new TextEncoder().encode(salt);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: Math.max(1, iterations),
      hash: { name: hashAlg },
    },
    keyMaterial,
    keyLengthBits
  );

  return bufferToHex(derivedBits);
}

// ---------------------------------------------------------------------------
// Checksum Verifier & Matcher
// ---------------------------------------------------------------------------
export function verifyChecksum(
  computed: ComputedHashes,
  targetInput: string
): VerificationResult {
  const raw = targetInput.trim().toLowerCase();
  if (!raw) {
    return { matched: false, normalizedTarget: "" };
  }

  // Extract pure hex string from typical checksum file formats
  // Examples:
  // "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  filename.iso"
  // "SHA256 (file.iso) = e3b0c44..."
  // "MD5: d41d8cd98f00b204e9800998ecf8427e"
  const hexMatch = raw.match(/[a-f0-9]{8,128}/i);
  const normalized = hexMatch ? hexMatch[0].toLowerCase() : raw.replace(/[^a-f0-9]/gi, "").toLowerCase();

  if (computed.sha256.toLowerCase() === normalized) {
    return { matched: true, matchedAlgorithm: "SHA-256", normalizedTarget: normalized };
  }
  if (computed.sha512.toLowerCase() === normalized) {
    return { matched: true, matchedAlgorithm: "SHA-512", normalizedTarget: normalized };
  }
  if (computed.md5.toLowerCase() === normalized) {
    return { matched: true, matchedAlgorithm: "MD5", normalizedTarget: normalized };
  }
  if (computed.sha1.toLowerCase() === normalized) {
    return { matched: true, matchedAlgorithm: "SHA-1", normalizedTarget: normalized };
  }
  if (computed.sha384.toLowerCase() === normalized) {
    return { matched: true, matchedAlgorithm: "SHA-384", normalizedTarget: normalized };
  }
  if (computed.crc32.toLowerCase() === normalized) {
    return { matched: true, matchedAlgorithm: "CRC32", normalizedTarget: normalized };
  }

  return { matched: false, normalizedTarget: normalized };
}

// Generate sample text file for instant testing
export function generateSampleFile(): { name: string; bytes: Uint8Array } {
  const content = `Privatools Cryptographic Verification Manifest
Generated 100% client-side in browser RAM.
Timestamp: ${new Date().toISOString()}
Security Notice: Zero server uploads, zero network telemetry.`;
  return {
    name: "privatools-manifest.txt",
    bytes: new TextEncoder().encode(content),
  };
}

// Format manifest export (checksums.txt)
export function generateChecksumManifest(
  fileName: string,
  hashes: ComputedHashes
): string {
  return `# Checksum Manifest for ${fileName}
# Generated client-side by Privatools (Zero-Knowledge)
# Date: ${new Date().toUTCString()}

# SHA-256
${hashes.sha256}  ${fileName}

# SHA-512
${hashes.sha512}  ${fileName}

# SHA-1
${hashes.sha1}  ${fileName}

# MD5
${hashes.md5}  ${fileName}

# CRC-32
${hashes.crc32}  ${fileName}
`;
}
