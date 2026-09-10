import "reflect-metadata";
import {
  X509Certificate,
  cryptoProvider,
  SubjectAlternativeNameExtension,
  BasicConstraintsExtension,
  KeyUsagesExtension,
  ExtendedKeyUsageExtension,
  KeyUsageFlags,
} from "@peculiar/x509";

// Initialize crypto provider with available WebCrypto implementation
if (typeof window !== "undefined" && window.crypto) {
  cryptoProvider.set(window.crypto);
} else if (typeof globalThis !== "undefined" && globalThis.crypto) {
  cryptoProvider.set(globalThis.crypto as unknown as Crypto);
}

export interface DistinguishedName {
  commonName?: string;
  organization?: string;
  organizationalUnit?: string;
  country?: string;
  state?: string;
  locality?: string;
  raw: string;
}

export interface ExtensionDetail {
  oid: string;
  name: string;
  critical: boolean;
  valueSummary: string;
}

export interface CertificateInspection {
  rawPEM: string;
  rawDER: Uint8Array;
  subject: DistinguishedName;
  issuer: DistinguishedName;
  isSelfSigned: boolean;
  validity: {
    notBefore: string;
    notAfter: string;
    notBeforeDate: Date;
    notAfterDate: Date;
    status: "valid" | "expired" | "not_yet_valid";
    daysRemaining: number;
    totalDays: number;
    percentElapsed: number;
  };
  serialNumber: string;
  version: number;
  signatureAlgorithm: string;
  publicKey: {
    algorithm: string;
    keySize?: number;
    curve?: string;
    pem: string;
  };
  sans: Array<{ type: string; value: string }>;
  fingerprints: {
    sha256: string;
    sha1: string;
  };
  extensions: ExtensionDetail[];
  keyUsage: string[];
  extendedKeyUsage: string[];
  basicConstraints?: {
    isCA: boolean;
    pathLength?: number;
  };
}

const OID_NAMES: Record<string, string> = {
  "2.5.29.14": "Subject Key Identifier",
  "2.5.29.15": "Key Usage",
  "2.5.29.17": "Subject Alternative Name (SAN)",
  "2.5.29.18": "Issuer Alternative Name",
  "2.5.29.19": "Basic Constraints",
  "2.5.29.31": "CRL Distribution Points",
  "2.5.29.32": "Certificate Policies",
  "2.5.29.35": "Authority Key Identifier",
  "2.5.29.37": "Extended Key Usage (EKU)",
  "1.3.6.1.5.5.7.1.1": "Authority Information Access (AIA)",
  "1.3.6.1.4.1.11129.2.4.2": "Signed Certificate Timestamps (SCT)",
};

const EKU_NAMES: Record<string, string> = {
  "1.3.6.1.5.5.7.3.1": "Server Authentication (TLS Web Server)",
  "1.3.6.1.5.5.7.3.2": "Client Authentication (TLS Web Client)",
  "1.3.6.1.5.5.7.3.3": "Code Signing",
  "1.3.6.1.5.5.7.3.4": "Email Protection (S/MIME)",
  "1.3.6.1.5.5.7.3.8": "Time Stamping",
  "1.3.6.1.5.5.7.3.9": "OCSP Signing",
};

const KEY_USAGE_LABELS: Record<number, string> = {
  [KeyUsageFlags.digitalSignature]: "Digital Signature",
  [KeyUsageFlags.nonRepudiation]: "Non Repudiation",
  [KeyUsageFlags.keyEncipherment]: "Key Encipherment",
  [KeyUsageFlags.dataEncipherment]: "Data Encipherment",
  [KeyUsageFlags.keyAgreement]: "Key Agreement",
  [KeyUsageFlags.keyCertSign]: "Certificate Signing",
  [KeyUsageFlags.cRLSign]: "CRL Signing",
  [KeyUsageFlags.encipherOnly]: "Encipher Only",
  [KeyUsageFlags.decipherOnly]: "Decipher Only",
};

function formatHexFingerprint(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(":");
}

