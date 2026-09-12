"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import {
  Download,
  Copy,
  Check,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  Code2,
  FileCode,
  SlidersHorizontal,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import {
  parseEdiDocument,
  ediToJSON,
  ediToXML,
  formatEDI,
  SAMPLE_EDI_DOCUMENTS,
  ParsedEdiDocument,
  EdiDelimiters,
} from "@/lib/converters/edi";

export default function EdiViewerPage() {
  const [inputText, setInputText] = useState<string>(SAMPLE_EDI_DOCUMENTS.x12_850.raw);
  const [doc, setDoc] = useState<ParsedEdiDocument | null>(null);
  const [activeTab, setActiveTab] = useState<"tree" | "formatted" | "json" | "xml">("tree");
  const [segmentQuery, setSegmentQuery] = useState<string>("");
  const [expandedSegments, setExpandedSegments] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customDelims, setCustomDelims] = useState<Partial<EdiDelimiters>>({});
  const [showDelimOverrides, setShowDelimOverrides] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  // Parse document whenever inputText or customDelims change
  useEffect(() => {
    startTransition(() => {
      if (!inputText.trim()) {
        setDoc(null);
        return;
      }
      const parsed = parseEdiDocument(inputText, customDelims);
      setDoc(parsed);
    });
  }, [inputText, customDelims]);

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

  const handleFileDrop = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomDelims({});
        setInputText(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = (key: keyof typeof SAMPLE_EDI_DOCUMENTS) => {
    setCustomDelims({});
    setInputText(SAMPLE_EDI_DOCUMENTS[key].raw);
  };

  const handleClear = () => {
    setInputText("");
    setDoc(null);
    setCustomDelims({});
  };

  const toggleSegment = (idx: number) => {
    setExpandedSegments((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const expandAll = () => {
    if (!doc) return;
    const all: Record<number, boolean> = {};
    doc.segments.forEach((s) => (all[s.index] = true));
    setExpandedSegments(all);
  };

  const collapseAll = () => {
    setExpandedSegments({});
  };

  // Filtered segments for Tree View
  const filteredSegments = useMemo(() => {
    if (!doc) return [];
    const q = segmentQuery.toLowerCase().trim();
    if (!q) return doc.segments;

    return doc.segments.filter((seg) => {
      return (
        seg.tag.toLowerCase().includes(q) ||
        seg.name.toLowerCase().includes(q) ||
        seg.description.toLowerCase().includes(q) ||
        seg.elements.some(
          (el) =>
            el.value.toLowerCase().includes(q) ||
            (el.label && el.label.toLowerCase().includes(q))
        )
      );
    });
  }, [doc, segmentQuery]);

  const formattedEdiOutput = useMemo(() => (doc ? formatEDI(doc) : ""), [doc]);
  const jsonOutput = useMemo(() => (doc ? ediToJSON(doc) : ""), [doc]);
  const xmlOutput = useMemo(() => (doc ? ediToXML(doc) : ""), [doc]);

  return (
    <div className="space-y-8">
      <ToolHeader
        toolId="edi-viewer"
        title="EDI X12 & UN/EDIFACT Viewer & Converter"
        description="Decode, inspect, and translate cryptic EDI files into human-readable segment trees, formatted EDI, structured JSON, and semantic XML with zero data egress."
        badge="Zero Egress"
      />

      {/* Input Controls & Samples */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mr-1">
              Sample EDI Docs:
            </span>
            <button
              onClick={() => handleLoadSample("x12_850")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              ANSI X12 850 (PO)
            </button>
            <button
              onClick={() => handleLoadSample("x12_810")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              ANSI X12 810 (Invoice)
            </button>
            <button
              onClick={() => handleLoadSample("edifact_orders")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              EDIFACT ORDERS
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDelimOverrides((prev) => !prev)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Delimiters</span>
            </button>

            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Delimiter Overrides (Collapsible) */}
        {showDelimOverrides && doc && (
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs animate-in fade-in">
            <div>
              <label className="text-zinc-500 font-medium block mb-1">Segment Terminator</label>
              <input
                type="text"
                value={customDelims.segment ?? doc.delimiters.segment}
                onChange={(e) =>
                  setCustomDelims((prev) => ({ ...prev, segment: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
              />
            </div>
            <div>
              <label className="text-zinc-500 font-medium block mb-1">Element Separator</label>
              <input
                type="text"
                value={customDelims.element ?? doc.delimiters.element}
                onChange={(e) =>
                  setCustomDelims((prev) => ({ ...prev, element: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
              />
            </div>
            <div>
              <label className="text-zinc-500 font-medium block mb-1">Component Separator</label>
              <input
                type="text"
                value={customDelims.component ?? doc.delimiters.component}
                onChange={(e) =>
                  setCustomDelims((prev) => ({ ...prev, component: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setCustomDelims({})}
                className="w-full py-1.5 text-xs text-zinc-500 hover:text-emerald-500 hover:underline"
              >
                Reset to Auto-detected
              </button>
            </div>
          </div>
        )}

        {/* Dropzone */}
        <FileDropzone
          accept=".edi,.x12,.edi850,.edi810,.edi856,.edi837,.txt,text/plain"
          onFileSelect={handleFileDrop}
          title="Drop EDI file (.edi, .x12, .txt) or click to browse"
          description="Supports ANSI X12 & UN/EDIFACT • 100% In-Browser Inspection"
        />

        {/* Raw EDI Textarea */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Raw EDI Document Input
            </span>
            <span>{inputText.length} characters</span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="ISA*00* ... or UNA:+.? ' ..."
            className="w-full h-32 p-4 font-mono text-xs bg-transparent resize-y text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none selection:bg-emerald-500/20"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Main Document Inspection & Viewer */}
      {doc && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Summary Banner */}
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {doc.standard === "X12" ? "ANSI X12 Standard" : "UN/EDIFACT Standard"}
                    </span>
                    {doc.transactionSet && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {doc.transactionSet.id}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {doc.transactionSet?.name || "General EDI Transaction"}
                  </h2>
                </div>
              </div>

              {/* Document Key Metadata Metrics */}
              <div className="flex flex-wrap items-center gap-6 text-xs">
                {doc.interchangeSender && (
                  <div>
                    <span className="text-zinc-400 block">Sender</span>
                    <strong className="font-mono text-zinc-800 dark:text-zinc-200">
                      {doc.interchangeSender}
                    </strong>
                  </div>
                )}
                {doc.interchangeReceiver && (
                  <div>
                    <span className="text-zinc-400 block">Receiver</span>
                    <strong className="font-mono text-zinc-800 dark:text-zinc-200">
                      {doc.interchangeReceiver}
                    </strong>
                  </div>
                )}
                {doc.controlNumber && (
                  <div>
                    <span className="text-zinc-400 block">Control #</span>
                    <strong className="font-mono text-zinc-800 dark:text-zinc-200">
                      {doc.controlNumber}
                    </strong>
                  </div>
                )}
                <div>
                  <span className="text-zinc-400 block">Segments</span>
                  <strong className="font-mono text-emerald-500 font-bold">
                    {doc.totalSegments}
                  </strong>
                </div>
              </div>
            </div>

            {/* Delimiters Ribbon */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-mono">
              <span>
                Segment Term: <strong className="text-zinc-800 dark:text-zinc-200">&apos;{doc.delimiters.segment}&apos;</strong>
              </span>
              <span>•</span>
              <span>
                Element Sep: <strong className="text-zinc-800 dark:text-zinc-200">&apos;{doc.delimiters.element}&apos;</strong>
              </span>
              <span>•</span>
              <span>
                Component Sep: <strong className="text-zinc-800 dark:text-zinc-200">&apos;{doc.delimiters.component}&apos;</strong>
              </span>
              {doc.delimiters.release && (
                <>
                  <span>•</span>
                  <span>
                    Release Char: <strong className="text-zinc-800 dark:text-zinc-200">&apos;{doc.delimiters.release}&apos;</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Export & Conversion Hub */}
          <div className="p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Format Conversion & Export
                </h3>
              </div>
              <span className="text-[11px] text-zinc-500">
                100% Client-Side Conversion (Zero Data Uploads)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Formatted EDI */}
              <button
                onClick={() =>
                  handleDownload(
                    formattedEdiOutput,
                    `formatted-${doc.transactionSet?.id || "doc"}.edi`,
                    "text/plain"
                  )
                }
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/50 hover:shadow-sm transition-all text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Beautified EDI (.edi)
                  </p>
                  <p className="text-[10px] text-zinc-500">Indented 1 segment per line</p>
                </div>
                <Download className="w-4 h-4 text-emerald-500" />
              </button>

              {/* JSON Export */}
              <button
                onClick={() =>
                  handleDownload(
                    jsonOutput,
                    `edi-${doc.transactionSet?.id || "doc"}.json`,
                    "application/json"
                  )
                }
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/50 hover:shadow-sm transition-all text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Structured JSON (.json)
                  </p>
                  <p className="text-[10px] text-zinc-500">Objects, arrays & element tags</p>
                </div>
                <FileCode className="w-4 h-4 text-emerald-500" />
              </button>

              {/* XML Export */}
              <button
                onClick={() =>
                  handleDownload(
                    xmlOutput,
                    `edi-${doc.transactionSet?.id || "doc"}.xml`,
                    "application/xml"
                  )
                }
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/50 hover:shadow-sm transition-all text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Semantic XML (.xml)
                  </p>
                  <p className="text-[10px] text-zinc-500">Segment & element elements</p>
                </div>
                <Code2 className="w-4 h-4 text-emerald-500" />
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab("tree")}
              className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "tree"
                  ? "border-emerald-500 text-emerald-500"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Interactive Segment Tree ({doc.totalSegments})
            </button>
            <button
              onClick={() => setActiveTab("formatted")}
              className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "formatted"
                  ? "border-emerald-500 text-emerald-500"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Formatted EDI Text
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "json"
                  ? "border-emerald-500 text-emerald-500"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              JSON View
            </button>
            <button
              onClick={() => setActiveTab("xml")}
              className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "xml"
                  ? "border-emerald-500 text-emerald-500"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              XML View
            </button>
          </div>

          {/* Tab 1: Interactive Segment Tree View */}
          {activeTab === "tree" && (
            <div className="space-y-4">
              {/* Segment Search Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search segments (e.g. N1, BIG, PO1, Dallas)..."
                    value={segmentQuery}
                    onChange={(e) => setSegmentQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={expandAll}
                    className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* Segments List */}
              <div className="space-y-3">
                {filteredSegments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    No segments matched &quot;{segmentQuery}&quot;
                  </div>
                ) : (
                  filteredSegments.map((seg) => {
                    const isExpanded = !!expandedSegments[seg.index];
                    return (
                      <div
                        key={seg.index}
                        className={`rounded-2xl border transition-all ${
                          seg.isEnvelope
                            ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                        }`}
                        style={{ marginLeft: `${Math.min(seg.level * 16, 48)}px` }}
                      >
                        {/* Segment Header Bar */}
                        <div
                          onClick={() => toggleSegment(seg.index)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-zinc-400">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </span>

                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                              {seg.tag}
                            </span>

                            <div className="min-w-0">
                              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {seg.name}
                              </h4>
                              <p className="text-[11px] text-zinc-400 truncate">
                                {seg.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-mono text-zinc-400 hidden sm:block">
                              Seq #{seg.index} • {seg.elements.length} elements
                            </span>
                          </div>
                        </div>

                        {/* Segment Body Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 space-y-3">
                            {/* Raw Segment String with Copy */}
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 font-mono text-xs border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                              <span>{seg.raw}{doc.delimiters.segment}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(seg.raw, `raw-${seg.index}`);
                                }}
                                className="ml-3 text-zinc-400 hover:text-emerald-500"
                                title="Copy raw segment"
                              >
                                {copiedField === `raw-${seg.index}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* Elements Table */}
                            {seg.elements.length > 0 ? (
                              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden text-xs">
                                <table className="w-full text-left divide-y divide-zinc-200 dark:divide-zinc-800">
                                  <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 text-[11px]">
                                    <tr>
                                      <th className="px-3 py-2 w-20">Tag</th>
                                      <th className="px-3 py-2">Field Label</th>
                                      <th className="px-3 py-2">Value</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 bg-white dark:bg-zinc-900/60">
                                    {seg.elements.map((el) => (
                                      <tr key={el.position} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                                        <td className="px-3 py-2 font-mono text-zinc-400">
                                          {el.tag}
                                        </td>
                                        <td className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                                          {el.label || "Element"}
                                        </td>
                                        <td className="px-3 py-2 font-mono text-zinc-900 dark:text-zinc-100 break-all">
                                          {el.components && el.components.length > 1 ? (
                                            <div className="flex flex-wrap gap-1">
                                              {el.components.map((c, cIdx) => (
                                                <span
                                                  key={cIdx}
                                                  className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px]"
                                                >
                                                  {c}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span>{el.value || "—"}</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-zinc-400 italic">No elements in this segment.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Formatted EDI */}
          {activeTab === "formatted" && (
            <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span>Formatted EDI (Indented)</span>
                <button
                  onClick={() => handleCopy(formattedEdiOutput, "formattedEdi")}
                  className="inline-flex items-center gap-1 text-emerald-500 hover:underline"
                >
                  {copiedField === "formattedEdi" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Formatted EDI</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                readOnly
                value={formattedEdiOutput}
                className="w-full h-96 p-4 font-mono text-xs bg-transparent text-zinc-800 dark:text-zinc-200 focus:outline-none resize-y"
                spellCheck={false}
              />
            </div>
          )}

          {/* Tab 3: JSON View */}
          {activeTab === "json" && (
            <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span>Structured JSON Representation</span>
                <button
                  onClick={() => handleCopy(jsonOutput, "jsonEdi")}
                  className="inline-flex items-center gap-1 text-emerald-500 hover:underline"
                >
                  {copiedField === "jsonEdi" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                readOnly
                value={jsonOutput}
                className="w-full h-96 p-4 font-mono text-xs bg-transparent text-zinc-800 dark:text-zinc-200 focus:outline-none resize-y"
                spellCheck={false}
              />
            </div>
          )}

          {/* Tab 4: XML View */}
          {activeTab === "xml" && (
            <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span>Semantic XML Representation</span>
                <button
                  onClick={() => handleCopy(xmlOutput, "xmlEdi")}
                  className="inline-flex items-center gap-1 text-emerald-500 hover:underline"
                >
                  {copiedField === "xmlEdi" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy XML</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                readOnly
                value={xmlOutput}
                className="w-full h-96 p-4 font-mono text-xs bg-transparent text-zinc-800 dark:text-zinc-200 focus:outline-none resize-y"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
