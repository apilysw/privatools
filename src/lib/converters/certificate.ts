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
    let clean = input.replace(/\r\n/g, "\n").trim();
    const beginIndex = clean.indexOf("-----BEGIN CERTIFICATE-----");
    const endIndex = clean.indexOf("-----END CERTIFICATE-----");

    if (beginIndex !== -1 && endIndex !== -1) {
      clean = clean.substring(beginIndex, endIndex + "-----END CERTIFICATE-----".length);
    } else if (!clean.includes("-----BEGIN")) {
      const base64Clean = clean.replace(/[^A-Za-z0-9+/=]/g, "");
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
    version: (((cert as unknown as { asn?: { tbsCertificate?: { version?: number } } }).asn?.tbsCertificate?.version ?? 2) + 1),
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
MIID5jCCAs6gAwIBAgIISo8rHJ0OP1owDQYJKoZIhvcNAQELBQAwgZ4xJDAiBgNV
BAMTG1ByaXZhdG9vbHMgSW50ZXJuYWwgUm9vdCBDQTEcMBoGA1UEChMTUHJpdmF0
b29scyBTZWN1cml0eTEeMBwGA1UECxMVQ2VydGlmaWNhdGUgQXV0aG9yaXR5MQsw
CQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMNU2FuIEZy
YW5jaXNjbzAeFw0yNDAxMDEwMDAwMDBaFw0zNDAxMDEwMDAwMDBaMIGeMSQwIgYD
VQQDExtQcml2YXRvb2xzIEludGVybmFsIFJvb3QgQ0ExHDAaBgNVBAoTE1ByaXZh
dG9vbHMgU2VjdXJpdHkxHjAcBgNVBAsTFUNlcnRpZmljYXRlIEF1dGhvcml0eTEL
MAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG
cmFuY2lzY28wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCgiIJU1kWj
BLhRVs1iemlxP9fDPGMFWu4fPMG/0yYk7TEML5eaJ9BPtUcaSHSZRaqWuctvHUdh
ojq0o3mwIMxq4ZvUOg9ozouq08Q0/cNZ8l7g/zAHhFIfaWzS6/eL5WSQ7AeSKy9P
AC+KpxhGjMhpQjz5Sx4pJG2fVzl199x1A9g0v4Mnc5y3j+hwKtT2Yi4wAtLV495A
tAdtOJXosobSWhw7KLhyKRQhVj1npXjJN1PA9v1jdRrD6g9xldgWf4LDbNr09418
Bzuah27+qDfW35Bm5hWNLbcBImByEveM+p09JGsOxs5axWYn47l/DkePp8ZszoeL
P49ESfdbCfUhAgMBAAGjJjAkMBIGA1UdEwEB/wQIMAYBAf8CAQMwDgYDVR0PAQH/
BAQDAgGGMA0GCSqGSIb3DQEBCwUAA4IBAQAerEiRksO0wb6kiDSkMhJ/oh7IluO1
v00b0OAbIS5kc+gnw3BdXYrs/815GpN3AspFirp1+UvHSure8IW57CLXLDb+pFKT
ZcWctlPtTcwDBvpUXHDEdp+rdMUy6U+YoMb/Bdb8A+2SGoLae0qPjLXH9C8WnhZd
qwRxLOUPMxho6/jPK6l/95OebXMW2P/KJlEvHZGKLwUJlIPz5JgcHw4VSZRf01Az
IhJ1WjxXyJrESBneza/GotLiH2b+u+RwcvzqhDtZzFb4IW0bVv3u6VAweYF3DHCA
ZWvs8SJK01OyZRYCw/nC5dmQYJKSAhD2nvBSm2Eb+95ne9OYm9nxtJuj
-----END CERTIFICATE-----`,
  },
  expired: {
    name: "Expired TLS Certificate (Historical Audit)",
    description: "Certificate that has passed its notAfter validity window, triggering expiration audit warnings.",
    pem: `-----BEGIN CERTIFICATE-----
MIIDrzCCApegAwIBAgIIezqcHV6PKkswDQYJKoZIhvcNAQELBQAweTEfMB0GA1UE
AxMWbGVnYWN5LXBvcnRhbC5pbnRlcm5hbDEjMCEGA1UEChMaTGVnYWN5IEluZnJh
c3RydWN0dXJlIENvcnAxCzAJBgNVBAYTAlVTMREwDwYDVQQIEwhOZXcgWW9yazER
MA8GA1UEBxMITmV3IFlvcmswHhcNMjEwMTAxMDAwMDAwWhcNMjIwMTAxMDAwMDAw
WjB5MR8wHQYDVQQDExZsZWdhY3ktcG9ydGFsLmludGVybmFsMSMwIQYDVQQKExpM
ZWdhY3kgSW5mcmFzdHJ1Y3R1cmUgQ29ycDELMAkGA1UEBhMCVVMxETAPBgNVBAgT
CE5ldyBZb3JrMREwDwYDVQQHEwhOZXcgWW9yazCCASIwDQYJKoZIhvcNAQEBBQAD
ggEPADCCAQoCggEBAKTGexmyrnTcnvYcoMorVDyfZohFXJqhYpb8Tbz2YzHrUC06
+xkChw9rLZjTmTzLwAZGPHJZ+70ahl8bA9IVy+RSplh4KAkLGvzgbamk5WxEyhVf
zcxb3e3bXr0L22+4oNR6XBLoOitPu9Vv6UOEuYEzvb+Dx6yQQ2/DbSVJ0bY/ydOE
zFRSRp4SFGQBsJEkIyhoRNJNMhpHMAexGv0SHbHlzSTZE5NIQwML+4PjXG6ZmgsL
KSyf0VsUnSPpIEv9CdcPpwLJ1QxMnWVE7cCmjRWtw3clR0OEuX5D8cMf3D+Pyb+r
c52KJtqG8SkEgexVO+EWUdzTlS7JxYt/VTk+pHkCAwEAAaM7MDkwNwYDVR0RBDAw
LoIWbGVnYWN5LXBvcnRhbC5pbnRlcm5hbIIUb2xkLXNlcnZpY2UuaW50ZXJuYWww
DQYJKoZIhvcNAQELBQADggEBAHajuTVOLX+xMJe4lCFiEZF+QGMJDyHYOzxqvoo5
uaRHLo1uiQxDNPrKTBPEj62sYCOMA+4nlKRNuGVV6UirFX8ARlg3CSH7+6vrr/Np
zirHs5rO2IReZAggC1lGPfZtF72Z4MfcilWe091hCA8gIrdHVEEYiWnbDtqahk2C
mbARLugp3cxqGdMwqoaDIsTp+vjzUK5AQNcnKY6suvLsfSKPX3Ndvoo4ow/BSsed
+D+M+w3kkLTRZeofIjIEcFtQQ9E3aW7QBwNSholQ5IS/6w17Y20OcMV3blSZ2U+z
lsngaNR+KvIi1oo5c2xiZYMLtym6FmXCC2O9p1gNwGud0EM=
-----END CERTIFICATE-----`,
  },
};