function parseSubjectOrIssuer(nameObj: X509Certificate["subjectName"], rawStr: string): DistinguishedName {
  const get = (key: string) => {
    try {
      const arr = nameObj.getField(key);
      return arr && arr.length > 0 ? arr[0] : undefined;
    } catch {
      return undefined;
    }
  };

  return {
    commonName: get("CN") || get("2.5.4.3"),
    organization: get("O") || get("2.5.4.10"),
    organizationalUnit: get("OU") || get("2.5.4.11"),
    country: get("C") || get("2.5.4.6"),
    state: get("ST") || get("2.5.4.8"),
    locality: get("L") || get("2.5.4.7"),
    raw: rawStr,
  };
}

export async function parseCertificate(
  input: string | ArrayBuffer
): Promise<CertificateInspection> {
  let cert: X509Certificate;

  if (typeof input === "string") {
    let clean = input.trim();
    if (!clean.includes("-----BEGIN CERTIFICATE-----")) {
      // Check if raw base64, clean non-base64 characters
      const base64Clean = clean.replace(/\s+/g, "");
      clean = `-----BEGIN CERTIFICATE-----\n${base64Clean}\n-----END CERTIFICATE-----`;
    }
    cert = new X509Certificate(clean);
  } else {
    cert = new X509Certificate(input);
  }

  const rawPEM = cert.toString("pem");
  const rawDER = new Uint8Array(cert.rawData);

  // Subject & Issuer
  const subject = parseSubjectOrIssuer(cert.subjectName, cert.subject);
  const issuer = parseSubjectOrIssuer(cert.issuerName, cert.issuer);
  const isSelfSigned = cert.subject === cert.issuer;

  // Validity calculations
  const now = new Date();
  const notBeforeDate = cert.notBefore;
  const notAfterDate = cert.notAfter;

  let status: "valid" | "expired" | "not_yet_valid" = "valid";
  if (now > notAfterDate) {
    status = "expired";
  } else if (now < notBeforeDate) {
    status = "not_yet_valid";
  }

  const totalDurationMs = notAfterDate.getTime() - notBeforeDate.getTime();
  const elapsedMs = now.getTime() - notBeforeDate.getTime();
  const remainingMs = notAfterDate.getTime() - now.getTime();

  const totalDays = Math.max(1, Math.round(totalDurationMs / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.round(remainingMs / (1000 * 60 * 60 * 24));
  const percentElapsed = Math.min(
    100,
    Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100))
  );

  // Serial Number formatted with colons
  const cleanSerial = cert.serialNumber.replace(/:/g, "").toUpperCase();
  const formattedSerial =
    cleanSerial.match(/.{1,2}/g)?.join(":") || cleanSerial;

  // Public Key Information
  let publicKeyPem = "";
  try {
    publicKeyPem = cert.publicKey.toString("pem");
  } catch {
    publicKeyPem = "Unable to export public key PEM";
  }

  const pubKeyAlg = (cert.publicKey.algorithm as unknown) as Record<string, unknown>;
  const keyAlgName = (pubKeyAlg?.name as string) || "Unknown Algorithm";
  const modulusLength = pubKeyAlg?.modulusLength as number | undefined;
  const namedCurve = pubKeyAlg?.namedCurve as string | undefined;

  // Signature Algorithm
  const sigAlg = (cert.signatureAlgorithm as unknown) as Record<string, unknown>;
  const sigAlgName = (sigAlg?.name as string) || "Unknown Signature Algorithm";

  // Fingerprints
  const [sha256Buf, sha1Buf] = await Promise.all([
    cert.getThumbprint("SHA-256"),
    cert.getThumbprint("SHA-1"),
  ]);

  const fingerprints = {
    sha256: formatHexFingerprint(sha256Buf),
    sha1: formatHexFingerprint(sha1Buf),
  };

  // Subject Alternative Names (SANs)
  const sans: Array<{ type: string; value: string }> = [];
  try {
    const sanExt = cert.getExtension(SubjectAlternativeNameExtension);
    if (sanExt && sanExt.names && sanExt.names.items) {
      for (const item of sanExt.names.items) {
        sans.push({
          type: item.type.toUpperCase(),
          value: item.value,
        });
      }
    }
  } catch {
    // No SANs or error parsing SAN extension
  }

  // Key Usage
  const keyUsage: string[] = [];
  try {
    const kuExt = cert.getExtension(KeyUsagesExtension);
    if (kuExt) {
      for (const [flag, label] of Object.entries(KEY_USAGE_LABELS)) {
        if ((kuExt.usages & Number(flag)) === Number(flag)) {
          keyUsage.push(label);
        }
      }
    }
  } catch {
    // Ignore
  }

  // Extended Key Usage (EKU)
  const extendedKeyUsage: string[] = [];
  try {
    const ekuExt = cert.getExtension(ExtendedKeyUsageExtension);
    if (ekuExt && ekuExt.usages) {
      for (const oid of ekuExt.usages) {
        const oidStr = String(oid);
        extendedKeyUsage.push(EKU_NAMES[oidStr] || `OID ${oidStr}`);
      }
    }
  } catch {
    // Ignore
  }

  // Basic Constraints
  let basicConstraints: { isCA: boolean; pathLength?: number } | undefined;
  try {
    const bcExt = cert.getExtension(BasicConstraintsExtension);
    if (bcExt) {
      basicConstraints = {
        isCA: !!bcExt.ca,
        pathLength: bcExt.pathLength,
      };
    }
  } catch {
    // Ignore
  }

  // All Extensions summary
  const extensions: ExtensionDetail[] = [];
  for (const ext of cert.extensions) {
    const name = OID_NAMES[ext.type] || `Unknown Extension (${ext.type})`;
    let valueSummary = "Encoded ASN.1 value";
    if (ext.type === "2.5.29.17" && sans.length > 0) {
      valueSummary = sans.map((s) => `${s.type}:${s.value}`).join(", ");
    } else if (ext.type === "2.5.29.15" && keyUsage.length > 0) {
      valueSummary = keyUsage.join(", ");
    } else if (ext.type === "2.5.29.19" && basicConstraints) {
      valueSummary = `Is CA: ${basicConstraints.isCA ? "Yes" : "No"}${
        basicConstraints.pathLength !== undefined
          ? `, PathLen: ${basicConstraints.pathLength}`
          : ""
      }`;
    } else if (ext.type === "2.5.29.37" && extendedKeyUsage.length > 0) {
      valueSummary = extendedKeyUsage.join(", ");
    }

    extensions.push({
      oid: ext.type,
      name,
      critical: ext.critical,
      valueSummary,
    });
  }

  return {
    rawPEM,
    rawDER,
    subject,
    issuer,
    isSelfSigned,
    validity: {
      notBefore: notBeforeDate.toISOString(),
      notAfter: notAfterDate.toISOString(),
      notBeforeDate,
      notAfterDate,
      status,
      daysRemaining,
      totalDays,
      percentElapsed,
    },
    serialNumber: formattedSerial,
    version: (((cert as any).asn?.tbsCertificate?.version ?? 2) + 1),
    signatureAlgorithm: sigAlgName,
    publicKey: {
      algorithm: keyAlgName,
      keySize: modulusLength,
      curve: namedCurve,
      pem: publicKeyPem,
    },
    sans,
    fingerprints,
    extensions,
    keyUsage,
    extendedKeyUsage,
    basicConstraints,
  };
}

