"use client";

import { useState, useEffect, useRef } from "react";
import {
  Hash,
  FileCheck,
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  Download,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  UploadCloud,
  X,
  Sliders,
  CheckCircle,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { formatBytes } from "@/lib/converters/image";
import {
  ComputedHashes,
  HashFormat,
  computeAllHashes,
  computeAllTextHashes,
  computeHmac,
  deriveKeyPbkdf2,
  formatHashOutput,
  verifyChecksum,
  generateSampleFile,
  generateChecksumManifest,
} from "@/lib/converters/hash";

type StudioMode = "file" | "text" | "hmac" | "pbkdf2";

export default function HashStudioPage() {
  const [activeMode, setActiveMode] = useState<StudioMode>("file");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // --- FILE MODE STATE ---
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    type: string;
    bytes: Uint8Array;
  } | null>(null);
  const [fileHashes, setFileHashes] = useState<ComputedHashes | null>(null);
  const [fileFormat, setFileFormat] = useState<HashFormat>("hex-lower");
  const [targetVerifyHash, setTargetVerifyHash] = useState<string>("");
  const [isFileComputing, setIsFileComputing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- TEXT MODE STATE ---
  const [textInput, setTextInput] = useState<string>(
    "The quick brown fox jumps over the lazy dog"
  );
  const [textHashes, setTextHashes] = useState<ComputedHashes | null>(null);
  const [textFormat, setTextFormat] = useState<HashFormat>("hex-lower");

  // --- HMAC STATE ---
  const [hmacMessage, setHmacMessage] = useState<string>(
    '{"event":"payment.completed","amount":9900,"currency":"USD"}'
  );
  const [hmacSecret, setHmacSecret] = useState<string>("super-secret-api-key-2026");
  const [hmacShowSecret, setHmacShowSecret] = useState<boolean>(false);
  const [hmacAlgorithm, setHmacAlgorithm] = useState<
    "SHA-256" | "SHA-512" | "SHA-384" | "SHA-1"
  >("SHA-256");
  const [hmacFormat, setHmacFormat] = useState<HashFormat>("hex-lower");
  const [hmacResult, setHmacResult] = useState<string>("");

  // --- PBKDF2 STATE ---
  const [pbkdf2Password, setPbkdf2Password] = useState<string>("correct-horse-battery-staple");
  const [pbkdf2ShowPassword, setPbkdf2ShowPassword] = useState<boolean>(false);
  const [pbkdf2Salt, setPbkdf2Salt] = useState<string>("salt_privatools_demo");
  const [pbkdf2Iterations, setPbkdf2Iterations] = useState<number>(100000);
  const [pbkdf2KeyLength, setPbkdf2KeyLength] = useState<number>(256);
  const [pbkdf2HashAlg, setPbkdf2HashAlg] = useState<"SHA-256" | "SHA-512">("SHA-256");
  const [pbkdf2Format, setPbkdf2Format] = useState<HashFormat>("hex-lower");
  const [pbkdf2Result, setPbkdf2Result] = useState<string>("");
  const [isPbkdf2Deriving, setIsPbkdf2Deriving] = useState<boolean>(false);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // --- COMPUTE TEXT HASHES ---
  useEffect(() => {
    let isMounted = true;
    computeAllTextHashes(textInput).then((hashes) => {
      if (isMounted) setTextHashes(hashes);
    });
    return () => {
      isMounted = false;
    };
  }, [textInput]);

  // --- COMPUTE HMAC ---
  useEffect(() => {
    let isMounted = true;
    if (!hmacSecret) {
      Promise.resolve().then(() => {
        if (isMounted) setHmacResult("");
      });
      return;
    }
    computeHmac(hmacMessage, hmacSecret, hmacAlgorithm).then((rawHex) => {
      if (isMounted) {
        setHmacResult(formatHashOutput(rawHex, hmacFormat));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [hmacMessage, hmacSecret, hmacAlgorithm, hmacFormat]);

  // --- COMPUTE PBKDF2 ---
  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) setIsPbkdf2Deriving(true);
    });
    deriveKeyPbkdf2(
      pbkdf2Password,
      pbkdf2Salt,
      pbkdf2Iterations,
      pbkdf2KeyLength,
      pbkdf2HashAlg
    )
      .then((rawHex) => {
        if (isMounted) {
          setPbkdf2Result(formatHashOutput(rawHex, pbkdf2Format));
          setIsPbkdf2Deriving(false);
        }
      })
      .catch((err) => {
        console.error("PBKDF2 Error:", err);
        if (isMounted) setIsPbkdf2Deriving(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    pbkdf2Password,
    pbkdf2Salt,
    pbkdf2Iterations,
    pbkdf2KeyLength,
    pbkdf2HashAlg,
    pbkdf2Format,
  ]);

  // Handle file drop / upload
  const handleProcessFile = async (file: File) => {
    setIsFileComputing(true);
    try {
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const hashes = await computeAllHashes(uint8);

      setSelectedFile({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        bytes: uint8,
      });
      setFileHashes(hashes);
    } catch (err) {
      console.error("File hashing error:", err);
    } finally {
      setIsFileComputing(false);
    }
  };

  // Load sample file
  const handleLoadSampleFile = async () => {
    setIsFileComputing(true);
    const sample = generateSampleFile();
    const hashes = await computeAllHashes(sample.bytes);
    setSelectedFile({
      name: sample.name,
      size: sample.bytes.byteLength,
      type: "text/plain",
      bytes: sample.bytes,
    });
    setFileHashes(hashes);
    setIsFileComputing(false);
  };

  // Generate random salt
  const handleGenerateSalt = () => {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    let saltHex = "";
    for (let i = 0; i < randomBytes.length; i++) {
      saltHex += randomBytes[i].toString(16).padStart(2, "0");
    }
    setPbkdf2Salt(saltHex);
  };

  // Download Manifest
  const handleDownloadManifest = () => {
    if (!selectedFile || !fileHashes) return;
    const manifest = generateChecksumManifest(selectedFile.name, fileHashes);
    const blob = new Blob([manifest], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedFile.name}.sha256`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Check verification
  const verification = fileHashes && targetVerifyHash.trim()
    ? verifyChecksum(fileHashes, targetVerifyHash)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <ToolHeader
          title="Cryptographic Checksum & File Hash Studio"
          description="Compute and verify SHA-256, SHA-512, MD5, CRC32, HMACs, and PBKDF2 keys directly in your browser. 100% zero data egress."
          badge="Zero Egress"
        />

        {/* Quick Sample File Button */}
        {activeMode === "file" && (
          <button
            onClick={handleLoadSampleFile}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample File</span>
          </button>
        )}
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <button
          onClick={() => setActiveMode("file")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeMode === "file"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <FileCheck className="w-4 h-4 text-emerald-500" />
          <span>File Checksum & Verifier</span>
        </button>

        <button
          onClick={() => setActiveMode("text")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeMode === "text"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Hash className="w-4 h-4 text-emerald-500" />
          <span>Live String & Text Hasher</span>
        </button>

        <button
          onClick={() => setActiveMode("hmac")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeMode === "hmac"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <KeyRound className="w-4 h-4 text-emerald-500" />
          <span>HMAC Message Auth</span>
        </button>

        <button
          onClick={() => setActiveMode("pbkdf2")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeMode === "pbkdf2"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Sliders className="w-4 h-4 text-emerald-500" />
          <span>PBKDF2 Key Derivation</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FILE CHECKSUM & INTEGRITY VERIFIER */}
      {/* ========================================================================= */}
      {activeMode === "file" && (
        <div className="space-y-6">
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-emerald-500/50 bg-white dark:bg-zinc-900/60 cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleProcessFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="p-4 mb-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center">
                Select or drop any file to compute checksums
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center">
                ISO images, software binaries, archives, documents • Processed 100% in RAM via Web Crypto
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 break-all">
                      {selectedFile.name}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {formatBytes(selectedFile.size)} • {selectedFile.type || "binary"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Change File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcessFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFileHashes(null);
                      setTargetVerifyHash("");
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Checksum Verification Box */}
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Verify Against Expected Checksum</span>
                  </label>
                  {targetVerifyHash && (
                    <button
                      onClick={() => setTargetVerifyHash("")}
                      className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={targetVerifyHash}
                    onChange={(e) => setTargetVerifyHash(e.target.value)}
                    placeholder="Paste expected SHA-256, SHA-512, MD5, or SHA-1 hash to verify file integrity..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Match Result Banner */}
                {verification && (
                  <div
                    className={`p-4 rounded-xl text-xs flex items-start gap-3 transition-all ${
                      verification.matched
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {verification.matched ? (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                    )}
                    <div className="space-y-0.5">
                      <p className="font-bold text-sm">
                        {verification.matched
                          ? `Checksum Verified! Matches ${verification.matchedAlgorithm}`
                          : "Checksum Mismatch Warning"}
                      </p>
                      <p className="opacity-90 leading-relaxed">
                        {verification.matched
                          ? `The provided checksum perfectly matches the file's ${verification.matchedAlgorithm} digest. The file is authentic and intact.`
                          : "The pasted checksum does not match any computed algorithm (SHA-256, SHA-512, SHA-384, SHA-1, MD5, CRC32). The file may be corrupt or modified."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Output Format Switcher & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-500">Format:</span>
                  <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <button
                      onClick={() => setFileFormat("hex-lower")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        fileFormat === "hex-lower"
                          ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      Hex (lower)
                    </button>
                    <button
                      onClick={() => setFileFormat("hex-upper")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        fileFormat === "hex-upper"
                          ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      Hex (UPPER)
                    </button>
                    <button
                      onClick={() => setFileFormat("base64")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        fileFormat === "base64"
                          ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      Base64
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadManifest}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .sha256 Manifest</span>
                  </button>
                </div>
              </div>

              {/* Hash Results Grid */}
              {fileHashes && (
                <div className="space-y-3">
                  {[
                    {
                      name: "SHA-256",
                      desc: "Modern standard security checksum (256-bit)",
                      val: formatHashOutput(fileHashes.sha256, fileFormat),
                      rawHex: fileHashes.sha256,
                      highlight: true,
                    },
                    {
                      name: "SHA-512",
                      desc: "High-security cryptographic digest (512-bit)",
                      val: formatHashOutput(fileHashes.sha512, fileFormat),
                      rawHex: fileHashes.sha512,
                    },
                    {
                      name: "SHA-384",
                      desc: "NSA Suite B cryptographic hash (384-bit)",
                      val: formatHashOutput(fileHashes.sha384, fileFormat),
                      rawHex: fileHashes.sha384,
                    },
                    {
                      name: "SHA-1",
                      desc: "Legacy Git commit and package hash (160-bit)",
                      val: formatHashOutput(fileHashes.sha1, fileFormat),
                      rawHex: fileHashes.sha1,
                    },
                    {
                      name: "MD5",
                      desc: "Legacy file integrity & ISO checksum (128-bit)",
                      val: formatHashOutput(fileHashes.md5, fileFormat),
                      rawHex: fileHashes.md5,
                    },
                    {
                      name: "CRC-32",
                      desc: "Standard archive & ZIP integrity code (32-bit)",
                      val: formatHashOutput(fileHashes.crc32, fileFormat),
                      rawHex: fileHashes.crc32,
                    },
                  ].map((item) => {
                    const isMatched =
                      verification &&
                      verification.matched &&
                      verification.normalizedTarget === item.rawHex.toLowerCase();
                    return (
                      <div
                        key={item.name}
                        className={`p-4 rounded-2xl border transition-all ${
                          isMatched
                            ? "border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/5"
                            : item.highlight
                            ? "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm"
                            : "border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              • {item.desc}
                            </span>
                            {isMatched && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                                MATCHED
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleCopy(item.val, item.name)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-emerald-500 transition-colors"
                          >
                            {copiedKey === item.name ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800/60 overflow-x-auto">
                          <code className="text-xs font-mono text-zinc-800 dark:text-zinc-200 break-all select-all">
                            {item.val}
                          </code>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE STRING & TEXT HASHER */}
      {/* ========================================================================= */}
      {activeMode === "text" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Input String / Text
                </label>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Type or paste text to compute hashes in real time
                </p>
              </div>

              {/* Sample Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-zinc-400 mr-1">Presets:</span>
                <button
                  onClick={() => setTextInput("")}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                >
                  Empty String
                </button>
                <button
                  onClick={() =>
                    setTextInput("The quick brown fox jumps over the lazy dog")
                  }
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                >
                  Fox Vector
                </button>
                <button
                  onClick={() => setTextInput("Privatools Zero-Knowledge")}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                >
                  Privatools
                </button>
                <button
                  onClick={() => setTextInput("admin:SecretPassword123!")}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                >
                  Password
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text here..."
              className="w-full p-3.5 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />

            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <div className="flex items-center gap-3">
                <span>{textInput.length} characters</span>
                <span>•</span>
                <span>{new TextEncoder().encode(textInput).length} UTF-8 bytes</span>
              </div>

              {/* Format Switcher */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <button
                  onClick={() => setTextFormat("hex-lower")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    textFormat === "hex-lower"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500"
                  }`}
                >
                  hex
                </button>
                <button
                  onClick={() => setTextFormat("hex-upper")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    textFormat === "hex-upper"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500"
                  }`}
                >
                  HEX
                </button>
                <button
                  onClick={() => setTextFormat("base64")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    textFormat === "base64"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500"
                  }`}
                >
                  Base64
                </button>
              </div>
            </div>
          </div>

          {/* Hash Cards Grid */}
          {textHashes && (
            <div className="space-y-3">
              {[
                {
                  name: "SHA-256",
                  desc: "256-bit",
                  val: formatHashOutput(textHashes.sha256, textFormat),
                  highlight: true,
                },
                {
                  name: "SHA-512",
                  desc: "512-bit",
                  val: formatHashOutput(textHashes.sha512, textFormat),
                },
                {
                  name: "SHA-384",
                  desc: "384-bit",
                  val: formatHashOutput(textHashes.sha384, textFormat),
                },
                {
                  name: "SHA-1",
                  desc: "160-bit",
                  val: formatHashOutput(textHashes.sha1, textFormat),
                },
                {
                  name: "MD5",
                  desc: "128-bit (RFC 1321)",
                  val: formatHashOutput(textHashes.md5, textFormat),
                },
                {
                  name: "CRC-32",
                  desc: "32-bit",
                  val: formatHashOutput(textHashes.crc32, textFormat),
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.highlight
                      ? "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm"
                      : "border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {item.name} <span className="font-normal text-zinc-400">({item.desc})</span>
                    </span>

                    <button
                      onClick={() => handleCopy(item.val, `text-${item.name}`)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-emerald-500 transition-colors"
                    >
                      {copiedKey === `text-${item.name}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800/60 overflow-x-auto">
                    <code className="text-xs font-mono text-zinc-800 dark:text-zinc-200 break-all select-all">
                      {item.val}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HMAC MESSAGE AUTHENTICATION */}
      {/* ========================================================================= */}
      {activeMode === "hmac" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-5">
            {/* Algorithm & Format Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                  Hash Algorithm
                </label>
                <select
                  value={hmacAlgorithm}
                  onChange={(e) => setHmacAlgorithm(e.target.value as "SHA-256" | "SHA-512" | "SHA-384" | "SHA-1")}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="SHA-256">HMAC-SHA256 (Most Common / Webhooks)</option>
                  <option value="SHA-512">HMAC-SHA512 (High Security)</option>
                  <option value="SHA-384">HMAC-SHA384</option>
                  <option value="SHA-1">HMAC-SHA1 (Legacy APIs)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                  Output Format
                </label>
                <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <button
                    onClick={() => setHmacFormat("hex-lower")}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${
                      hmacFormat === "hex-lower"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "text-zinc-500"
                    }`}
                  >
                    Hex (lower)
                  </button>
                  <button
                    onClick={() => setHmacFormat("hex-upper")}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${
                      hmacFormat === "hex-upper"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "text-zinc-500"
                    }`}
                  >
                    Hex (UPPER)
                  </button>
                  <button
                    onClick={() => setHmacFormat("base64")}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${
                      hmacFormat === "base64"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "text-zinc-500"
                    }`}
                  >
                    Base64
                  </button>
                </div>
              </div>
            </div>

            {/* Secret Key Input */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                HMAC Secret Key
              </label>
              <div className="relative">
                <input
                  type={hmacShowSecret ? "text" : "password"}
                  value={hmacSecret}
                  onChange={(e) => setHmacSecret(e.target.value)}
                  placeholder="Enter secret key..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setHmacShowSecret(!hmacShowSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {hmacShowSecret ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                Message Payload
              </label>
              <textarea
                rows={4}
                value={hmacMessage}
                onChange={(e) => setHmacMessage(e.target.value)}
                placeholder="Enter message to authenticate..."
                className="w-full p-3.5 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Generated Signature */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Computed HMAC Signature</span>
                </span>

                <button
                  onClick={() => handleCopy(hmacResult, "hmac-sig")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-emerald-500 transition-colors"
                >
                  {copiedKey === "hmac-sig" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Signature</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                <code className="text-xs font-mono text-emerald-600 dark:text-emerald-400 break-all select-all font-semibold">
                  {hmacResult || "—"}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PBKDF2 KEY DERIVATION */}
      {/* ========================================================================= */}
      {activeMode === "pbkdf2" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-5">
            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                Master Password
              </label>
              <div className="relative">
                <input
                  type={pbkdf2ShowPassword ? "text" : "password"}
                  value={pbkdf2Password}
                  onChange={(e) => setPbkdf2Password(e.target.value)}
                  placeholder="Enter master password..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setPbkdf2ShowPassword(!pbkdf2ShowPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {pbkdf2ShowPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Salt & Generator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Cryptographic Salt
                </label>
                <button
                  onClick={handleGenerateSalt}
                  className="text-[11px] font-medium text-emerald-500 hover:text-emerald-600 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Random Salt</span>
                </button>
              </div>
              <input
                type="text"
                value={pbkdf2Salt}
                onChange={(e) => setPbkdf2Salt(e.target.value)}
                placeholder="Enter salt or generate random..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                  Iterations (Cost)
                </label>
                <input
                  type="number"
                  min={1000}
                  max={1000000}
                  step={10000}
                  value={pbkdf2Iterations}
                  onChange={(e) => setPbkdf2Iterations(parseInt(e.target.value, 10) || 1000)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="flex items-center gap-1 mt-1.5">
                  <button
                    onClick={() => setPbkdf2Iterations(10000)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800"
                  >
                    10k
                  </button>
                  <button
                    onClick={() => setPbkdf2Iterations(100000)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800"
                  >
                    100k
                  </button>
                  <button
                    onClick={() => setPbkdf2Iterations(310000)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800"
                  >
                    310k (OWASP)
                  </button>
                  <button
                    onClick={() => setPbkdf2Iterations(600000)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800"
                  >
                    600k
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                  Key Bit-Length
                </label>
                <select
                  value={pbkdf2KeyLength}
                  onChange={(e) => setPbkdf2KeyLength(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value={128}>128-bit (16 bytes)</option>
                  <option value={256}>256-bit (32 bytes - AES-256)</option>
                  <option value={512}>512-bit (64 bytes)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                  Hash PRF
                </label>
                <select
                  value={pbkdf2HashAlg}
                  onChange={(e) => setPbkdf2HashAlg(e.target.value as "SHA-256" | "SHA-512")}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="SHA-256">HMAC-SHA256 (Standard)</option>
                  <option value="SHA-512">HMAC-SHA512</option>
                </select>
              </div>
            </div>

            {/* Output Format */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">Output Format:</span>
              <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => setPbkdf2Format("hex-lower")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    pbkdf2Format === "hex-lower"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500"
                  }`}
                >
                  Hex (lower)
                </button>
                <button
                  onClick={() => setPbkdf2Format("hex-upper")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    pbkdf2Format === "hex-upper"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500"
                  }`}
                >
                  Hex (UPPER)
                </button>
                <button
                  onClick={() => setPbkdf2Format("base64")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    pbkdf2Format === "base64"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500"
                  }`}
                >
                  Base64
                </button>
              </div>
            </div>

            {/* Result Display */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Derived Master Key</span>
                  {isPbkdf2Deriving && (
                    <RefreshCw className="w-3 h-3 text-zinc-400 animate-spin" />
                  )}
                </span>

                <button
                  onClick={() => handleCopy(pbkdf2Result, "pbkdf2-key")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-emerald-500 transition-colors"
                >
                  {copiedKey === "pbkdf2-key" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Key</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                <code className="text-xs font-mono text-emerald-600 dark:text-emerald-400 break-all select-all font-semibold">
                  {pbkdf2Result || "—"}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Guarantee Note */}
      <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            100% Client-Side Cryptographic Sandbox
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            All checksums and derived keys are generated directly inside your browser’s V8/SpiderMonkey runtime via native Web Crypto. Your files, sensitive payloads, and master passwords never leave your local device.
          </p>
        </div>
      </div>
    </div>
  );
}
