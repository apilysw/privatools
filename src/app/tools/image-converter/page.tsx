"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Trash2,
  Sliders,
  Sparkles,
  ArrowRight,
  Check,
  ImageIcon,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import {
  ImageFormat,
  convertImageClientSide,
  ConvertedImageResult,
  formatBytes,
} from "@/lib/converters/image";

export default function ImageConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>("image/webp");
  const [quality, setQuality] = useState<number>(0.85);
  const [maxWidth, setMaxWidth] = useState<number>(0); // 0 means original
  const [result, setResult] = useState<ConvertedImageResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load preview when file selected
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setResult(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Run conversion when file, format, quality or dimensions change
  useEffect(() => {
    if (!file) return;

    let isMounted = true;
    setIsProcessing(true);

    convertImageClientSide(file, {
      format: targetFormat,
      quality,
      maxWidth: maxWidth > 0 ? maxWidth : undefined,
    })
      .then((res) => {
        if (isMounted) {
          setResult(res);
          setIsProcessing(false);
        }
      })
      .catch((err) => {
        console.error("Image conversion error:", err);
        if (isMounted) setIsProcessing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [file, targetFormat, quality, maxWidth]);

  const handleDownload = () => {
    if (!result) return;
    const ext =
      targetFormat === "image/webp"
        ? ".webp"
        : targetFormat === "image/png"
        ? ".png"
        : ".jpg";
    const name = file ? file.name.replace(/\.[^/.]+$/, "") : "image";

    const a = document.createElement("a");
    a.href = result.url;
    a.download = `${name}-converted${ext}`;
    a.click();
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        title="Client-Side Image Lab"
        description="Convert, compress, and resize images locally in your browser. Files never touch a remote server."
        badge="100% Local"
      />

      {/* File Dropzone */}
      <FileDropzone
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml"
        onFileSelect={(f) => setFile(f)}
        selectedFile={file}
        onClear={handleClear}
        title="Select or drop an image here"
        description="Supports PNG, JPEG, WebP, GIF, SVG • Processed securely in memory"
      />

      {file && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            {/* Format Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Target Format
              </label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value as ImageFormat)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="image/webp">WebP (High Compression)</option>
                <option value="image/jpeg">JPEG (Universal)</option>
                <option value="image/png">PNG (Lossless Transparency)</option>
              </select>
            </div>

            {/* Quality Slider (for WebP and JPEG) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Quality
                </label>
                <span className="text-xs font-mono font-bold text-emerald-500">
                  {Math.round(quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                disabled={targetFormat === "image/png"}
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 disabled:opacity-40"
              />
              <p className="text-[10px] text-zinc-400">
                {targetFormat === "image/png"
                  ? "PNG is strictly lossless (quality slider disabled)"
                  : "Lower quality yields smaller file size"}
              </p>
            </div>

            {/* Max Width Resize */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Max Width Limit
                </label>
                <span className="text-xs font-mono text-zinc-500">
                  {maxWidth > 0 ? `${maxWidth}px` : "Original"}
                </span>
              </div>
              <select
                value={maxWidth}
                onChange={(e) => setMaxWidth(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value={0}>Original Dimensions</option>
                <option value={1920}>Full HD (1920px max)</option>
                <option value={1280}>Standard (1280px max)</option>
                <option value={800}>Compact (800px max)</option>
                <option value={400}>Thumbnail (400px max)</option>
              </select>
            </div>
          </div>

          {/* Results Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Card */}
            <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-zinc-500" />
                  <span>Original Image</span>
                </div>
                <span className="font-mono text-zinc-400">
                  {formatBytes(file.size)}
                </span>
              </div>
              <div className="p-4 flex items-center justify-center bg-zinc-100/50 dark:bg-zinc-950/40 min-h-[300px]">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Original Preview"
                    className="max-h-72 object-contain rounded-lg shadow-sm"
                  />
                )}
              </div>
            </div>

            {/* Converted Card */}
            <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Converted Image</span>
                </div>

                {result && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-500 font-bold">
                      {formatBytes(result.convertedBytes)}
                    </span>
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 flex items-center justify-center bg-zinc-100/50 dark:bg-zinc-950/40 min-h-[300px]">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2 text-xs text-zinc-400">
                    <span className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></span>
                    <span>Converting locally...</span>
                  </div>
                ) : result?.url ? (
                  <img
                    src={result.url}
                    alt="Converted Preview"
                    className="max-h-72 object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <span className="text-xs text-zinc-400">Rendering preview...</span>
                )}
              </div>
            </div>
          </div>

          {/* Savings Metric Ribbon */}
          {result && (
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Check className="w-4 h-4" />
                </span>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {result.savingsPercentage > 0
                      ? `Saved ${result.savingsPercentage}% of file size!`
                      : "File converted successfully"}
                  </p>
                  <p className="text-zinc-500">
                    {formatBytes(result.originalBytes)} → {formatBytes(result.convertedBytes)} (
                    {result.width} × {result.height} px)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-zinc-500">
                <span>Processed locally in</span>
                <strong className="font-mono text-zinc-900 dark:text-zinc-100">
                  {result.durationMs} ms
                </strong>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
