"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  BookOpen,
  Eye,
  Code2,
  Layers,
  Table as TableIcon,
  ArrowRightLeft,
  Copy,
  Check,
  Trash2,
  Download,
  Printer,
  Upload,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Quote,
  ListTodo,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  Image as ImageIcon,
  Minus,
  Sparkles,
  AlertTriangle,
  FileDown,
  Columns,
  Maximize2,
  FileText,
  Sliders,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import {
  parseMarkdown,
  calculateDocStats,
  extractHeadingsOutline,
  csvToMarkdownTable,
  formatMarkdownTable,
  htmlToMarkdown,
  generateStandaloneHtml,
  MARKDOWN_PRESETS,
  MarkdownPreset,
} from "@/lib/converters/markdown";

type ViewMode = "split" | "editor" | "preview";
type RightTab = "preview" | "rawHtml" | "frontmatter" | "tableStudio" | "htmlToMd";

export default function MarkdownLabPage() {
  const [activePreset, setActivePreset] = useState<string | null>("rfc-architecture");
  const [markdown, setMarkdown] = useState<string>(MARKDOWN_PRESETS[0].content);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [activeTab, setActiveTab] = useState<RightTab>("preview");
  const [syncScroll, setSyncScroll] = useState<boolean>(true);

  // Copy feedback states
  const [copiedMd, setCopiedMd] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [copiedTable, setCopiedTable] = useState<boolean>(false);

  // Table Studio states
  const [csvInput, setCsvInput] = useState<string>(
    "Feature,Status,Latency,Engine\nFull Text Search,Active,12ms,WASM\nVector Embeddings,Beta,45ms,WebGPU\nZero Knowledge Proofs,Alpha,180ms,Rust"
  );
  const [tableAlign, setTableAlign] = useState<"left" | "center" | "right">("left");
  const generatedMdTable = useMemo(() => {
    if (!csvInput.trim()) return "";
    const aligns = new Array(10).fill(tableAlign);
    return csvToMarkdownTable(csvInput, aligns);
  }, [csvInput, tableAlign]);

  // HTML -> Markdown converter states
  const [htmlInput, setHtmlInput] = useState<string>(
    `<h2>Local-First Storage</h2>\n<p>Data is stored inside browser <strong>IndexedDB</strong> and <em>Origin Private File System (OPFS)</em>.</p>\n<ul>\n  <li>Zero telemetry</li>\n  <li>Encrypted at rest with Web Crypto</li>\n</ul>`
  );
  const convertedMd = useMemo(() => {
    if (!htmlInput.trim()) return "";
    return htmlToMarkdown(htmlInput);
  }, [htmlInput]);

  // Refs for sync scroll and textarea insertion
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Parse markdown
  const parseResult = useMemo(() => {
    return parseMarkdown(markdown);
  }, [markdown]);

  // Calculate stats
  const docStats = useMemo(() => {
    return calculateDocStats(markdown);
  }, [markdown]);

  // Extract outline
  const outline = useMemo(() => {
    return extractHeadingsOutline(markdown);
  }, [markdown]);

  // Synchronized scrolling handler
  const handleEditorScroll = () => {
    if (!syncScroll || !textareaRef.current || !previewRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = textareaRef.current;
    const scrollRatio = scrollTop / (scrollHeight - clientHeight || 1);
    const targetScroll = scrollRatio * (previewRef.current.scrollHeight - previewRef.current.clientHeight);
    previewRef.current.scrollTop = targetScroll;
  };

  // Preset selection
  const handleSelectPreset = (preset: MarkdownPreset) => {
    setActivePreset(preset.id);
    setMarkdown(preset.content);
  };

  // Clear editor
  const handleClear = () => {
    setMarkdown("");
    setActivePreset(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle file drop / upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result;
        if (typeof text === "string") {
          setMarkdown(text);
          setActivePreset(null);
        }
      };
      reader.readAsText(file);
    }
  };

  // Text insertion helper for markdown toolbar
  const insertText = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end);

    const insertion = selectedText
      ? `${prefix}${selectedText}${suffix}`
      : `${prefix}${placeholder}${suffix}`;

    const newMarkdown =
      markdown.substring(0, start) + insertion + markdown.substring(end);

    setMarkdown(newMarkdown);
    setActivePreset(null);

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText
        ? start + insertion.length
        : start + prefix.length;
      textarea.setSelectionRange(
        newCursorPos,
        selectedText ? newCursorPos : newCursorPos + placeholder.length
      );
    }, 0);
  };

  // Insert Heading helper
  const insertHeading = (level: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = markdown.lastIndexOf("\n", start - 1) + 1;
    const hashes = "#".repeat(level) + " ";

    const newMarkdown =
      markdown.substring(0, lineStart) + hashes + markdown.substring(lineStart);

    setMarkdown(newMarkdown);
    setActivePreset(null);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + hashes.length, start + hashes.length);
    }, 0);
  };

  // Copy helpers
  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyHtml = async () => {
    await navigator.clipboard.writeText(parseResult.html);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  // Export File helpers
  const handleDownloadMd = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "document.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadStandaloneHtml = () => {
    const docTitle =
      (parseResult.frontmatter?.title as string) ||
      outline[0]?.text ||
      "Document";
    const standalone = generateStandaloneHtml(docTitle, parseResult.html);
    const blob = new Blob([standalone], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${docTitle.toLowerCase().replace(/[^\w-]/g, "_")}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <ToolHeader
          toolId="markdown-lab"
          title="Client-Side Markdown & Technical Documentation Studio"
          description="Author, preview, and format Markdown and technical documents client-side. Inspect YAML frontmatter, convert CSV tables, compile to standalone HTML/PDF, and analyze readability metrics with zero data egress."
          badge="Zero Egress"
        />
      </div>

      {/* Sample Documents Card (matching cert-inspector, diff-viewer, qr-studio, regex-studio) */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mr-1 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
            Sample Documents:
          </span>
          {MARKDOWN_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              title={p.description}
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
          className="shrink-0 whitespace-nowrap self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Input</span>
        </button>
      </div>

      {/* Studio Toolbar & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden">
        {/* Quick-Action Insertion Toolbar */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => insertHeading(1)}
            title="Heading 1 (#)"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertHeading(2)}
            title="Heading 2 (##)"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertHeading(3)}
            title="Heading 3 (###)"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-5 bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <button
            onClick={() => insertText("**", "**", "bold text")}
            title="Bold (**text**)"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("*", "*", "italic text")}
            title="Italic (*text*)"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("~~", "~~", "strikethrough text")}
            title="Strikethrough (~~text~~)"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("`", "`", "code")}
            title="Inline Code (`code`)"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Code className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-5 bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <button
            onClick={() => insertText("\n```bash\n", "\n```\n", "echo 'Hello World'")}
            title="Code Block (```)"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-xs font-mono font-bold"
          >
            {"{ }"}
          </button>
          <button
            onClick={() => insertText("\n> ", "\n", "Quote")}
            title="Blockquote (>)"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("\n> [!NOTE]\n> ", "\n", "Informative note")}
            title="GitHub Alert Callout (> [!NOTE])"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </button>
          <button
            onClick={() => insertText("- ", "", "List item")}
            title="Bulleted List (-)"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("1. ", "", "Ordered item")}
            title="Numbered List (1.)"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("- [ ] ", "", "Task item")}
            title="Task Checklist (- [ ])"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ListTodo className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-5 bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <button
            onClick={() => insertText("[", "](https://example.com)", "link title")}
            title="Hyperlink ([text](url))"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("![", "](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe)", "Image Alt")}
            title="Image (![alt](url))"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              insertText(
                "\n| Header 1 | Header 2 | Header 3 |\n| :--- | :---: | ---: |\n| Row 1 | Value A | 100 |\n| Row 2 | Value B | 250 |\n"
              )
            }
            title="Insert Table"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("\n---\n")}
            title="Horizontal Divider (---)"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode & Utility Controls */}
        <div className="flex items-center gap-2">
          {/* File Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Open local .md file"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open File</span>
          </button>

          {/* Sync Scroll Toggle */}
          <button
            onClick={() => setSyncScroll(!syncScroll)}
            title={syncScroll ? "Synchronized scrolling enabled" : "Synchronized scrolling disabled"}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors hidden md:inline-flex items-center gap-1 ${
              syncScroll
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Sync Scroll</span>
          </button>

          {/* View Mode Selector */}
          <div className="inline-flex p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
            <button
              onClick={() => setViewMode("split")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === "split"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode("editor")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === "editor"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Editor</span>
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === "preview"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        {/* Left Pane: Markdown Source Editor */}
        {(viewMode === "split" || viewMode === "editor") && (
          <div
            className={`${
              viewMode === "editor" ? "lg:col-span-12" : "lg:col-span-6"
            } flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Markdown Source
                </span>
                {parseResult.frontmatter && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-500/15 text-purple-600 dark:text-purple-400">
                    YAML Frontmatter
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {copiedMd ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy MD</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(e) => {
                setMarkdown(e.target.value);
                setActivePreset(null);
              }}
              onScroll={handleEditorScroll}
              placeholder="Type or paste Markdown here..."
              spellCheck={false}
              className="w-full h-[650px] p-4 font-mono text-xs text-zinc-900 dark:text-zinc-100 bg-transparent resize-none focus:outline-none leading-relaxed"
            />
          </div>
        )}

        {/* Right Pane: Multi-Tab Workbench */}
        {(viewMode === "split" || viewMode === "preview") && (
          <div
            className={`${
              viewMode === "preview" ? "lg:col-span-12" : "lg:col-span-6"
            } flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden`}
          >
            {/* Tab Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 overflow-x-auto">
              <div className="flex items-center gap-1 min-w-max">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    activeTab === "preview"
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Rich Preview</span>
                </button>

                <button
                  onClick={() => setActiveTab("rawHtml")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    activeTab === "rawHtml"
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Sanitized HTML</span>
                </button>

                <button
                  onClick={() => setActiveTab("frontmatter")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    activeTab === "frontmatter"
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Frontmatter</span>
                  {parseResult.frontmatter && (
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("tableStudio")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    activeTab === "tableStudio"
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Table Studio</span>
                </button>

                <button
                  onClick={() => setActiveTab("htmlToMd")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    activeTab === "htmlToMd"
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>HTML → MD</span>
                </button>
              </div>

              {/* Tab Actions */}
              <div className="flex items-center gap-2">
                {activeTab === "preview" && (
                  <button
                    onClick={handlePrint}
                    title="Print or Save as PDF"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Print / PDF</span>
                  </button>
                )}

                {activeTab === "rawHtml" && (
                  <button
                    onClick={handleCopyHtml}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {copiedHtml ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy HTML</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Tab Contents */}
            <div className="h-[650px] overflow-y-auto">
              {/* Tab 1: Rich Preview */}
              {activeTab === "preview" && (
                <div
                  ref={previewRef}
                  className="p-6 h-full overflow-y-auto"
                >
                  {/* Frontmatter Pill Banner if available */}
                  {parseResult.frontmatter && (
                    <div className="mb-6 p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold">Document Metadata:</span>
                        <span className="font-mono text-[11px] text-purple-700 dark:text-purple-300">
                          {Object.keys(parseResult.frontmatter).length} properties detected
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTab("frontmatter")}
                        className="text-[11px] font-medium underline underline-offset-2 hover:text-purple-600"
                      >
                        Inspect Frontmatter →
                      </button>
                    </div>
                  )}

                  {/* Rendered HTML Container */}
                  {markdown.trim() ? (
                    <div
                      className="markdown-preview text-zinc-900 dark:text-zinc-100"
                      dangerouslySetInnerHTML={{ __html: parseResult.html }}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400">
                      <BookOpen className="w-10 h-10 mb-3 opacity-40" />
                      <p className="text-sm font-medium">Empty Document</p>
                      <p className="text-xs text-zinc-500 max-w-sm mt-1">
                        Type Markdown on the left or select a sample preset to preview styled headings, tables, alerts, and code blocks.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Raw Sanitized HTML */}
              {activeTab === "rawHtml" && (
                <div className="p-4 h-full flex flex-col">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2 flex items-center justify-between">
                    <span>DOMPurify sanitized HTML markup:</span>
                    <span>{parseResult.html.length.toLocaleString()} characters</span>
                  </div>
                  <textarea
                    readOnly
                    value={parseResult.html}
                    className="flex-1 w-full p-4 font-mono text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/60 resize-none focus:outline-none"
                  />
                </div>
              )}

              {/* Tab 3: Frontmatter Inspector */}
              {activeTab === "frontmatter" && (
                <div className="p-6 space-y-6">
                  {parseResult.frontmatterError ? (
                    <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">YAML Frontmatter Syntax Error</p>
                        <p className="font-mono mt-1 text-[11px]">
                          {parseResult.frontmatterError}
                        </p>
                      </div>
                    </div>
                  ) : parseResult.frontmatter ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Parsed Metadata Attributes
                        </h4>
                        <span className="text-xs text-zinc-400">
                          {Object.keys(parseResult.frontmatter).length} keys
                        </span>
                      </div>

                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 text-left">
                              <th className="p-3 font-semibold">Key</th>
                              <th className="p-3 font-semibold">Type</th>
                              <th className="p-3 font-semibold">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {Object.entries(parseResult.frontmatter).map(
                              ([key, val]) => {
                                const type = Array.isArray(val)
                                  ? "array"
                                  : typeof val;
                                return (
                                  <tr key={key} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                    <td className="p-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                      {key}
                                    </td>
                                    <td className="p-3 font-mono text-[11px] text-zinc-400">
                                      {type}
                                    </td>
                                    <td className="p-3 font-mono text-zinc-800 dark:text-zinc-200 break-all">
                                      {typeof val === "object"
                                        ? JSON.stringify(val)
                                        : String(val)}
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Raw YAML Header
                        </label>
                        <pre className="p-3 rounded-xl bg-zinc-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                          {parseResult.rawFrontmatter}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-400 p-6">
                      <Layers className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-sm font-medium">No Frontmatter Detected</p>
                      <p className="text-xs text-zinc-500 max-w-sm mt-1">
                        Add a YAML frontmatter block at the very top of your document surrounded by <code className="text-emerald-500">---</code> to define metadata.
                      </p>
                      <button
                        onClick={() => {
                          const fm = `---\ntitle: "Untitled Document"\nauthor: "Author Name"\ndate: "${new Date().toISOString().split("T")[0]}"\nstatus: "DRAFT"\ntags:\n  - documentation\n---\n\n`;
                          setMarkdown(fm + markdown);
                        }}
                        className="mt-4 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-medium transition-colors"
                      >
                        + Insert Sample Frontmatter
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Table Studio (CSV ↔ MD) */}
              {activeTab === "tableStudio" && (
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        CSV / TSV / Excel Clipboard Input
                      </label>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-400">Align:</span>
                        {(["left", "center", "right"] as const).map((align) => (
                          <button
                            key={align}
                            onClick={() => setTableAlign(align)}
                            className={`px-2 py-0.5 rounded capitalize text-[11px] font-medium border ${
                              tableAlign === align
                                ? "bg-emerald-500 text-white border-emerald-500 font-semibold"
                                : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      value={csvInput}
                      onChange={(e) => setCsvInput(e.target.value)}
                      placeholder="Paste comma-separated or tab-separated data here..."
                      className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  {generatedMdTable && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Formatted Markdown Table
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              insertText(`\n${generatedMdTable}\n`);
                              setActiveTab("preview");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                          >
                            Insert into Document
                          </button>
                          <button
                            onClick={async () => {
                              await navigator.clipboard.writeText(generatedMdTable);
                              setCopiedTable(true);
                              setTimeout(() => setCopiedTable(false), 2000);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            {copiedTable ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Table</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <pre className="p-4 rounded-xl bg-zinc-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-zinc-800">
                        {generatedMdTable}
                      </pre>
                    </div>
                  )}

                  {/* Format Existing Table in Document */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        Format Document Tables
                      </h5>
                      <p className="text-[11px] text-zinc-500">
                        Automatically aligns and pads all unaligned markdown tables in the editor.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const formatted = formatMarkdownTable(markdown);
                        setMarkdown(formatted);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors"
                    >
                      Prettify All Tables
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 5: HTML → Markdown Converter */}
              {activeTab === "htmlToMd" && (
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      HTML / Rich Text Input
                    </label>
                    <textarea
                      rows={6}
                      value={htmlInput}
                      onChange={(e) => setHtmlInput(e.target.value)}
                      placeholder="Paste HTML source code here..."
                      className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Converted Markdown Output
                      </label>
                      <button
                        onClick={() => {
                          insertText(`\n${convertedMd}\n`);
                          setActiveTab("preview");
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                      >
                        Insert into Document
                      </button>
                    </div>
                    <pre className="p-4 rounded-xl bg-zinc-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-zinc-800 max-h-60">
                      {convertedMd}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Live Document Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden">
        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Words
          </span>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {docStats.words.toLocaleString()}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Characters
          </span>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {docStats.charsWithSpaces.toLocaleString()}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Reading Time
          </span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            ~{docStats.readingTimeMinutes} min
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Lines
          </span>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {docStats.lines.toLocaleString()}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Headings
          </span>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {docStats.headingsCount}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Checklist
          </span>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {docStats.completedTasksCount} / {docStats.taskItemsCount}
          </p>
        </div>
      </div>

      {/* Export & Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <FileDown className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Zero-Egress Export Options
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadMd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>

          <button
            onClick={handleDownloadStandaloneHtml}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download Standalone HTML</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Clean Printable View for @media print */}
      <div className="hidden print:block markdown-preview text-black">
        <div dangerouslySetInnerHTML={{ __html: parseResult.html }} />
      </div>
    </div>
  );
}
