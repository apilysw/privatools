"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Files,
  Scissors,
  RotateCw,
  RotateCcw,
  Download,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  Sparkles,
  Check,
  AlertCircle,
  X,
  UploadCloud,
  CheckCircle2,
  Lock,
  RefreshCw,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { formatBytes } from "@/lib/converters/image";
import {
  getPdfDetails,
  mergePdfs,
  splitPdf,
  transformPdf,
  parsePageRangeString,
  generateSamplePdf,
  PdfDocumentDetails,
  PageTransformConfig,
} from "@/lib/converters/pdf";

type LabMode = "merge" | "split" | "organize";

interface MergeItem {
  id: string;
  name: string;
  size: number;
  bytes: ArrayBuffer;
  pageCount: number;
}

export default function PdfLabPage() {
  const [activeMode, setActiveMode] = useState<LabMode>("merge");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- MERGE STATE ---
  const [mergeFiles, setMergeFiles] = useState<MergeItem[]>([]);
  const [mergeOutputName, setMergeOutputName] = useState("merged-document.pdf");
  const mergeInputRef = useRef<HTMLInputElement>(null);

  // --- SPLIT & EXTRACT STATE ---
  const [splitFile, setSplitFile] = useState<{
    name: string;
    size: number;
    bytes: ArrayBuffer;
  } | null>(null);
  const [splitDetails, setSplitDetails] = useState<PdfDocumentDetails | null>(null);
  const [pageRangeInput, setPageRangeInput] = useState<string>("");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set()); // 0-based
  const [splitOutputName, setSplitOutputName] = useState("extracted-pages.pdf");
  const splitInputRef = useRef<HTMLInputElement>(null);

  // --- ORGANIZE & ROTATE STATE ---
  const [organizeFile, setOrganizeFile] = useState<{
    name: string;
    size: number;
    bytes: ArrayBuffer;
  } | null>(null);
  const [organizeDetails, setOrganizeDetails] = useState<PdfDocumentDetails | null>(null);
  const [pageTransforms, setPageTransforms] = useState<Map<number, PageTransformConfig>>(
    new Map()
  );
  const [organizeOutputName, setOrganizeOutputName] = useState("organized-document.pdf");
  const organizeInputRef = useRef<HTMLInputElement>(null);

  // Clear notices after 5 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Quick sample generator helper
  const handleLoadSamplePdf = async (targetMode: LabMode) => {
    try {
      setIsProcessing(true);
      setErrorMsg(null);
      const sampleBytes = await generateSamplePdf();
      const arrayBuffer = sampleBytes.buffer.slice(
        sampleBytes.byteOffset,
        sampleBytes.byteOffset + sampleBytes.byteLength
      ) as ArrayBuffer;

      const details = await getPdfDetails(arrayBuffer);

      if (targetMode === "merge") {
        const newItem: MergeItem = {
          id: Math.random().toString(36).substring(2, 9),
          name: `sample-report-${mergeFiles.length + 1}.pdf`,
          size: arrayBuffer.byteLength,
          bytes: arrayBuffer,
          pageCount: details.pageCount,
        };
        setMergeFiles((prev) => [...prev, newItem]);
        setSuccessMsg("Sample PDF added to merge list.");
      } else if (targetMode === "split") {
        setSplitFile({
          name: "privatools-sample-doc.pdf",
          size: arrayBuffer.byteLength,
          bytes: arrayBuffer,
        });
        setSplitDetails(details);
        // Default select first page
        setSelectedPages(new Set([0]));
        setPageRangeInput("1");
        setSplitOutputName("sample-extracted.pdf");
        setSuccessMsg("Sample 3-page PDF loaded for extraction.");
      } else if (targetMode === "organize") {
        setOrganizeFile({
          name: "privatools-sample-doc.pdf",
          size: arrayBuffer.byteLength,
          bytes: arrayBuffer,
        });
        setOrganizeDetails(details);
        const map = new Map<number, PageTransformConfig>();
        for (let i = 0; i < details.pageCount; i++) {
          map.set(i, { pageIndex: i, rotationDelta: 0, deleted: false });
        }
        setPageTransforms(map);
        setOrganizeOutputName("sample-organized.pdf");
        setSuccessMsg("Sample 3-page PDF loaded for organization.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to generate sample PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- MERGE HANDLERS ---
  const handleMergeFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);

    const newItems: MergeItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (
        !file.name.toLowerCase().endsWith(".pdf") &&
        file.type !== "application/pdf"
      ) {
        continue;
      }
      try {
        const bytes = await file.arrayBuffer();
        const details = await getPdfDetails(bytes);
        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: file.size,
          bytes,
          pageCount: details.pageCount,
        });
      } catch (err: unknown) {
        setErrorMsg(`Failed to inspect ${file.name}: ${err instanceof Error ? err.message : "Invalid PDF"}`);
      }
    }

    setMergeFiles((prev) => [...prev, ...newItems]);
    setIsProcessing(false);
  };

  const moveMergeItem = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === mergeFiles.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const next = [...mergeFiles];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setMergeFiles(next);
  };

  const removeMergeItem = (id: string) => {
    setMergeFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleExecuteMerge = async () => {
    if (mergeFiles.length < 2) {
      setErrorMsg("Please add at least 2 PDF files to merge.");
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const mergedBytes = await mergePdfs(
        mergeFiles.map((f) => ({ name: f.name, bytes: f.bytes }))
      );

      downloadPdf(mergedBytes, mergeOutputName || "merged-document.pdf");
      setSuccessMsg(`Successfully merged ${mergeFiles.length} PDFs!`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to merge PDF documents.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- SPLIT & EXTRACT HANDLERS ---
  const handleSplitFileUpload = async (file: File) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const bytes = await file.arrayBuffer();
      const details = await getPdfDetails(bytes);

      setSplitFile({
        name: file.name,
        size: file.size,
        bytes,
      });
      setSplitDetails(details);
      // Default select all pages
      const allIndices = new Set<number>();
      for (let i = 0; i < details.pageCount; i++) allIndices.add(i);
      setSelectedPages(allIndices);
      setPageRangeInput(`1-${details.pageCount}`);
      setSplitOutputName(
        file.name.replace(/\.pdf$/i, "") + "-extracted.pdf"
      );
    } catch (err: unknown) {
      setErrorMsg(`Could not read PDF: ${err instanceof Error ? err.message : "Invalid format"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePageRangeChange = (rangeStr: string) => {
    setPageRangeInput(rangeStr);
    if (!splitDetails) return;
    const indices = parsePageRangeString(rangeStr, splitDetails.pageCount);
    setSelectedPages(new Set(indices));
  };

  const togglePageSelection = (pageIndex: number) => {
    const next = new Set(selectedPages);
    if (next.has(pageIndex)) {
      next.delete(pageIndex);
    } else {
      next.add(pageIndex);
    }
    setSelectedPages(next);

    // Reconstruct readable range string
    const sorted = Array.from(next).sort((a, b) => a - b);
    if (sorted.length === 0) {
      setPageRangeInput("");
      return;
    }

    // Convert sorted indices to compact range format
    const ranges: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i];
      if (curr === prev + 1) {
        prev = curr;
      } else {
        ranges.push(start === prev ? `${start + 1}` : `${start + 1}-${prev + 1}`);
        start = curr;
        prev = curr;
      }
    }
    ranges.push(start === prev ? `${start + 1}` : `${start + 1}-${prev + 1}`);
    setPageRangeInput(ranges.join(", "));
  };

  const selectAllPages = () => {
    if (!splitDetails) return;
    const all = new Set<number>();
    for (let i = 0; i < splitDetails.pageCount; i++) all.add(i);
    setSelectedPages(all);
    setPageRangeInput(`1-${splitDetails.pageCount}`);
  };

  const deselectAllPages = () => {
    setSelectedPages(new Set());
    setPageRangeInput("");
  };

  const selectOddPages = () => {
    if (!splitDetails) return;
    const odd = new Set<number>();
    for (let i = 0; i < splitDetails.pageCount; i++) {
      if ((i + 1) % 2 === 1) odd.add(i);
    }
    setSelectedPages(odd);
    const sorted = Array.from(odd)
      .map((p) => p + 1)
      .join(", ");
    setPageRangeInput(sorted);
  };

  const selectEvenPages = () => {
    if (!splitDetails) return;
    const even = new Set<number>();
    for (let i = 0; i < splitDetails.pageCount; i++) {
      if ((i + 1) % 2 === 0) even.add(i);
    }
    setSelectedPages(even);
    const sorted = Array.from(even)
      .map((p) => p + 1)
      .join(", ");
    setPageRangeInput(sorted);
  };

  const handleExecuteSplit = async () => {
    if (!splitFile || selectedPages.size === 0) {
      setErrorMsg("Please select at least one page to extract.");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);

      const indices = Array.from(selectedPages).sort((a, b) => a - b);
      const extractedBytes = await splitPdf(splitFile.bytes, indices);

      downloadPdf(extractedBytes, splitOutputName || "extracted-pages.pdf");
      setSuccessMsg(`Extracted ${indices.length} pages successfully!`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to extract pages.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- ORGANIZE & ROTATE HANDLERS ---
  const handleOrganizeFileUpload = async (file: File) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const bytes = await file.arrayBuffer();
      const details = await getPdfDetails(bytes);

      setOrganizeFile({
        name: file.name,
        size: file.size,
        bytes,
      });
      setOrganizeDetails(details);

      const map = new Map<number, PageTransformConfig>();
      for (let i = 0; i < details.pageCount; i++) {
        map.set(i, { pageIndex: i, rotationDelta: 0, deleted: false });
      }
      setPageTransforms(map);
      setOrganizeOutputName(
        file.name.replace(/\.pdf$/i, "") + "-organized.pdf"
      );
    } catch (err: unknown) {
      setErrorMsg(`Could not read PDF: ${err instanceof Error ? err.message : "Invalid format"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const rotatePage = (pageIndex: number, delta: number) => {
    setPageTransforms((prev) => {
      const next = new Map(prev);
      const current = next.get(pageIndex) || {
        pageIndex,
        rotationDelta: 0,
        deleted: false,
      };
      next.set(pageIndex, {
        ...current,
        rotationDelta: (current.rotationDelta + delta) % 360,
      });
      return next;
    });
  };

  const toggleDeletePage = (pageIndex: number) => {
    setPageTransforms((prev) => {
      const next = new Map(prev);
      const current = next.get(pageIndex) || {
        pageIndex,
        rotationDelta: 0,
        deleted: false,
      };
      next.set(pageIndex, {
        ...current,
        deleted: !current.deleted,
      });
      return next;
    });
  };

  const rotateAllPages = (delta: number) => {
    setPageTransforms((prev) => {
      const next = new Map(prev);
      next.forEach((cfg, idx) => {
        const newDelta = (cfg.rotationDelta + delta + 360) % 360;
        next.set(idx, { ...cfg, rotationDelta: newDelta });
      });
      return next;
    });
  };

  const resetAllTransforms = () => {
    if (!organizeDetails) return;
    const map = new Map<number, PageTransformConfig>();
    for (let i = 0; i < organizeDetails.pageCount; i++) {
      map.set(i, { pageIndex: i, rotationDelta: 0, deleted: false });
    }
    setPageTransforms(map);
  };

  const handleExecuteOrganize = async () => {
    if (!organizeFile || !organizeDetails) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const configs = Array.from(pageTransforms.values());
      const keptCount = configs.filter((c) => !c.deleted).length;
      if (keptCount === 0) {
        setErrorMsg("Cannot save document with 0 pages.");
        setIsProcessing(false);
        return;
      }

      const transformedBytes = await transformPdf(organizeFile.bytes, configs);
      downloadPdf(
        transformedBytes,
        organizeOutputName || "organized-document.pdf"
      );
      setSuccessMsg(`Document saved with ${keptCount} active pages!`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to transform PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to trigger client-side download
  const downloadPdf = (bytes: Uint8Array, filename: string) => {
    const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Total pages across all merged files
  const totalMergePages = mergeFiles.reduce((acc, f) => acc + f.pageCount, 0);
  const totalMergeBytes = mergeFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <ToolHeader
          toolId="pdf-lab"
          title="Client-Side PDF Privacy Lab"
          description="Merge, split, extract, rotate, and organize PDF documents in-memory. Zero bytes ever leave your browser."
          badge="Zero Egress"
        />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => handleLoadSamplePdf(activeMode)}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Sample PDF</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <button
          onClick={() => setActiveMode("merge")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeMode === "merge"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Files className="w-4 h-4 text-emerald-500" />
          <span>Merge Multiple PDFs</span>
          {mergeFiles.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-mono">
              {mergeFiles.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMode("split")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeMode === "split"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Scissors className="w-4 h-4 text-emerald-500" />
          <span>Split & Extract Pages</span>
          {splitDetails && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono">
              {selectedPages.size}/{splitDetails.pageCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMode("organize")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeMode === "organize"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <RotateCw className="w-4 h-4 text-emerald-500" />
          <span>Rotate & Organize</span>
          {organizeDetails && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono">
              {organizeDetails.pageCount} pgs
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MERGE PDFS */}
      {/* ========================================================================= */}
      {activeMode === "merge" && (
        <div className="space-y-6">
          {/* Multi-file Dropzone */}
          <div
            onClick={() => mergeInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 bg-white dark:bg-zinc-900/60 cursor-pointer transition-all group"
          >
            <input
              ref={mergeInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={(e) => handleMergeFilesUpload(e.target.files)}
              className="hidden"
            />
            <div className="p-3.5 mb-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center">
              Drop PDF documents here or click to browse
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center">
              Select multiple files to combine in chronological order • Processed locally in memory
            </p>
          </div>

          {/* Merge Queue List */}
          {mergeFiles.length > 0 && (
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Documents to Merge ({mergeFiles.length})
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Total: {totalMergePages} pages • {formatBytes(totalMergeBytes)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => mergeInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More</span>
                  </button>
                  <button
                    onClick={() => setMergeFiles([])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-zinc-100 dark:border-zinc-800/80">
                {mergeFiles.map((file, idx) => (
                  <div
                    key={file.id}
                    className="py-3 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center font-mono text-xs font-semibold text-zinc-400">
                        #{idx + 1}
                      </span>
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {file.pageCount} {file.pageCount === 1 ? "page" : "pages"} •{" "}
                          {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveMergeItem(idx, "up")}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-30 transition-colors"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveMergeItem(idx, "down")}
                        disabled={idx === mergeFiles.length - 1}
                        title="Move Down"
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-30 transition-colors"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeMergeItem(file.id)}
                        title="Remove Document"
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Output Configuration & Merge Button */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-72">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                    Output Filename
                  </label>
                  <input
                    type="text"
                    value={mergeOutputName}
                    onChange={(e) => setMergeOutputName(e.target.value)}
                    placeholder="merged-document.pdf"
                    className="w-full px-3 py-1.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={handleExecuteMerge}
                  disabled={isProcessing || mergeFiles.length < 2}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Merge {mergeFiles.length} Documents ({totalMergePages} Pages)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SPLIT & EXTRACT PAGES */}
      {/* ========================================================================= */}
      {activeMode === "split" && (
        <div className="space-y-6">
          {!splitFile ? (
            <div
              onClick={() => splitInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-emerald-500/50 bg-white dark:bg-zinc-900/60 cursor-pointer transition-all group"
            >
              <input
                ref={splitInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleSplitFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="p-3.5 mb-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                <Scissors className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center">
                Select a PDF to split or extract pages
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center">
                Visual interactive page picker • Parse ranges like 1, 3-5, 8
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {splitFile.name}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {splitDetails?.pageCount} total pages • {formatBytes(splitFile.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => splitInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Change File
                  </button>
                  <input
                    ref={splitInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSplitFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      setSplitFile(null);
                      setSplitDetails(null);
                      setSelectedPages(new Set());
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Selection Controls */}
              <div className="space-y-3 bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Page Selection Range
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      Specify page numbers or ranges separated by commas (e.g. 1, 2-3)
                    </p>
                  </div>

                  {/* Preset quick actions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={selectAllPages}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                    >
                      All
                    </button>
                    <button
                      onClick={selectOddPages}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                    >
                      Odd
                    </button>
                    <button
                      onClick={selectEvenPages}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                    >
                      Even
                    </button>
                    <button
                      onClick={deselectAllPages}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={pageRangeInput}
                    onChange={(e) => handlePageRangeChange(e.target.value)}
                    placeholder={`e.g. 1, 2-${splitDetails?.pageCount || 3}`}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                    {selectedPages.size} of {splitDetails?.pageCount} selected
                  </span>
                </div>
              </div>

              {/* Visual Page Grid */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Interactive Page Grid (Click to Toggle)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {splitDetails?.pages.map((pg) => {
                    const isSelected = selectedPages.has(pg.index);
                    const isLandscape = pg.width > pg.height;
                    return (
                      <div
                        key={pg.index}
                        onClick={() => togglePageSelection(pg.index)}
                        className={`group relative p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-between min-h-[140px] ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/5"
                            : "border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 opacity-60 hover:opacity-100 hover:border-zinc-400"
                        }`}
                      >
                        {/* Page Header */}
                        <div className="w-full flex items-center justify-between text-[11px] font-medium">
                          <span className="font-mono text-zinc-500">
                            P. {pg.pageNumber}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-emerald-500 text-white"
                                : "bg-zinc-200 dark:bg-zinc-800 text-transparent"
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>

                        {/* Page Preview Blueprint */}
                        <div
                          className={`my-2 rounded-md border flex flex-col items-center justify-center transition-all ${
                            isLandscape ? "w-16 h-12" : "w-12 h-16"
                          } ${
                            isSelected
                              ? "border-emerald-500/60 bg-white dark:bg-zinc-900 text-emerald-600"
                              : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-400"
                          }`}
                        >
                          <FileText className="w-5 h-5 opacity-70" />
                        </div>

                        {/* Metadata */}
                        <div className="text-center">
                          <span className="text-[10px] font-mono text-zinc-400 block">
                            {pg.width} × {pg.height} pt
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Download Bar */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-72">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                    Output Filename
                  </label>
                  <input
                    type="text"
                    value={splitOutputName}
                    onChange={(e) => setSplitOutputName(e.target.value)}
                    placeholder="extracted-pages.pdf"
                    className="w-full px-3 py-1.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={handleExecuteSplit}
                  disabled={isProcessing || selectedPages.size === 0}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Extract {selectedPages.size} Selected Pages</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ROTATE & ORGANIZE */}
      {/* ========================================================================= */}
      {activeMode === "organize" && (
        <div className="space-y-6">
          {!organizeFile ? (
            <div
              onClick={() => organizeInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-emerald-500/50 bg-white dark:bg-zinc-900/60 cursor-pointer transition-all group"
            >
              <input
                ref={organizeInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleOrganizeFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="p-3.5 mb-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                <RotateCw className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center">
                Select a PDF to rotate or delete individual pages
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center">
                Rotate 90°, 180°, or 270° • Remove blank or unwanted pages
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {organizeFile.name}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {organizeDetails?.pageCount} pages • {formatBytes(organizeFile.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => organizeInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Change File
                  </button>
                  <input
                    ref={organizeInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleOrganizeFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      setOrganizeFile(null);
                      setOrganizeDetails(null);
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bulk Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Bulk Transformations:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => rotateAllPages(90)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-200 shadow-sm transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Rotate All +90°</span>
                  </button>
                  <button
                    onClick={() => rotateAllPages(-90)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-200 shadow-sm transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Rotate All -90°</span>
                  </button>
                  <button
                    onClick={resetAllTransforms}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    <span>Reset All</span>
                  </button>
                </div>
              </div>

              {/* Page Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {organizeDetails?.pages.map((pg) => {
                  const cfg = pageTransforms.get(pg.index) || {
                    pageIndex: pg.index,
                    rotationDelta: 0,
                    deleted: false,
                  };
                  const isDeleted = cfg.deleted;
                  const totalRotation = (pg.rotation + cfg.rotationDelta) % 360;

                  return (
                    <div
                      key={pg.index}
                      className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isDeleted
                          ? "border-red-500/40 bg-red-500/5 opacity-60"
                          : cfg.rotationDelta !== 0
                          ? "border-emerald-500/60 bg-white dark:bg-zinc-900 shadow-sm"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60"
                      }`}
                    >
                      {/* Card Top */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            Page {pg.pageNumber}
                          </span>
                          {cfg.rotationDelta !== 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                              +{cfg.rotationDelta}°
                            </span>
                          )}
                        </div>

                        {isDeleted ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-500/10 text-red-500 uppercase tracking-wider">
                            Removed
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-400">
                            {pg.width} × {pg.height} pt
                          </span>
                        )}
                      </div>

                      {/* Visual Graphic Representation */}
                      <div className="py-6 flex items-center justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-100 dark:border-zinc-800/80 mb-4">
                        <div
                          style={{
                            transform: `rotate(${totalRotation}deg)`,
                            transition: "transform 0.25s ease-in-out",
                          }}
                          className={`rounded-md border flex flex-col items-center justify-center ${
                            pg.width > pg.height ? "w-20 h-14" : "w-14 h-20"
                          } ${
                            isDeleted
                              ? "border-red-400 bg-red-100/50 text-red-400 line-through"
                              : "border-emerald-500/50 bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm"
                          }`}
                        >
                          <FileText className="w-6 h-6" />
                          <span className="text-[9px] font-mono font-bold mt-1">
                            P.{pg.pageNumber}
                          </span>
                        </div>
                      </div>

                      {/* Page Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => rotatePage(pg.index, -90)}
                            disabled={isDeleted}
                            title="Rotate -90°"
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => rotatePage(pg.index, 90)}
                            disabled={isDeleted}
                            title="Rotate +90°"
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => toggleDeletePage(pg.index)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isDeleted
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isDeleted ? "Restore" : "Delete"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Download Bar */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-72">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                    Output Filename
                  </label>
                  <input
                    type="text"
                    value={organizeOutputName}
                    onChange={(e) => setOrganizeOutputName(e.target.value)}
                    placeholder="organized-document.pdf"
                    className="w-full px-3 py-1.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={handleExecuteOrganize}
                  disabled={
                    isProcessing ||
                    Array.from(pageTransforms.values()).every((c) => c.deleted)
                  }
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>
                    Export Organized PDF (
                    {
                      Array.from(pageTransforms.values()).filter(
                        (c) => !c.deleted
                      ).length
                    }{" "}
                    Pages)
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security & Privacy Callout */}
      <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 flex-shrink-0 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            Why Client-Side PDF Processing is Crucial
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            PDFs routinely contain tax documents, medical histories, bank statements, and sensitive contracts. Unlike commercial online PDF converters that send your files to remote cloud storage, Privatools runs 100% in local memory using WebAssembly and pure JavaScript. No files ever touch a network socket.
          </p>
        </div>
      </div>
    </div>
  );
}
