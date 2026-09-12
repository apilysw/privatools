"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Download,
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Edit3,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import {
  decodeJwt,
  verifyJwtSignature,
  signJwt,
  SAMPLE_JWTS,
  DecodedJwt,
  formatRelativeTime,
} from "@/lib/converters/jwt";

export default function JwtInspectorPage() {
  const [tokenInput, setTokenInput] = useState<string>(SAMPLE_JWTS.oidc_active.token);
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Signature verification state
  const [secretInput, setSecretInput] = useState<string>(SAMPLE_JWTS.oidc_active.secret);
  const [publicKeyPem, setPublicKeyPem] = useState<string>("");
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    valid: boolean;
    message: string;
  }>({ tested: false, valid: false, message: "" });
  const [showSecret, setShowSecret] = useState<boolean>(false);

  // Live editor state for payload & re-signing
  const [isEditingPayload, setIsEditingPayload] = useState<boolean>(false);
  const [payloadEditText, setPayloadEditText] = useState<string>("");
  const [headerEditText, setHeaderEditText] = useState<string>("");

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Tick timer for live expiration countdown
  const [, setTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Decode JWT whenever tokenInput changes
  useEffect(() => {
    startTransition(() => {
      if (!tokenInput.trim()) {
        setDecoded(null);
        setError(null);
        setVerificationResult({ tested: false, valid: false, message: "" });
        return;
      }

      try {
        const res = decodeJwt(tokenInput);
        setDecoded(res);
        setError(null);
        setPayloadEditText(JSON.stringify(res.payload, null, 2));
        setHeaderEditText(JSON.stringify(res.header, null, 2));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setDecoded(null);
        setVerificationResult({ tested: false, valid: false, message: "" });
      }
    });
  }, [tokenInput]);

  // Automatic signature verification when decoded or keys change
  useEffect(() => {
    let active = true;
    if (!decoded) return;

    const alg = decoded.algorithm.toUpperCase();
    if (alg.startsWith("HS") && secretInput) {
      verifyJwtSignature(tokenInput, secretInput, "secret").then((res) => {
        if (active) setVerificationResult({ tested: true, ...res });
      });
    } else if (alg.startsWith("RS") && publicKeyPem.trim()) {
      verifyJwtSignature(tokenInput, publicKeyPem, "public-pem").then((res) => {
        if (active) setVerificationResult({ tested: true, ...res });
      });
    } else {
      Promise.resolve().then(() => {
        if (active) setVerificationResult({ tested: false, valid: false, message: "" });
      });
    }
    return () => {
      active = false;
    };
  }, [decoded, tokenInput, secretInput, publicKeyPem]);

  const handleCopy = async (text: string, fieldId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadSample = (sampleKey: keyof typeof SAMPLE_JWTS) => {
    const sample = SAMPLE_JWTS[sampleKey];
    setIsEditingPayload(false);
    setTokenInput(sample.token);
    setSecretInput(sample.secret || "");
    if ("publicKeyPem" in sample && sample.publicKeyPem) {
      setPublicKeyPem(sample.publicKeyPem);
    } else {
      setPublicKeyPem("");
    }
  };

  const handleClear = () => {
    setTokenInput("");
    setSecretInput("");
    setPublicKeyPem("");
    setDecoded(null);
    setError(null);
    setVerificationResult({ tested: false, valid: false, message: "" });
    setIsEditingPayload(false);
  };

  // Re-sign token from edited header and payload
  const handleReSign = async () => {
    if (!decoded) return;
    try {
      const parsedHeader = JSON.parse(headerEditText);
      const parsedPayload = JSON.parse(payloadEditText);
      const alg = (parsedHeader.alg as string) || "HS256";

      if (alg.startsWith("HS")) {
        const key = secretInput || "secret";
        const newToken = await signJwt(parsedHeader, parsedPayload, key, alg);
        setTokenInput(newToken);
        setIsEditingPayload(false);
      } else {
        alert("Client-side re-signing in this sandbox currently supports HMAC algorithms (HS256, HS384, HS512).");
      }
    } catch (err) {
      alert(`Invalid JSON in editor: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Split token into visual colored parts
  const tokenParts = useMemo(() => {
    const parts = tokenInput.trim().split(".");
    return {
      header: parts[0] || "",
      payload: parts[1] || "",
      signature: parts[2] || "",
    };
  }, [tokenInput]);

  return (
    <div className="space-y-8">
      <ToolHeader
        toolId="jwt-inspector"
        title="JWT & OAuth Token Debugger"
        description="Decode, inspect, verify Web Crypto signatures, and test tokens client-side. Zero server transmission guaranteed."
        badge="Zero Egress"
      />

      {/* Preset Buttons & Clear */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mr-1">
            Sample Tokens:
          </span>
          <button
            onClick={() => handleLoadSample("oidc_active")}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            Active OIDC (HS256)
          </button>
          <button
            onClick={() => handleLoadSample("rs256_enterprise")}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            Enterprise API (RS256)
          </button>
          <button
            onClick={() => handleLoadSample("expired_session")}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            Expired Session
          </button>
        </div>

        <button
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Main Dual-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Encoded Token (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs">
              <span className="font-bold text-zinc-700 dark:text-zinc-300">
                Encoded Token
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(tokenInput, "token")}
                  disabled={!tokenInput}
                  className="inline-flex items-center gap-1 text-emerald-500 hover:underline disabled:opacity-40"
                >
                  {copiedField === "token" ? (
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
            </div>

            {/* Token Segment Pills Legend */}
            <div className="px-4 py-2 bg-zinc-50/80 dark:bg-zinc-950/30 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-semibold">
                HEADER
              </span>
              <span className="text-zinc-400">.</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 font-semibold">
                PAYLOAD
              </span>
              <span className="text-zinc-400">.</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500 font-semibold">
                SIGNATURE
              </span>
            </div>

            {/* Encoded Textarea */}
            <textarea
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste Bearer or JWT token here..."
              className="w-full h-80 p-4 font-mono text-xs bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none resize-y selection:bg-emerald-500/20"
              spellCheck={false}
            />

            {/* Formatted colored preview if valid */}
            {tokenParts.header && tokenParts.payload && (
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-950/20 text-xs font-mono break-all leading-relaxed max-h-40 overflow-y-auto">
                <span className="text-rose-500 font-semibold">{tokenParts.header}</span>
                <span className="text-zinc-400">.</span>
                <span className="text-purple-500 font-semibold">{tokenParts.payload}</span>
                {tokenParts.signature && (
                  <>
                    <span className="text-zinc-400">.</span>
                    <span className="text-cyan-500 font-semibold">{tokenParts.signature}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick Export Cards */}
          {decoded && (
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                Export Options
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() =>
                    handleDownload(
                      JSON.stringify(decoded.payload, null, 2),
                      `jwt-payload-${decoded.claims.sub || "user"}.json`,
                      "application/json"
                    )
                  }
                  className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-emerald-500/40 text-left flex items-center justify-between"
                >
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    Payload JSON
                  </span>
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                </button>
                <button
                  onClick={() =>
                    handleDownload(
                      decoded.rawToken,
                      `token-${decoded.claims.sub || "jwt"}.jwt`,
                      "text/plain"
                    )
                  }
                  className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-emerald-500/40 text-left flex items-center justify-between"
                >
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    Raw Token
                  </span>
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Decoded Data & Verification (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {error && (
            <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 flex items-start gap-3 text-xs">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to Parse JWT</p>
                <p className="font-mono text-red-400 mt-1">{error}</p>
              </div>
            </div>
          )}

          {decoded && (
            <>
              {/* Expiration & Status Banner */}
              <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        decoded.validity.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : decoded.validity.status === "expired"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                          : decoded.validity.status === "not_yet_valid"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {decoded.validity.status === "active"
                        ? "Active Token"
                        : decoded.validity.status === "expired"
                        ? "Token Expired"
                        : decoded.validity.status === "not_yet_valid"
                        ? "Not Yet Valid"
                        : "Perpetual Token"}
                    </span>

                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      Alg: {decoded.algorithm}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {decoded.claims.exp
                        ? formatRelativeTime(decoded.claims.exp)
                        : decoded.validity.expiresInText}
                    </span>
                  </div>
                </div>

                {/* Progress bar if exp exists */}
                {decoded.claims.exp && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                      <span>
                        Issued:{" "}
                        {decoded.claims.iat
                          ? new Date(decoded.claims.iat * 1000).toLocaleString()
                          : "Unknown"}
                      </span>
                      <span>
                        Expires: {new Date(decoded.claims.exp * 1000).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          decoded.validity.status === "active"
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${decoded.validity.percentElapsed}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Standard Claims Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                  {decoded.claims.sub && (
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Subject (sub)</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate block">
                        {decoded.claims.sub}
                      </span>
                    </div>
                  )}
                  {decoded.claims.iss && (
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Issuer (iss)</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate block">
                        {decoded.claims.iss}
                      </span>
                    </div>
                  )}
                  {decoded.claims.aud && (
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Audience (aud)</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate block">
                        {Array.isArray(decoded.claims.aud)
                          ? decoded.claims.aud.join(", ")
                          : decoded.claims.aud}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Header Box */}
              <div className="rounded-3xl border border-rose-500/20 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5 bg-rose-500/5 border-b border-rose-500/10 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <span className="uppercase tracking-wider text-[11px]">Decoded Header (Algorithm & Token Type)</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(decoded.header, null, 2), "header")}
                    className="hover:underline flex items-center gap-1"
                  >
                    {copiedField === "header" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <textarea
                  readOnly={!isEditingPayload}
                  value={headerEditText}
                  onChange={(e) => setHeaderEditText(e.target.value)}
                  className="w-full h-24 p-4 font-mono text-xs bg-transparent text-zinc-800 dark:text-zinc-200 focus:outline-none resize-none"
                  spellCheck={false}
                />
              </div>

              {/* Payload Box */}
              <div className="rounded-3xl border border-purple-500/20 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5 bg-purple-500/5 border-b border-purple-500/10 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  <span className="uppercase tracking-wider text-[11px]">Decoded Payload (Data & Claims)</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsEditingPayload((prev) => !prev)}
                      className="hover:underline flex items-center gap-1 text-purple-500"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditingPayload ? "Exit Edit" : "Edit Claims"}</span>
                    </button>
                    <button
                      onClick={() => handleCopy(JSON.stringify(decoded.payload, null, 2), "payload")}
                      className="hover:underline flex items-center gap-1"
                    >
                      {copiedField === "payload" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly={!isEditingPayload}
                  value={payloadEditText}
                  onChange={(e) => setPayloadEditText(e.target.value)}
                  className={`w-full h-64 p-4 font-mono text-xs bg-transparent text-zinc-800 dark:text-zinc-200 focus:outline-none resize-y ${
                    isEditingPayload ? "bg-purple-500/[0.03] border-b border-purple-500/20" : ""
                  }`}
                  spellCheck={false}
                />

                {isEditingPayload && (
                  <div className="p-3 bg-purple-500/5 border-t border-purple-500/10 flex items-center justify-between">
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                      Edit payload JSON above, then re-sign with HMAC secret below
                    </span>
                    <button
                      onClick={handleReSign}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-Sign Token</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Signature Verification Box */}
              <div className="rounded-3xl border border-cyan-500/20 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
                    <Key className="w-4 h-4" />
                    <span>Cryptographic Signature Verification ({decoded.algorithm})</span>
                  </div>

                  {verificationResult.tested && (
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        verificationResult.valid
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      }`}
                    >
                      {verificationResult.valid ? (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Signature Verified</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-4 h-4" />
                          <span>Invalid Signature</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Secret Key Input (HMAC) */}
                {decoded.algorithm.startsWith("HS") && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 flex items-center justify-between">
                      <span>Shared Secret Key ({decoded.algorithm})</span>
                      <span className="text-[11px] text-zinc-400">100% In-Browser Web Crypto</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSecret ? "text" : "password"}
                        value={secretInput}
                        onChange={(e) => setSecretInput(e.target.value)}
                        placeholder="Enter HMAC secret string..."
                        className="w-full px-3 py-2 pr-10 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Public Key PEM Input (RSA) */}
                {decoded.algorithm.startsWith("RS") && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 flex items-center justify-between">
                      <span>RSA Public Key (SPKI PEM)</span>
                      <span className="text-[11px] text-zinc-400">Verifies {decoded.algorithm}</span>
                    </label>
                    <textarea
                      value={publicKeyPem}
                      onChange={(e) => setPublicKeyPem(e.target.value)}
                      placeholder="-----BEGIN PUBLIC KEY-----&#10;MIIBIjANBgkqhki...&#10;-----END PUBLIC KEY-----"
                      className="w-full h-28 p-3 font-mono text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      spellCheck={false}
                    />
                  </div>
                )}

                {verificationResult.tested && (
                  <p className="text-xs text-zinc-500 font-mono">
                    {verificationResult.message}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
