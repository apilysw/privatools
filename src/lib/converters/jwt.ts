export interface DecodedJwt {
  rawToken: string;
  headerRaw: string;
  payloadRaw: string;
  signatureRaw: string;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  algorithm: string;
  claims: {
    exp?: number;
    nbf?: number;
    iat?: number;
    iss?: string;
    sub?: string;
    aud?: string | string[];
    jti?: string;
    customClaims: Array<{ key: string; value: unknown; type: string }>;
  };
  validity: {
    status: "active" | "expired" | "not_yet_valid" | "no_expiry";
    isExpired: boolean;
    isNotYetValid: boolean;
    expiresInText: string;
    issuedAtText?: string;
    notBeforeText?: string;
    percentElapsed: number;
  };
  error?: string;
}

export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64UrlDecodeToBytes(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function formatRelativeTime(timestampSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestampSeconds - now;
  const absDiff = Math.abs(diff);

  const days = Math.floor(absDiff / 86400);
  const hours = Math.floor((absDiff % 86400) / 3600);
  const minutes = Math.floor((absDiff % 3600) / 60);
  const seconds = absDiff % 60;

  let timeString = "";
  if (days > 0) {
    timeString = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    timeString = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    timeString = `${minutes}m ${seconds}s`;
  } else {
    timeString = `${seconds}s`;
  }

  if (diff > 0) {
    return `Expires in ${timeString}`;
  } else {
    return `Expired ${timeString} ago`;
  }
}

export function decodeJwt(raw: string): DecodedJwt {
  const token = raw.trim();
  const parts = token.split(".");

  if (parts.length < 2) {
    throw new Error("Invalid JWT: Must contain at least a header and payload separated by a dot ('.')");
  }

  const [headerB64, payloadB64, signatureB64 = ""] = parts;

  let header: Record<string, unknown> = {};
  let payload: Record<string, unknown> = {};

  try {
    const headerJson = base64UrlDecode(headerB64);
    header = JSON.parse(headerJson);
  } catch (err) {
    throw new Error(`Failed to decode JWT Header: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const payloadJson = base64UrlDecode(payloadB64);
    payload = JSON.parse(payloadJson);
  } catch (err) {
    throw new Error(`Failed to decode JWT Payload: ${err instanceof Error ? err.message : String(err)}`);
  }

  const algorithm = typeof header.alg === "string" ? header.alg : "none";

  // Standard claim extraction
  const exp = typeof payload.exp === "number" ? payload.exp : undefined;
  const nbf = typeof payload.nbf === "number" ? payload.nbf : undefined;
  const iat = typeof payload.iat === "number" ? payload.iat : undefined;
  const iss = typeof payload.iss === "string" ? payload.iss : undefined;
  const sub = typeof payload.sub === "string" ? payload.sub : undefined;
  const aud =
    typeof payload.aud === "string" || Array.isArray(payload.aud)
      ? (payload.aud as string | string[])
      : undefined;
  const jti = typeof payload.jti === "string" ? payload.jti : undefined;

  // Custom claims
  const standardKeys = new Set(["exp", "nbf", "iat", "iss", "sub", "aud", "jti"]);
  const customClaims = Object.entries(payload)
    .filter(([k]) => !standardKeys.has(k))
    .map(([key, value]) => ({
      key,
      value,
      type: Array.isArray(value) ? "array" : typeof value,
    }));

  // Validity calculation
  const now = Math.floor(Date.now() / 1000);
  let status: "active" | "expired" | "not_yet_valid" | "no_expiry" = "no_expiry";
  let isExpired = false;
  let isNotYetValid = false;
  let expiresInText = "No expiration date (perpetual)";
  let percentElapsed = 0;

  if (exp !== undefined) {
    if (now >= exp) {
      status = "expired";
      isExpired = true;
      percentElapsed = 100;
    } else {
      status = "active";
      if (iat !== undefined && exp > iat) {
        percentElapsed = Math.min(100, Math.max(0, Math.round(((now - iat) / (exp - iat)) * 100)));
      } else {
        percentElapsed = 50;
      }
    }
    expiresInText = formatRelativeTime(exp);
  }

  if (nbf !== undefined && now < nbf) {
    status = "not_yet_valid";
    isNotYetValid = true;
  }

  let issuedAtText: string | undefined;
  if (iat !== undefined) {
    const ageSeconds = now - iat;
    if (ageSeconds >= 0) {
      issuedAtText = `Issued ${formatRelativeTime(iat).replace("Expired ", "").replace("Expires in ", "")} ago`;
    } else {
      issuedAtText = `Issued in the future`;
    }
  }

  let notBeforeText: string | undefined;
  if (nbf !== undefined) {
    notBeforeText = new Date(nbf * 1000).toLocaleString();
  }

  return {
    rawToken: token,
    headerRaw: headerB64,
    payloadRaw: payloadB64,
    signatureRaw: signatureB64,
    header,
    payload,
    algorithm,
    claims: {
      exp,
      nbf,
      iat,
      iss,
      sub,
      aud,
      jti,
      customClaims,
    },
    validity: {
      status,
      isExpired,
      isNotYetValid,
      expiresInText,
      issuedAtText,
      notBeforeText,
      percentElapsed,
    },
  };
}

export async function verifyJwtSignature(
  token: string,
  keyInput: string,
  keyType: "secret" | "public-pem" = "secret"
): Promise<{ valid: boolean; message: string }> {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return { valid: false, message: "Token does not have 3 parts (header.payload.signature)" };
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const dataToVerify = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signatureBytes = base64UrlDecodeToBytes(signatureB64);

  let header: Record<string, unknown> = {};
  try {
    header = JSON.parse(base64UrlDecode(headerB64));
  } catch {
    return { valid: false, message: "Invalid JWT header format" };
  }

  const alg = String(header.alg || "").toUpperCase();
  const crypto = typeof window !== "undefined" ? window.crypto : globalThis.crypto;

  if (alg === "NONE") {
    return { valid: signatureB64 === "", message: "Algorithm is 'none' (unsigned)" };
  }

  if (keyType === "secret" && !alg.startsWith("HS")) {
    return { valid: false, message: `Algorithm ${alg} requires a public key PEM, but a symmetric secret was provided.` };
  }

  if (keyType === "public-pem" && alg.startsWith("HS")) {
    return { valid: false, message: `Algorithm ${alg} requires a symmetric secret key, but a public key was provided.` };
  }

  // HMAC algorithms (HS256, HS384, HS512)
  if (alg.startsWith("HS")) {
    if (!keyInput) {
      return { valid: false, message: "Please enter the HMAC secret key" };
    }

    let hashName = "SHA-256";
    if (alg === "HS384") hashName = "SHA-384";
    if (alg === "HS512") hashName = "SHA-512";

    try {
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(keyInput),
        { name: "HMAC", hash: { name: hashName } },
        false,
        ["verify"]
      );

      const isValid = await crypto.subtle.verify(
        "HMAC",
        cryptoKey,
        signatureBytes as unknown as BufferSource,
        dataToVerify as unknown as BufferSource
      );

      return {
        valid: isValid,
        message: isValid
          ? `Signature verified successfully using ${alg}`
          : `Invalid signature for algorithm ${alg}`,
      };
    } catch (err) {
      return {
        valid: false,
        message: `HMAC verification failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // RSA algorithms (RS256, RS384, RS512)
  if (alg.startsWith("RS")) {
    if (!keyInput.trim()) {
      return { valid: false, message: "Please enter the RSA Public Key (PEM)" };
    }

    let hashName = "SHA-256";
    if (alg === "RS384") hashName = "SHA-384";
    if (alg === "RS512") hashName = "SHA-512";

    try {
      const cleanPem = keyInput.replace(/-----BEGIN [A-Z ]+-----|-----END [A-Z ]+-----|\s+/g, "");
      const binaryDer = Uint8Array.from(atob(cleanPem), (c) => c.charCodeAt(0));

      const cryptoKey = await crypto.subtle.importKey(
        "spki",
        binaryDer as unknown as BufferSource,
        { name: "RSASSA-PKCS1-v1_5", hash: { name: hashName } },
        false,
        ["verify"]
      );

      const isValid = await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        signatureBytes as unknown as BufferSource,
        dataToVerify as unknown as BufferSource
      );

      return {
        valid: isValid,
        message: isValid
          ? `Signature verified successfully using ${alg}`
          : `Invalid signature for algorithm ${alg}`,
      };
    } catch (err) {
      return {
        valid: false,
        message: `RSA verification error: Ensure you provided a valid SPKI Public Key PEM. (${err instanceof Error ? err.message : String(err)})`,
      };
    }
  }

  return {
    valid: false,
    message: `Unsupported algorithm: ${alg}. Supported algorithms include HS256, HS384, HS512, RS256, RS384, RS512.`,
  };
}

export async function signJwt(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  secret: string,
  algorithm = "HS256"
): Promise<string> {
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  const crypto = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
  const hashName = algorithm === "HS384" ? "SHA-384" : algorithm === "HS512" ? "SHA-512" : "SHA-256";

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: { name: hashName } },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
  const sigB64 = base64UrlEncodeBytes(new Uint8Array(sigBuffer));

  return `${data}.${sigB64}`;
}

export const SAMPLE_JWTS = {
  oidc_active: {
    name: "Active OIDC Access Token (HS256)",
    description: "Standard OAuth 2.0 / OIDC bearer token with user roles, permissions, and email claims.",
    secret: "privatools-super-secret-key-2026",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTA5MmExZmIiLCJuYW1lIjoiQWxleCBSaXZlcmEiLCJlbWFpbCI6ImFsZXhAcHJpdmF0b29scy5kZXYiLCJyb2xlcyI6WyJhZG1pbiIsImRldmVsb3BlciJdLCJzY29wZSI6InJlYWQ6YWxsIHdyaXRlOmFsbCIsImlzcyI6Imh0dHBzOi8vYXV0aC5wcml2YXRvb2xzLmRldiIsImF1ZCI6ImFwaS5wcml2YXRvb2xzLmRldiIsImlhdCI6MTc4OTA2MjAxOCwiZXhwIjoxNzkxNjU3NjE4LCJqdGkiOiJjZjU0OWExMi05MGMwLTQxZDAtYWM5Ny1mOWEwMmZhZTcxYjIifQ.5a1KJ1PrPav0iKn5iiqhLnswz1NdyM5khnlyYlflMLQ",
  },
  rs256_enterprise: {
    name: "Enterprise API Token (RS256)",
    description: "Asymmetric RSA signed service account token verified using public key PEM.",
    secret: "",
    publicKeyPem: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4E/oDkPs59r2H44+oanF
APKHuY5BnV80J7cc6lv5vQScgeAXwLs2DinaMqcseMFvs5NFXd9DiAE00KvMgh4u
8Ze/R2ZPtA2hLwVjY1ADaEvn7pIXKHuxLtjzgn+7MB/NQIOlGmImchaQwVhzS8tQ
tzzSCNL0g0TDAIvaJy0k+zEYjVuzxwcnlImgJMl0M0I4oYk7jK3Yh36VlY8e+R7i
P/CkYOfnQSFaAJuf6tu/+Kbcwzu5PC8Db4OBdeaZGtdUBE2nHKZNC1W/gJ7gRQmU
m32VXc9bPDSFjG82Js6eWANkCc/hFmtVfRWnyfSvV0tfPh1t+AKySjA7sYpcck7q
5QIDAQAB
-----END PUBLIC KEY-----`,
    token:
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzZXJ2aWNlLWFjY291bnQtNDIiLCJzY29wZSI6InJlYWQ6cmVwb3J0cyB3cml0ZTpkYXRhIiwiZXhwIjoxNzg5MDcyNzk0fQ.ZK4NoQinBrmP70Ofgc3zhiOMf450l14xUSy0rWysF5aeE32om5xllhzaQwfWqTZWIHKBtnv-reZEzh_UAk7UeS1HfBXY9MQrkghl0lK4Xl-sQvdnWxHy26lkvuxz-B0jISiD0Zv2v0BmdRQzbM2r-jyaHjr0oZPspTsbYGFB31-9t9-08Kgv78aKe1S1SdW2FhyfgdforDsufQb0TCy_JvJoFYGoKOOKRgN3gio-m-tpEe3h34p7Jqr6G8MIoEdDReB6cAzjS9yGiPmtuuWL2HOfqhb4k45ijAcChjW2Er62LvOKxtElKX4S8bReSX5aL9_Nyd_wYKlgWrpmQ5s-aw",
  },
  expired_session: {
    name: "Expired Session Token (Historical)",
    description: "Session token that has passed its exp timestamp, triggering expiration alerts.",
    secret: "privatools-super-secret-key-2026",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfZXhwaXJlZF8wMSIsIm5hbWUiOiJPbGQgU2Vzc2lvbiIsImlhdCI6MTYwOTQ1NTYwMCwiZXhwIjoxNjA5NDU5MjAwfQ.j_Ly2haJGeDftthJVMD7FS5qKP5KvOmtUejp0ayGkpg",
  },
};
