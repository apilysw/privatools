"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  GitCompare,
  ArrowLeftRight,
  Copy,
  Check,
  Download,
  Sparkles,
  Trash2,
  UploadCloud,
  Columns,
  AlignJustify,
  FileText,
  FileCode,
  CheckCircle2,
  ShieldCheck,
  Edit3,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import {
  alignSideBySide,
  computeUnifiedDiff,
  generatePatch,
  calculateDiffStats,
  DIFF_PRESETS,
  DiffViewMode,
  SideBySideRow,
  UnifiedHunk,
  DiffStats,
} from "@/lib/converters/diff";

export default function DiffViewerPage() {
  const [activePreset, setActivePreset] = useState<string>("typescript");
  const defaultPreset = DIFF_PRESETS[0];

  const [oldFileName, setOldFileName] = useState<string>(defaultPreset.oldFileName);
  const [newFileName, setNewFileName] = useState<string>(defaultPreset.newFileName);
  const [oldText, setOldText] = useState<string>(defaultPreset.oldText);
  const [newText, setNewText] = useState<string>(defaultPreset.newText);

  // Settings
  const [viewMode, setViewMode] = useState<DiffViewMode>("split");
  const [showEditor, setShowEditor] = useState<boolean>(true);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState<boolean>(false);
  const [wordDiffEnabled, setWordDiffEnabled] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);

  // Switch preset
  const handleSelectPreset = (presetId: string) => {
    const preset = DIFF_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    setOldFileName(preset.oldFileName);
    setNewFileName(preset.newFileName);
    setOldText(preset.oldText);
    setNewText(preset.newText);
  };

  // Swap Left & Right sides
  const handleSwapSides = () => {
    setOldFileName(newFileName);
    setNewFileName(oldFileName);
    setOldText(newText);
    setNewText(oldText);
  };

  // Clear inputs
  const handleClear = () => {
    setOldFileName("original.txt");
    setNewFileName("modified.txt");
    setOldText("");
    setNewText("");
    setActivePreset("");
  };

  // Handle file uploads
  const handleLeftFileUpload = async (file: File) => {
    const text = await file.text();
    setOldFileName(file.name);
    setOldText(text);
    setActivePreset("");
  };

  const handleRightFileUpload = async (file: File) => {
    const text = await file.text();
    setNewFileName(file.name);
    setNewText(text);
    setActivePreset("");
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Compute diffs with memoization
  const sideBySideRows: SideBySideRow[] = useMemo(() => {
    return alignSideBySide(oldText, newText, { ignoreWhitespace });
  }, [oldText, newText, ignoreWhitespace]);

  const unifiedHunks: UnifiedHunk[] = useMemo(() => {
    return computeUnifiedDiff(oldFileName, newFileName, oldText, newText, {
      ignoreWhitespace,
    });
  }, [oldFileName, newFileName, oldText, newText, ignoreWhitespace]);

  const patchText: string = useMemo(() => {
    return generatePatch(oldFileName, newFileName, oldText, newText, {
      ignoreWhitespace,
    });
  }, [oldFileName, newFileName, oldText, newText, ignoreWhitespace]);

  const stats: DiffStats = useMemo(() => {
    return calculateDiffStats(oldText, newText, { ignoreWhitespace });
  }, [oldText, newText, ignoreWhitespace]);

  // Download .patch file
  const handleDownloadPatch = () => {
    const blob = new Blob([patchText], { type: "text/x-diff;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${oldFileName.replace(/\.[^/.]+$/, "")}_to_${newFileName.replace(/\.[^/.]+$/, "")}.patch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ToolHeader
        title="Code & Text Diff / Patch Studio"
        description="Compare code, configuration files, and text documents side-by-side or inline with word-level highlight differences. 100% zero data egress."
        badge="Zero Egress"
      />

      {/* Sample Diffs & Clear Block */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mr-1">
            Sample Diffs:
          </span>
          {DIFF_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                activePreset === p.id
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Input</span>
        </button>
      </div>

      {/* Editor Collapse / Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        {/* View Mode Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "split"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
          <button
            onClick={() => setViewMode("unified")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "unified"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <AlignJustify className="w-3.5 h-3.5" />
            <span>Unified (Inline)</span>
          </button>
          <button
            onClick={() => setViewMode("patch")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "patch"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Raw Patch</span>
          </button>
        </div>

        {/* Diff Stats Badges */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
            +{stats.additions} additions
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-semibold border border-red-500/20">
            -{stats.deletions} deletions
          </span>
          {stats.modifications > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
              ~{stats.modifications} modified
            </span>
          )}
        </div>

        {/* Actions & Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSwapSides}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
            title="Swap Left and Right texts"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-500" />
            <span>Swap Sides</span>
          </button>

          <button
            onClick={() => setShowEditor(!showEditor)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              showEditor
                ? "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{showEditor ? "Hide Editors" : "Edit Text"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EDITORS (EXPANDABLE) */}
      {/* ========================================================================= */}
      {showEditor && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
          {/* Left / Original Pane */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70"></span>
                <input
                  type="text"
                  value={oldFileName}
                  onChange={(e) => setOldFileName(e.target.value)}
                  placeholder="original.txt"
                  className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-transparent border-b border-dashed border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => leftFileInputRef.current?.click()}
                  className="text-[11px] font-medium text-emerald-500 hover:text-emerald-600 flex items-center gap-1"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
                <input
                  ref={leftFileInputRef}
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleLeftFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => handleCopy(oldText, "left-text")}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {copiedKey === "left-text" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              value={oldText}
              onChange={(e) => setOldText(e.target.value)}
              placeholder="Paste original text or code here..."
              className="w-full p-3 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-y"
            />
            <div className="text-[11px] text-zinc-400 font-mono">
              {stats.totalOldLines} lines • {oldText.length} chars
            </div>
          </div>

          {/* Right / Modified Pane */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="modified.txt"
                  className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-transparent border-b border-dashed border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => rightFileInputRef.current?.click()}
                  className="text-[11px] font-medium text-emerald-500 hover:text-emerald-600 flex items-center gap-1"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
                <input
                  ref={rightFileInputRef}
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleRightFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => handleCopy(newText, "right-text")}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {copiedKey === "right-text" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Paste modified text or code here..."
              className="w-full p-3 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-y"
            />
            <div className="text-[11px] text-zinc-400 font-mono">
              {stats.totalNewLines} lines • {newText.length} chars
            </div>
          </div>
        </div>
      )}

      {/* Diff Options Toolbar */}
      <div className="flex items-center justify-between text-xs px-1 text-zinc-500">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Ignore Whitespace Differences</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={wordDiffEnabled}
              onChange={(e) => setWordDiffEnabled(e.target.checked)}
              className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Intra-Line Word Highlighting</span>
          </label>
        </div>

        <div>
          <span>
            Comparing <span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">{oldFileName}</span> →{" "}
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{newFileName}</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: SIDE-BY-SIDE (SPLIT) VIEW */}
      {/* ========================================================================= */}
      {viewMode === "split" && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          {/* Table Headers */}
          <div className="grid grid-cols-2 divide-x divide-zinc-200 dark:divide-zinc-800 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-xs font-mono py-2 px-4 text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{oldFileName}</span>
              <span className="text-[11px] text-zinc-400">(Original)</span>
            </div>
            <div className="flex items-center gap-2 pl-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{newFileName}</span>
              <span className="text-[11px] text-zinc-400">(Modified)</span>
            </div>
          </div>

          {/* Rows */}
          <div className="overflow-x-auto text-xs font-mono divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {sideBySideRows.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                No text to compare. Paste content above or choose a preset.
              </div>
            ) : (
              sideBySideRows.map((row, idx) => {
                const left = row.left;
                const right = row.right;

                return (
                  <div
                    key={idx}
                    className="grid grid-cols-2 divide-x divide-zinc-200 dark:divide-zinc-800/80 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Left Cell */}
                    <div
                      className={`flex items-start min-h-[24px] ${
                        !left
                          ? "bg-zinc-100/40 dark:bg-zinc-950/40"
                          : left.type === "removed"
                          ? "bg-red-500/10 text-red-700 dark:text-red-300"
                          : left.type === "modified"
                          ? "bg-amber-500/10 text-zinc-800 dark:text-zinc-200"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <span className="w-10 text-right pr-2 select-none text-[10px] text-zinc-400 pt-0.5 flex-shrink-0">
                        {left ? left.num : ""}
                      </span>
                      <span className="w-5 text-center select-none font-bold text-red-500 flex-shrink-0 pt-0.5">
                        {left?.type === "removed" ? "-" : left?.type === "modified" ? "~" : ""}
                      </span>
                      <div className="flex-1 py-0.5 pr-2 whitespace-pre-wrap break-all leading-5">
                        {left ? (
                          wordDiffEnabled && left.wordDiff ? (
                            left.wordDiff.map((part, wIdx) => (
                              <span
                                key={wIdx}
                                className={
                                  part.removed
                                    ? "bg-red-500/30 text-red-800 dark:text-red-200 font-semibold px-0.5 rounded"
                                    : ""
                                }
                              >
                                {part.value}
                              </span>
                            ))
                          ) : (
                            left.text
                          )
                        ) : null}
                      </div>
                    </div>

                    {/* Right Cell */}
                    <div
                      className={`flex items-start min-h-[24px] ${
                        !right
                          ? "bg-zinc-100/40 dark:bg-zinc-950/40"
                          : right.type === "added"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : right.type === "modified"
                          ? "bg-emerald-500/10 text-zinc-800 dark:text-zinc-200"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <span className="w-10 text-right pr-2 select-none text-[10px] text-zinc-400 pt-0.5 flex-shrink-0">
                        {right ? right.num : ""}
                      </span>
                      <span className="w-5 text-center select-none font-bold text-emerald-500 flex-shrink-0 pt-0.5">
                        {right?.type === "added" ? "+" : right?.type === "modified" ? "~" : ""}
                      </span>
                      <div className="flex-1 py-0.5 pr-2 whitespace-pre-wrap break-all leading-5">
                        {right ? (
                          wordDiffEnabled && right.wordDiff ? (
                            right.wordDiff.map((part, wIdx) => (
                              <span
                                key={wIdx}
                                className={
                                  part.added
                                    ? "bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 font-semibold px-0.5 rounded"
                                    : ""
                                }
                              >
                                {part.value}
                              </span>
                            ))
                          ) : (
                            right.text
                          )
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: UNIFIED (INLINE) VIEW */}
      {/* ========================================================================= */}
      {viewMode === "unified" && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 py-2.5 px-4 text-xs font-mono text-zinc-500 flex items-center justify-between">
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              --- {oldFileName} &nbsp;&nbsp;+++ {newFileName}
            </span>
            <span className="text-[11px] text-zinc-400">{unifiedHunks.length} diff hunks</span>
          </div>

          <div className="overflow-x-auto text-xs font-mono">
            {unifiedHunks.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                No differences found between documents.
              </div>
            ) : (
              unifiedHunks.map((hunk, hIdx) => (
                <div key={hIdx} className="border-b border-zinc-200 dark:border-zinc-800/80 last:border-b-0">
                  {/* Hunk Header */}
                  <div className="bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-4 py-1.5 font-bold border-y border-indigo-100 dark:border-indigo-900/40 text-[11px]">
                    {hunk.header}
                  </div>

                  {/* Hunk Lines */}
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {hunk.lines.map((line, lIdx) => (
                      <div
                        key={lIdx}
                        className={`flex items-start py-0.5 leading-5 ${
                          line.type === "add"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : line.type === "del"
                            ? "bg-red-500/10 text-red-700 dark:text-red-300"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <span className="w-10 text-right pr-2 text-[10px] text-zinc-400 select-none flex-shrink-0 pt-0.5">
                          {line.oldLineNumber || ""}
                        </span>
                        <span className="w-10 text-right pr-2 text-[10px] text-zinc-400 select-none flex-shrink-0 pt-0.5">
                          {line.newLineNumber || ""}
                        </span>
                        <span
                          className={`w-5 text-center font-bold select-none flex-shrink-0 pt-0.5 ${
                            line.type === "add"
                              ? "text-emerald-500"
                              : line.type === "del"
                              ? "text-red-500"
                              : "text-zinc-300 dark:text-zinc-700"
                          }`}
                        >
                          {line.type === "add" ? "+" : line.type === "del" ? "-" : " "}
                        </span>
                        <span className="flex-1 pr-2 whitespace-pre-wrap break-all">{line.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: RAW PATCH VIEW */}
      {/* ========================================================================= */}
      {viewMode === "patch" && (
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Standard Unified Patch (.patch)
              </h3>
              <p className="text-xs text-zinc-500">
                Conforms to GNU diff and git apply specifications
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(patchText, "patch-raw")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {copiedKey === "patch-raw" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied Patch</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Patch</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadPatch}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .patch File</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 overflow-x-auto">
            <pre className="text-xs font-mono text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {patchText}
            </pre>
          </div>
        </div>
      )}

      {/* Security & Privacy Callout */}
      <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            100% In-Memory Client-Side Diff Processing
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Proprietary source code, unreleased API endpoints, and private legal contracts are compared entirely in your browser’s V8/SpiderMonkey runtime. Zero strings, files, or diff tokens ever leave your machine.
          </p>
        </div>
      </div>
    </div>
  );
}
