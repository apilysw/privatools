"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  ArrowLeftRight,
  Copy,
  Check,
  Download,
  Trash2,
  FileCode,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import {
  DataFormat,
  convertData,
  SAMPLE_DATA,
  ConversionResult,
} from "@/lib/converters/data";
import { formatBytes } from "@/lib/converters/image";

const formatLabels: Record<DataFormat, string> = {
  json: "JSON",
  yaml: "YAML",
  csv: "CSV",
  xml: "XML",
};

const mimeTypes: Record<DataFormat, string> = {
  json: "application/json",
  yaml: "text/yaml",
  csv: "text/csv",
  xml: "application/xml",
};

const extensions: Record<DataFormat, string> = {
  json: ".json",
  yaml: ".yaml",
  csv: ".csv",
  xml: ".xml",
};

export default function DataConverterPage() {
  const [fromFormat, setFromFormat] = useState<DataFormat>("json");
  const [toFormat, setToFormat] = useState<DataFormat>("yaml");
  const [inputText, setInputText] = useState<string>(SAMPLE_DATA.json);
  const [result, setResult] = useState<ConversionResult>({
    output: "",
    durationMs: 0,
    inputBytes: 0,
    outputBytes: 0,
  });
  const [copied, setCopied] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [, startTransition] = useTransition();

  // Run conversion whenever input or formats change
  useEffect(() => {
    startTransition(() => {
      const res = convertData(inputText, fromFormat, toFormat);
      setResult(res);
    });
  }, [inputText, fromFormat, toFormat]);

  const handleSwap = () => {
    if (result.output && !result.error) {
      setInputText(result.output);
    }
    const temp = fromFormat;
    setFromFormat(toFormat);
    setToFormat(temp);
  };

  const handleCopy = async () => {
    if (!result.output) return;
    await navigator.clipboard.writeText(result.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result.output) return;
    const blob = new Blob([result.output], { type: mimeTypes[toFormat] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted-${Date.now()}${extensions[toFormat]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadSample = () => {
    setDroppedFile(null);
    setInputText(SAMPLE_DATA[fromFormat]);
  };

  const handleFileDrop = (file: File) => {
    setDroppedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputText(content);

      // Auto-detect format from file extension
      const name = file.name.toLowerCase();
      if (name.endsWith(".json")) setFromFormat("json");
      else if (name.endsWith(".yaml") || name.endsWith(".yml")) setFromFormat("yaml");
      else if (name.endsWith(".csv")) setFromFormat("csv");
      else if (name.endsWith(".xml")) setFromFormat("xml");
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        toolId="data-converter"
        title="Structured Data Converter"
        description="Convert seamlessly between JSON, YAML, CSV, and XML with instant validation and zero data uploads."
        badge="Bi-directional"
      />

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        {/* Format Selectors */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label htmlFor="from-format" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              From:
            </label>
            <select
              id="from-format"
              aria-label="Source format"
              value={fromFormat}
              onChange={(e) => setFromFormat(e.target.value as DataFormat)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {(Object.keys(formatLabels) as DataFormat[]).map((fmt) => (
                <option key={fmt} value={fmt}>
                  {formatLabels[fmt]}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSwap}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            title="Swap source and target formats"
            aria-label="Swap source and target formats"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="to-format" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              To:
            </label>
            <select
              id="to-format"
              aria-label="Target format"
              value={toFormat}
              onChange={(e) => setToFormat(e.target.value as DataFormat)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {(Object.keys(formatLabels) as DataFormat[]).map((fmt) => (
                <option key={fmt} value={fmt}>
                  {formatLabels[fmt]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Load Sample</span>
          </button>

          <button
            onClick={() => {
              setInputText("");
              setDroppedFile(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* File Dropzone */}
      <FileDropzone
        accept=".json,.yaml,.yml,.csv,.xml,text/*"
        onFileSelect={handleFileDrop}
        selectedFile={droppedFile}
        onClear={() => {
          setDroppedFile(null);
          setInputText("");
        }}
        title="Drag & drop JSON, YAML, CSV, or XML file"
        description="Files parsed locally in memory — zero server transmission"
      />

      {/* Dual Pane Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Pane */}
        <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs">
            <div className="flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-300">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <span>Input ({formatLabels[fromFormat]})</span>
            </div>
            <span className="text-zinc-400 font-mono">
              {formatBytes(result.inputBytes)}
            </span>
          </div>

          <textarea
            id="source-data-input"
            aria-label="Source data input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Paste your ${formatLabels[fromFormat]} data here...`}
            className="w-full h-96 p-4 font-mono text-xs bg-transparent resize-y text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none selection:bg-emerald-500/20"
            spellCheck={false}
          />
        </div>

        {/* Output Pane */}
        <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs">
            <div className="flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-300">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <span>Output ({formatLabels[toFormat]})</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-mono">
                {formatBytes(result.outputBytes)}
              </span>

              <button
                onClick={handleCopy}
                disabled={!result.output || !!result.error}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 transition-colors"
                title="Copy to clipboard"
                aria-label="Copy output to clipboard"
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
                title="Download file"
                aria-label="Download converted file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {result.error ? (
            <div className="p-6 h-96 flex flex-col items-center justify-center text-center bg-red-500/5 text-red-500 space-y-2">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-semibold">Format Parsing Error</p>
              <p className="text-xs text-red-400 max-w-md font-mono bg-red-500/10 p-3 rounded-xl break-words">
                {result.error}
              </p>
            </div>
          ) : (
            <textarea
              id="converted-data-output"
              aria-label="Converted data output"
              readOnly
              value={result.output}
              placeholder={`Converted ${formatLabels[toFormat]} output will appear here...`}
              className="w-full h-96 p-4 font-mono text-xs bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none resize-y selection:bg-emerald-500/20"
              spellCheck={false}
            />
          )}
        </div>
      </div>

      {/* Execution Benchmark Footer */}
      {!result.error && result.output && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              Converted in <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{result.durationMs} ms</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              Input: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{formatBytes(result.inputBytes)}</strong>
            </span>
            <span>→</span>
            <span>
              Output: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{formatBytes(result.outputBytes)}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
