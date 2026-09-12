"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Copy,
  Check,
  Download,
  Binary,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import {
  TextOperation,
  processText,
  TextTransformResult,
} from "@/lib/converters/text";
import { formatBytes } from "@/lib/converters/image";

const operations: { id: TextOperation; label: string; group: string }[] = [
  { id: "base64-encode", label: "Base64 Encode", group: "Encoding" },
  { id: "base64-decode", label: "Base64 Decode", group: "Encoding" },
  { id: "hex-encode", label: "Hex Encode", group: "Encoding" },
  { id: "hex-decode", label: "Hex Decode", group: "Encoding" },
  { id: "url-encode", label: "URL Percent Encode", group: "Web" },
  { id: "url-decode", label: "URL Percent Decode", group: "Web" },
  { id: "html-escape", label: "HTML Entity Escape", group: "Web" },
  { id: "html-unescape", label: "HTML Entity Unescape", group: "Web" },
  { id: "case-camel", label: "camelCase", group: "Cases" },
  { id: "case-snake", label: "snake_case", group: "Cases" },
  { id: "case-kebab", label: "kebab-case", group: "Cases" },
  { id: "case-pascal", label: "PascalCase", group: "Cases" },
  { id: "case-constant", label: "CONSTANT_CASE", group: "Cases" },
];

export default function TextConverterPage() {
  const [activeOp, setActiveOp] = useState<TextOperation>("base64-encode");
  const [inputText, setInputText] = useState<string>("Hello, Zero-Knowledge Privacy World!");
  const [result, setResult] = useState<TextTransformResult>({
    output: "",
    durationMs: 0,
    wordCount: 0,
    charCount: 0,
    byteCount: 0,
  });
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      const res = processText(inputText, activeOp);
      setResult(res);
    });
  }, [inputText, activeOp]);

  const handleCopy = async () => {
    if (!result.output) return;
    await navigator.clipboard.writeText(result.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result.output) return;
    const blob = new Blob([result.output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `text-${activeOp}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        toolId="text-converter"
        title="Text & Encoding Studio"
        description="Encode, decode, escape, and transform strings client-side. Zero server requests."
        badge="Zero Egress"
      />

      {/* Operation selector pills */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        {operations.map((op) => (
          <button
            key={op.id}
            onClick={() => setActiveOp(op.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeOp === op.id
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {op.label}
          </button>
        ))}
      </div>

      {/* Editors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-emerald-500" />
              <span>Input String</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
              <span>{inputText.length} chars</span>
              <span>•</span>
              <span>{formatBytes(result.byteCount)}</span>
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste input string here..."
            className="w-full h-80 p-4 font-mono text-xs bg-transparent resize-y text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none selection:bg-emerald-500/20"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Result ({operations.find((o) => o.id === activeOp)?.label})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!result.output || !!result.error}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                disabled={!result.output || !!result.error}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {result.error ? (
            <div className="p-6 h-80 flex flex-col items-center justify-center text-center bg-red-500/5 text-red-500 space-y-2">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-semibold">Transformation Failed</p>
              <p className="text-xs text-red-400 max-w-md font-mono bg-red-500/10 p-3 rounded-xl break-words">
                {result.error}
              </p>
            </div>
          ) : (
            <textarea
              readOnly
              value={result.output}
              placeholder="Output will appear here..."
              className="w-full h-80 p-4 font-mono text-xs bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none resize-y selection:bg-emerald-500/20"
              spellCheck={false}
            />
          )}
        </div>
      </div>

      {/* Execution Benchmark Footer */}
      {!result.error && result.output && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              Computed in <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{result.durationMs} ms</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>Words: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{result.wordCount}</strong></span>
            <span>•</span>
            <span>Length: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{result.charCount}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
