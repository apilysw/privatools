"use client";

import { useState, useEffect, useTransition } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Key,
  Download,
  Copy,
  Check,
  Trash2,
  Globe,
  FileCode,
  Fingerprint,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import {
  parseCertificate,
  CertificateInspection,
  generateJSONReport,
  SAMPLE_CERTIFICATES,
} from "@/lib/converters/certificate";

export default function CertificateInspectorPage() {
  const [inputPEM, setInputPEM] = useState<string>(SAMPLE_CERTIFICATES.wildcard.pem);
  const [binaryDER, setBinaryDER] = useState<ArrayBuffer | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>("sample-wildcard.crt");
  const [inspection, setInspection] = useState<CertificateInspection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "crypto" | "extensions" | "raw">("general");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Run parsing whenever inputPEM or binaryDER changes
  useEffect(() => {
    startTransition(() => {
      setError(null);
      const toParse = binaryDER || inputPEM;
      if (!toParse) {
        setInspection(null);
        return;
      }

      parseCertificate(toParse)
        .then((res) => {
          setInspection(res);
          setError(null);
        })
        .catch((err) => {
          console.error("Certificate parsing error:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Unable to parse certificate. Please ensure it is a valid PEM or DER X.509 certificate."
          );
          setInspection(null);
        });
    });
  }, [inputPEM, binaryDER]);

  const handleCopy = async (text: string, fieldId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadFile = (content: BlobPart, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileDrop = (file: File) => {
    setSelectedFileName(file.name);
    const isDer = file.name.toLowerCase().endsWith(".der");

    if (isDer) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          setBinaryDER(reader.result);
          setInputPEM("");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setBinaryDER(null);
          setInputPEM(reader.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSample = (sampleKey: keyof typeof SAMPLE_CERTIFICATES) => {
    setBinaryDER(null);
    setSelectedFileName(`${sampleKey}.crt`);
    setInputPEM(SAMPLE_CERTIFICATES[sampleKey].pem);
  };

  const handleClear = () => {
    setInputPEM("");
    setBinaryDER(null);
    setSelectedFileName(null);
    setInspection(null);
    setError(null);
  };

  return (
    <div className="space-y-8">
      <ToolHeader
        toolId="cert-inspector"
        title="X.509 Certificate Inspector & Exporter"
        description="Inspect, validate, and convert SSL/TLS certificates client-side. Convert between PEM, binary DER, Public Key SPKI, and JSON with zero data egress."
        badge="Zero Egress"
      />

      {/* Input Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mr-1">
              Sample Certs:
            </span>
            <button
              onClick={() => handleLoadSample("wildcard")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Wildcard TLS
            </button>
            <button
              onClick={() => handleLoadSample("rootCa")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Root CA
            </button>
            <button
              onClick={() => handleLoadSample("expired")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Expired Sample
            </button>
          </div>

          <button
            onClick={handleClear}
            className="shrink-0 whitespace-nowrap self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Input</span>
          </button>
        </div>

        {/* Dropzone */}
        <FileDropzone
          accept=".pem,.crt,.cer,.der,application/x-x509-ca-cert,text/plain"
          onFileSelect={handleFileDrop}
          title="Drop Certificate (.crt, .pem, .der, .cer) or click to browse"
          description="Supports ASCII PEM & Binary DER • Decoded entirely in-browser"
        />

        {/* Text Area for pasting */}
        {!binaryDER && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs text-zinc-500">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {selectedFileName ? `Loaded: ${selectedFileName}` : "Paste PEM or Base64 Encoded Certificate"}
              </span>
              <span>{inputPEM.length} characters</span>
            </div>
            <textarea
              id="cert-pem-input"
              aria-label="Paste PEM or Base64 encoded certificate"
              value={inputPEM}
              onChange={(e) => {
                setBinaryDER(null);
                setSelectedFileName(null);
                setInputPEM(e.target.value);
              }}
              placeholder="-----BEGIN CERTIFICATE-----&#10;MIID...&#10;-----END CERTIFICATE-----"
              className="w-full h-32 p-4 font-mono text-xs bg-transparent resize-y text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none selection:bg-emerald-500/20"
              spellCheck={false}
            />
          </div>
        )}

        {binaryDER && (
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">
              Loaded binary DER file {selectedFileName ? `(${selectedFileName}, ${binaryDER.byteLength} bytes)` : `(${binaryDER.byteLength} bytes)`}.
            </span>
            <button
              onClick={() => {
                setBinaryDER(null);
                if (inspection) setInputPEM(inspection.rawPEM);
              }}
              className="text-emerald-500 hover:underline font-medium"
            >
              Switch to PEM Editor
            </button>
          </div>
        )}
      </div>

      {/* Parsing Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold">Unable to Parse Certificate</p>
            <p className="text-red-400 font-mono">{error}</p>
          </div>
        </div>
      )}

      {/* Main Inspection View */}
      {inspection && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Status & Validity Banner */}
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl ${
                    inspection.validity.status === "valid"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : inspection.validity.status === "expired"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-amber-500/10 text-amber-500"
                  }`}
                >
                  {inspection.validity.status === "valid" ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : inspection.validity.status === "expired" ? (
                    <ShieldAlert className="w-6 h-6" />
                  ) : (
                    <Clock className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        inspection.validity.status === "valid"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : inspection.validity.status === "expired"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {inspection.validity.status === "valid"
                        ? "Active & Valid"
                        : inspection.validity.status === "expired"
                        ? "Certificate Expired"
                        : "Not Yet Valid"}
                    </span>

                    {inspection.isSelfSigned && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        Self-Signed
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {inspection.subject.commonName || "Unknown Subject"}
                  </h2>
                </div>
              </div>

              {/* Time Remaining Metric */}
              <div className="text-right">
                <span className="text-xs text-zinc-500">Validity Window</span>
                <p className="text-sm font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                  {inspection.validity.status === "valid"
                    ? `${inspection.validity.daysRemaining} days remaining`
                    : inspection.validity.status === "expired"
                    ? `Expired ${Math.abs(inspection.validity.daysRemaining)} days ago`
                    : `Valid in ${Math.abs(inspection.validity.daysRemaining)} days`}
                </p>
              </div>
            </div>

            {/* Validity Timeline Progress Bar */}
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>Not Before: {new Date(inspection.validity.notBefore).toLocaleDateString()}</span>
                <span>Not After: {new Date(inspection.validity.notAfter).toLocaleDateString()}</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    inspection.validity.status === "valid"
                      ? "bg-emerald-500"
                      : inspection.validity.status === "expired"
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${inspection.validity.percentElapsed}%` }}
                />
              </div>
            </div>
          </div>

          {/* Export & Format Conversion Hub */}
          <div className="p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Certificate Format Conversion & Export
                </h3>
              </div>
              <span className="text-[11px] text-zinc-500">
                100% In-Browser Conversion (Zero Data Uploads)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Download PEM */}
              <button
                onClick={() =>
                  handleDownloadFile(
                    inspection.rawPEM,
                    `${inspection.subject.commonName || "certificate"}.crt`,
                    "application/x-x509-ca-cert"
                  )
                }
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/50 hover:shadow-sm transition-all text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    PEM Format (.crt)
                  </p>
                  <p className="text-[10px] text-zinc-500">ASCII Armored Base64</p>
                </div>
                <Download className="w-4 h-4 text-emerald-500" />
              </button>

              {/* Download DER */}
              <button
                onClick={() =>
                  handleDownloadFile(
                    inspection.rawDER as BlobPart,
                    `${inspection.subject.commonName || "certificate"}.der`,
                    "application/pkix-cert"
                  )
                }
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/50 hover:shadow-sm transition-all text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Binary DER (.der)
                  </p>
                  <p className="text-[10px] text-zinc-500">Raw ASN.1 Byte Sequence</p>
                </div>
                <Download className="w-4 h-4 text-emerald-500" />
              </button>

              {/* Download Public Key */}
              <button
                onClick={() =>
                  handleDownloadFile(
                    inspection.publicKey.pem,
                    `${inspection.subject.commonName || "public-key"}.pub.pem`,
                    "application/x-pem-file"
                  )
                }
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/50 hover:shadow-sm transition-all text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Public Key SPKI (.pem)
                  </p>
                  <p className="text-[10px] text-zinc-500">Extracted Public Key</p>
                </div>
                <Key className="w-4 h-4 text-emerald-500" />
              </button>

              {/* Download JSON Report */}
              <button
                onClick={() =>
                  handleDownloadFile(
                    generateJSONReport(inspection),
                    `${inspection.subject.commonName || "cert"}-report.json`,
                    "application/json"
                  )
                }
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/50 hover:shadow-sm transition-all text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    JSON Audit Report (.json)
                  </p>
                  <p className="text-[10px] text-zinc-500">Structured Metadata</p>
                </div>
                <FileCode className="w-4 h-4 text-emerald-500" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab("general")}
              className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "general"
                  ? "border-emerald-500 text-emerald-500"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              General & Subject / Issuer
            </button>
            <button
              onClick={() => setActiveTab("crypto")}
              className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "crypto"
                  ? "border-emerald-500 text-emerald-500"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Cryptographic Details & Hashes
            </button>
            <button
              onClick={() => setActiveTab("extensions")}
              className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "extensions"
                  ? "border-emerald-500 text-emerald-500"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Extensions & Key Usage ({inspection.extensions.length})
            </button>
            <button
              onClick={() => setActiveTab("raw")}
              className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "raw"
                  ? "border-emerald-500 text-emerald-500"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Raw PEM & Public Key
            </button>
          </div>

          {/* Tab 1: General Information */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subject Box */}
                <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Subject (Issued To)
                    </span>
                  </div>

                  <dl className="space-y-2.5 text-xs">
                    <div>
                      <dt className="text-zinc-400">Common Name (CN)</dt>
                      <dd className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                        {inspection.subject.commonName || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-400">Organization (O)</dt>
                      <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                        {inspection.subject.organization || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-400">Organizational Unit (OU)</dt>
                      <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                        {inspection.subject.organizationalUnit || "—"}
                      </dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <dt className="text-zinc-400">Country (C)</dt>
                        <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                          {inspection.subject.country || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-zinc-400">State (ST)</dt>
                        <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                          {inspection.subject.state || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-zinc-400">Locality (L)</dt>
                        <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                          {inspection.subject.locality || "—"}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </div>

                {/* Issuer Box */}
                <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Issuer (Issued By)
                    </span>
                  </div>

                  <dl className="space-y-2.5 text-xs">
                    <div>
                      <dt className="text-zinc-400">Common Name (CN)</dt>
                      <dd className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                        {inspection.issuer.commonName || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-400">Organization (O)</dt>
                      <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                        {inspection.issuer.organization || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-400">Organizational Unit (OU)</dt>
                      <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                        {inspection.issuer.organizationalUnit || "—"}
                      </dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <dt className="text-zinc-400">Country (C)</dt>
                        <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                          {inspection.issuer.country || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-zinc-400">State (ST)</dt>
                        <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                          {inspection.issuer.state || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-zinc-400">Locality (L)</dt>
                        <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                          {inspection.issuer.locality || "—"}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Subject Alternative Names (SANs) */}
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">
                    Subject Alternative Names (SANs)
                  </h3>
                  <span className="text-xs font-mono text-zinc-500">
                    ({inspection.sans.length} domains)
                  </span>
                </div>

                {inspection.sans.length === 0 ? (
                  <p className="text-xs text-zinc-400">No SAN extension present in this certificate.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {inspection.sans.map((san, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
                      >
                        <span className="text-[10px] text-zinc-400">{san.type}:</span>
                        <span>{san.value}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Cryptographic Details */}
          {activeTab === "crypto" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Algorithm & Keys */}
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Key & Signature Parameters
                </h3>

                <dl className="space-y-3 text-xs">
                  <div>
                    <dt className="text-zinc-400">Public Key Algorithm</dt>
                    <dd className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                      {inspection.publicKey.algorithm}
                      {inspection.publicKey.keySize && ` (${inspection.publicKey.keySize}-bit)`}
                      {inspection.publicKey.curve && ` Curve: ${inspection.publicKey.curve}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-400">Signature Algorithm</dt>
                    <dd className="font-mono text-zinc-800 dark:text-zinc-200">
                      {inspection.signatureAlgorithm}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-400">X.509 Format Version</dt>
                    <dd className="font-mono text-zinc-800 dark:text-zinc-200">
                      Version {inspection.version}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-400">Serial Number</dt>
                    <dd className="font-mono text-xs text-zinc-800 dark:text-zinc-200 break-all bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      {inspection.serialNumber}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Fingerprints & Hashes */}
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Cryptographic Thumbprints
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-zinc-400">SHA-256 Fingerprint</span>
                      <button
                        onClick={() => handleCopy(inspection.fingerprints.sha256, "sha256")}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-500 hover:underline"
                      >
                        {copiedField === "sha256" ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 break-all bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      {inspection.fingerprints.sha256}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-zinc-400">SHA-1 Fingerprint (Legacy)</span>
                      <button
                        onClick={() => handleCopy(inspection.fingerprints.sha1, "sha1")}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-500 hover:underline"
                      >
                        {copiedField === "sha1" ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 break-all bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      {inspection.fingerprints.sha1}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Extensions & Policies */}
          {activeTab === "extensions" && (
            <div className="space-y-6">
              {/* Key Usage Badges */}
              {(inspection.keyUsage.length > 0 || inspection.extendedKeyUsage.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inspection.keyUsage.length > 0 && (
                    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Key Usage
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {inspection.keyUsage.map((ku, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          >
                            {ku}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {inspection.extendedKeyUsage.length > 0 && (
                    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Extended Key Usage (EKU)
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {inspection.extendedKeyUsage.map((eku, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded-md text-xs font-medium bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                          >
                            {eku}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Extensions Table */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Standard X.509 v3 Extensions ({inspection.extensions.length})
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {inspection.extensions.map((ext, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {ext.name}
                          </span>
                          {ext.critical && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-500/10 text-red-500 border border-red-500/20">
                              CRITICAL
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-zinc-400">{ext.oid}</p>
                      </div>

                      <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300 max-w-lg truncate">
                        {ext.valueSummary}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Raw PEM & Public Key Viewers */}
          {activeTab === "raw" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Certificate PEM */}
              <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Certificate PEM (.crt / .pem)</span>
                  <button
                    onClick={() => handleCopy(inspection.rawPEM, "rawPem")}
                    className="inline-flex items-center gap-1 text-emerald-500 hover:underline"
                  >
                    {copiedField === "rawPem" ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy PEM</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  id="cert-clean-pem"
                  aria-label="Clean normalized PEM certificate output"
                  readOnly
                  value={inspection.rawPEM}
                  className="w-full h-80 p-4 font-mono text-xs bg-transparent text-zinc-800 dark:text-zinc-200 focus:outline-none resize-none"
                  spellCheck={false}
                />
              </div>

              {/* Public Key SPKI PEM */}
              <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Extracted Public Key SPKI (.pub.pem)</span>
                  <button
                    onClick={() => handleCopy(inspection.publicKey.pem, "pubKeyPem")}
                    className="inline-flex items-center gap-1 text-emerald-500 hover:underline"
                  >
                    {copiedField === "pubKeyPem" ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Public Key</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  id="cert-public-key"
                  aria-label="Extracted Public Key SPKI PEM output"
                  readOnly
                  value={inspection.publicKey.pem}
                  className="w-full h-80 p-4 font-mono text-xs bg-transparent text-zinc-800 dark:text-zinc-200 focus:outline-none resize-none"
                  spellCheck={false}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