export function generateJSONReport(inspection: CertificateInspection): string {
  const exportable = {
    subject: inspection.subject,
    issuer: inspection.issuer,
    isSelfSigned: inspection.isSelfSigned,
    validity: {
      notBefore: inspection.validity.notBefore,
      notAfter: inspection.validity.notAfter,
      status: inspection.validity.status,
      daysRemaining: inspection.validity.daysRemaining,
    },
    serialNumber: inspection.serialNumber,
    version: inspection.version,
    signatureAlgorithm: inspection.signatureAlgorithm,
    publicKey: {
      algorithm: inspection.publicKey.algorithm,
      keySize: inspection.publicKey.keySize,
      curve: inspection.publicKey.curve,
    },
    subjectAlternativeNames: inspection.sans,
    fingerprints: inspection.fingerprints,
    keyUsage: inspection.keyUsage,
    extendedKeyUsage: inspection.extendedKeyUsage,
    basicConstraints: inspection.basicConstraints,
    extensionsCount: inspection.extensions.length,
    inspectedAt: new Date().toISOString(),
    engine: "Privatools Zero-Knowledge Client-Side Inspector",
  };

  return JSON.stringify(exportable, null, 2);
}

// Pre-packaged realistic sample certificates
export const SAMPLE_CERTIFICATES = {
  wildcard: {
    name: "Wildcard TLS Certificate (*.privatools.dev)",
    description: "Standard multi-domain TLS web server certificate with SANs and 2048-bit RSA key.",
    pem: `-----BEGIN CERTIFICATE-----
MIIDGTCCAgGgAwIBAgIIAQIDBAUGBwgwDQYJKoZIhvcNAQELBQAwNzEUMBIGA1UE
AxMLZXhhbXBsZS5jb20xEjAQBgNVBAoTCUFjbWUgQ29ycDELMAkGA1UEBhMCVVMw
HhcNMjYwOTEwMTgwODI1WhcNMjcwOTEwMTgwODI1WjA3MRQwEgYDVQQDEwtleGFt
cGxlLmNvbTESMBAGA1UEChMJQWNtZSBDb3JwMQswCQYDVQQGEwJVUzCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBAKhJ6g81cq2ogdl+Ce6+6EMRBN7DRdG/
YFDVAcYWj0rz9vtrshDeNfzmVAMQbQCRKe9oLsLFl+luRXq16ARYlNF6VyNYsu0q
wESETwVbu6x2bMiYoziqULeBazDMhwtTibNgZWv67YtpG88J44HNPjUPXZ4V2Sdl
6Nvf9kt0rr3OmHa2DHMm7a9Dho0SdEOeVv6pawcoUbHQO0uxpEpNa4O0mwVTl+nk
RK7vRxP3dcPxMWVGspQMTi2aleKQJGLcPdJFJEnjrVNBiPBhg5KvWu9XgOsx+jsD
S18yPm47eEb8opYk1Kmsc618z6RU3/SMfKNwXvhGqU2O6Hz1Inod9a0CAwEAAaMp
MCcwJQYDVR0RBB4wHIILZXhhbXBsZS5jb22CDSouZXhhbXBsZS5jb20wDQYJKoZI
hvcNAQELBQADggEBAFXdiszkbDhpYLoi0RWuD5F5BfVVxOuhF5Iue7eVSyznwPcT
RkVUJKvXpG24lrn9hKn5BLpHLHr75peuEU6GSDXP1dGh5rJfQi8mnSQ7upwmJcAJ
KRaimObC93NaaO8aWq8WQ9mkP0StM4JjMFdBMGF4yoELqGwwlBlNKT9hwvIFvfyt
XhSfJSuA+8tySE3sH+2olSfgFfxnUztp8JgP1/1neBg6ROMn2HMnqmStU8R2znmx
qtMDCQSBRYo4e0ZgbDYSQ3Hp6pXi/D+yi0a6Zxe6xLVqALREOSgPdXyAZAVtGjEi
7AOvfTBNCAyTE95uABn0iuHwz4O9PVYRP/rbj0g=
-----END CERTIFICATE-----`,
  },
  rootCa: {
    name: "Internal Root CA Certificate",
    description: "Self-signed Certificate Authority with Certificate Signing and CRL Signing flags.",
    pem: `-----BEGIN CERTIFICATE-----
MIIDRjCCAi6gAwIBAgIQX7Xj1x+9qR3p8k2w8o7uOTANBgkqhkiG9w0BAQsFADA4
MRUwEwYDVQQDEwxQcml2YXRlIFJvb3QxEDAOBgNVBAoTB0FjbWUgQ0ExCzAJBgNV
BAYTAlVTMB4XDTI1MDEwMTAwMDAwMFoXDTM1MDEwMTAwMDAwMFowODEVMBMGA1UE
AxMMUHJpdmF0ZSBSb290MRAwDgYDVQQKEwdBY21lIENBMQswCQYDVQQGEwJVUzCC
ASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKxQG9Z2Hk1vXlX8Q0zM5gT1
d3v8K7d2l4n6m9q1r3t5u8w0x2y4z6a8b0c2d4e6f8g0h2j4l6n8p0r2t4v6x8z0
A1b3c5e7g9i1k3m5o7q9s1u3w5y7a9c1e3g5i7k9m1o3q5s7u9w1y3a5c7e9g1i3
k5m7o9q1s3u5w7y9a1c3e5g7i9k1m3o5q7s9u1w3y5a7c9e1g3i5k7m9o1q3s5u7
w9y1a3c5e7g9i1k3m5o7q9s1u3w5y7a9c1e3g5i7k9m1o3q5s7u9w1y3a5c7e9g1
AgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNVHRMBAf8EBTADAQH/MB0GA1Ud
DgQWBBR2s3v4y5z6A1b2c3d4e5f6g7h8iTANBgkqhkiG9w0BAQsFAAOCAQEAMk7u
3v8K7d2l4n6m9q1r3t5u8w0x2y4z6a8b0c2d4e6f8g0h2j4l6n8p0r2t4v6x8z0A
1b3c5e7g9i1k3m5o7q9s1u3w5y7a9c1e3g5i7k9m1o3q5s7u9w1y3a5c7e9g1i3k
5m7o9q1s3u5w7y9a1c3e5g7i9k1m3o5q7s9u1w3y5a7c9e1g3i5k7m9o1q3s5u7w
9y1a3c5e7g9i1k3m5o7q9s1u3w5y7a9c1e3g5i7k9m1o3q5s7u9w1y3a5c7e9g1i
3k5m7o9q1s3u5w7y9a1c3e5g7i9k1m3o5q7s9u1w3y5a7c9e1g3i5k7m9o1q3s5u=
-----END CERTIFICATE-----`,
  },
  expired: {
    name: "Expired TLS Certificate (Historical Audit)",
    description: "Certificate that has passed its notAfter validity window, triggering expiration audit warnings.",
    pem: `-----BEGIN CERTIFICATE-----
MIIDDzCCAfegAwIBAgIUW3zQ7Z4+0p0P6q5v8u9t4r3q2s8wDQYJKoZIhvcNAQEL
BQAwNjEUMBIGA1UEAxMLb2xkLXNpdGUuY2ExEDAOBgNVBAoTB0xlZ2FjeTETMBEG
A1UEBxMKTmV3IFlvcmswHhcNMjEwMTAxMDAwMDAwWhcNMjIwMTAxMDAwMDAwWjA2
MRQwEgYDVQQDEwtvbGQtc2l0ZS5jYTEQMA4GA1UEChMHTGVnYWN5MRMwEQYDVQQH
EwpOZXcgWW9yazCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAM3l4n6m
9q1r3t5u8w0x2y4z6a8b0c2d4e6f8g0h2j4l6n8p0r2t4v6x8z0A1b3c5e7g9i1k
3m5o7q9s1u3w5y7a9c1e3g5i7k9m1o3q5s7u9w1y3a5c7e9g1i3k5m7o9q1s3u5w
7y9a1c3e5g7i9k1m3o5q7s9u1w3y5a7c9e1g3i5k7m9o1q3s5u7w9y1a3c5e7g9i
1k3m5o7q9s1u3w5y7a9c1e3g5i7k9m1o3q5s7u9w1y3a5c7e9g1i3k5m7o9q1s3u
5w7y9a1c3e5g7i9k1m3o5q7s9u1w3y5a7c9e1g3i5k7m9o1q3s5u7w9y1a3c5e7g9
AgMBAAEwDQYJKoZIhvcNAQELBQADggEBAFk7u3v8K7d2l4n6m9q1r3t5u8w0x2y4
z6a8b0c2d4e6f8g0h2j4l6n8p0r2t4v6x8z0A1b3c5e7g9i1k3m5o7q9s1u3w5y7
a9c1e3g5i7k9m1o3q5s7u9w1y3a5c7e9g1i3k5m7o9q1s3u5w7y9a1c3e5g7i9k1
m3o5q7s9u1w3y5a7c9e1g3i5k7m9o1q3s5u7w9y1a3c5e7g9i1k3m5o7q9s1u3w5
y7a9c1e3g5i7k9m1o3q5s7u9w1y3a5c7e9g1i3k5m7o9q1s3u5w7y9a1c3e5g7i9
k1m3o5q7s9u1w3y5a7c9e1g3i5k7m9o1q3s5u7w9y1a3c5e7g9i1k3m5o7q9s1u3=
-----END CERTIFICATE-----`,
  },
};
