"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Regex,
  Code2,
  BookOpen,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  ArrowRightLeft,
  Upload,
  Hash,
  Eye,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import {
  REGEX_PRESETS,
  REGEX_CHEAT_SHEET,
  executeRegex,
  generateCodeSnippets,
  RegexPreset,
} from "@/lib/converters/regex";

type StudioTab = "match" | "replace" | "codegen" | "cheatsheet";

export default function RegexStudioPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>("match");
  const [activePreset, setActivePreset] = useState<string | null>("gs1-identifiers");

  // Regex State
  const [pattern, setPattern] = useState<string>("\\((?<ai>\\d{2,4})\\)(?<value>[^()]+)");
  const [flags, setFlags] = useState<string>("g");
  const [testText, setTestText] = useState<string>(
    "(00)300123451234567899\n(01)00012345678905(10)LOT-2026A(17)261231\n(400)PO-987654(410)9501101020917"
  );
  const [substitutionPattern, setSubstitutionPattern] = useState<string>(
    "AI: $<ai> -> $<value>\n"
  );

  // Selected language for code generator
  const [selectedLang, setSelectedLang] = useState<string>("typescript");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedReplaced, setCopiedReplaced] = useState<boolean>(false);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Execute Regex
  const result = useMemo(() => {
    return executeRegex(pattern, flags, testText, substitutionPattern);
  }, [pattern, flags, testText, substitutionPattern]);

  // Generate Code Snippets
  const snippets = useMemo(() => {
    return generateCodeSnippets(pattern, flags, testText, substitutionPattern);
  }, [pattern, flags, testText, substitutionPattern]);

  const activeSnippet = useMemo(() => {
    return snippets.find((s) => s.language === selectedLang) || snippets[0];
  }, [snippets, selectedLang]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: RegexPreset) => {
    setActivePreset(preset.id);
    setPattern(preset.pattern);
    setFlags(preset.flags);
    setTestText(preset.testText);
    if (preset.replacementText) {
      setSubstitutionPattern(preset.replacementText);
    }
    setSelectedMatchIndex(null);
  };

  // Handle Clear Input
  const handleClear = () => {
    setPattern("");
    setTestText("");
    setSubstitutionPattern("");
    setActivePreset(null);
    setSelectedMatchIndex(null);
  };

  // Toggle flag helper
  const toggleFlag = (flagChar: string) => {
    if (flags.includes(flagChar)) {
      setFlags(flags.replace(flagChar, ""));
    } else {
      setFlags(flags + flagChar);
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
          setTestText(text);
          setActivePreset(null);
        }
      };
      reader.readAsText(file);
    }
  };

  // Render Highlighted Text
  const highlightedPreview = useMemo(() => {
    if (!result.matches.length || !testText) {
      return <span>{testText}</span>;
    }

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    result.matches.forEach((match, idx) => {
      // Unmatched segment before this match
      if (match.start > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>{testText.slice(lastIndex, match.start)}</span>
        );
      }

      // Matched segment
      const isSelected = selectedMatchIndex === match.matchIndex;
      elements.push(
        <mark
          key={`match-${match.start}-${idx}`}
          onClick={() => setSelectedMatchIndex(isSelected ? null : match.matchIndex)}
          className={`cursor-pointer px-1 py-0.5 rounded transition-all font-mono font-semibold ${
            isSelected
              ? "bg-amber-400 dark:bg-amber-500 text-zinc-950 ring-2 ring-amber-500 shadow-xs"
              : idx % 2 === 0
              ? "bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 border-b-2 border-emerald-500"
              : "bg-blue-500/25 text-blue-900 dark:text-blue-200 border-b-2 border-blue-500"
          }`}
          title={`Match #${match.matchIndex} (${match.value.length} chars) at line ${match.line}:${match.column}`}
        >
          {match.value}
        </mark>
      );

      lastIndex = match.end;
    });

    // Remainder segment
    if (lastIndex < testText.length) {
      elements.push(
        <span key={`text-${lastIndex}`}>{testText.slice(lastIndex)}</span>
      );
    }

    return elements;
  }, [result.matches, testText, selectedMatchIndex]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <ToolHeader
          title="Client-Side Regex Workbench & Tester"
          description="Build, test, and debug regular expressions with real-time match highlighting, group extraction, substitution preview, and code generators. 100% in-browser zero egress."
          badge="Zero Egress"
        />
      </div>

      {/* Sample Regexes Card (matches cert-inspector, diff-viewer, qr-studio) */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mr-1 flex items-center gap-1.5">
            <Regex className="w-3.5 h-3.5 text-zinc-400" />
            Sample Regexes:
          </span>
          {REGEX_PRESETS.map((p) => (
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

      {/* Main Pattern Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <span>Regular Expression</span>
            <span className="text-[11px] font-mono text-zinc-400 font-normal">
              (ECMAScript / V8 Engine)
            </span>
          </label>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="hidden sm:inline">Flags:</span>
            <div className="flex items-center gap-1">
              {[
                { flag: "g", label: "Global", desc: "Match all occurrences" },
                { flag: "i", label: "Insensitive", desc: "Case-insensitive matching" },
                { flag: "m", label: "Multiline", desc: "^ and $ match line boundaries" },
                { flag: "s", label: "DotAll", desc: ". matches newline characters" },
                { flag: "u", label: "Unicode", desc: "Full unicode support" },
              ].map(({ flag, label, desc }) => (
                <button
                  key={flag}
                  onClick={() => toggleFlag(flag)}
                  title={`${label} (${flag}): ${desc}`}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                    flags.includes(flag)
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {flag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Delimited Pattern Input */}
        <div className="flex items-center rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-3 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500">
          <span className="font-mono text-lg font-bold text-zinc-400 select-none mr-2">
            /
          </span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value);
              setActivePreset(null);
            }}
            placeholder="Type your regular expression pattern here..."
            className="flex-1 bg-transparent border-0 font-mono text-sm sm:text-base text-zinc-900 dark:text-zinc-100 focus:outline-none placeholder-zinc-400"
          />
          <span className="font-mono text-lg font-bold text-zinc-400 select-none mx-2">
            /
          </span>
          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 select-none min-w-[20px]">
            {flags}
          </span>
        </div>

        {/* Syntax Error Notice */}
        {result.error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Invalid Pattern:</span>{" "}
              <span className="font-mono">{result.error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 print:hidden">
        <button
          onClick={() => setActiveTab("match")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "match"
              ? "bg-emerald-500 text-white shadow-sm font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Match & Inspect ({result.totalMatches})</span>
        </button>

        <button
          onClick={() => setActiveTab("replace")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "replace"
              ? "bg-emerald-500 text-white shadow-sm font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Substitute & Replace</span>
        </button>

        <button
          onClick={() => setActiveTab("codegen")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "codegen"
              ? "bg-emerald-500 text-white shadow-sm font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Code Generators</span>
        </button>

        <button
          onClick={() => setActiveTab("cheatsheet")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "cheatsheet"
              ? "bg-emerald-500 text-white shadow-sm font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Regex Cheat Sheet</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MATCH & INSPECT */}
      {/* ========================================================================= */}
      {activeTab === "match" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Test String Input & Highlights */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Test String
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    ({testText.length} chars, {testText.split("\n").length} lines)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.log,.json,.csv,.xml,.edi,.env,text/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Editable Textarea */}
              <textarea
                value={testText}
                onChange={(e) => {
                  setTestText(e.target.value);
                  setActivePreset(null);
                }}
                rows={8}
                placeholder="Paste or type text to match against here..."
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y"
              />
            </div>

            {/* Visual Highlighted Preview */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  Visual Match Highlighting
                </span>
                <span className="text-[11px] text-zinc-400 font-normal">
                  Click any match to view its capture groups
                </span>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs sm:text-sm leading-relaxed overflow-auto max-h-[300px] whitespace-pre-wrap break-all select-text">
                {highlightedPreview}
              </div>
            </div>
          </div>

          {/* Matches & Group Inspector */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Match Details
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {result.totalMatches} matches
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-zinc-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{result.executionTimeMs} ms</span>
                </div>
              </div>

              {result.matches.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {result.matches.map((m) => {
                    const isSelected = selectedMatchIndex === m.matchIndex;
                    return (
                      <div
                        key={m.matchIndex}
                        onClick={() =>
                          setSelectedMatchIndex(isSelected ? null : m.matchIndex)
                        }
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-xs"
                            : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 hover:border-emerald-500/50"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            Match #{m.matchIndex}
                          </span>
                          <span className="font-mono text-[11px] text-zinc-400">
                            Line {m.line}:{m.column} • pos {m.start}–{m.end}
                          </span>
                        </div>

                        <pre className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto whitespace-pre-wrap break-all">
                          {m.value}
                        </pre>

                        {/* Capture Groups */}
                        {m.groups.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-200/80 dark:border-zinc-700/80 space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                              Capture Groups:
                            </span>
                            <div className="grid grid-cols-1 gap-1">
                              {m.groups.map((g, gi) => (
                                <div
                                  key={gi}
                                  className="flex items-start gap-2 text-xs font-mono bg-zinc-100/80 dark:bg-zinc-900/60 p-1.5 rounded-md"
                                >
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                                    {g.name ? `$${g.name}` : `$${g.index}`}:
                                  </span>
                                  <span className="text-zinc-800 dark:text-zinc-200 break-all">
                                    &quot;{g.value}&quot;
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-400 space-y-2">
                  <Regex className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600 stroke-[1.2]" />
                  <p className="text-xs">
                    {pattern ? "No matches found in the test string." : "Enter a regex pattern to see matches."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUBSTITUTE & REPLACE */}
      {/* ========================================================================= */}
      {activeTab === "replace" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 space-y-4">
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Replacement Pattern
                </label>
                <span className="text-xs text-zinc-400 font-mono">
                  Tokens: $1, $&, $&lt;name&gt;
                </span>
              </div>

              <textarea
                value={substitutionPattern}
                onChange={(e) => setSubstitutionPattern(e.target.value)}
                rows={4}
                placeholder="Enter replacement pattern, e.g. [$1] or $<name>"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />

              {/* Token quick buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-zinc-400 mr-1">Insert:</span>
                {[
                  { token: "$1", label: "$1 (Group 1)" },
                  { token: "$2", label: "$2 (Group 2)" },
                  { token: "$&", label: "$& (Match)" },
                  { token: "$`", label: "$` (Before)" },
                  { token: "$'", label: "$' (After)" },
                ].map(({ token, label }) => (
                  <button
                    key={token}
                    onClick={() => setSubstitutionPattern((prev) => prev + token)}
                    className="px-2 py-1 rounded-lg text-xs font-mono font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Original Input Preview */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
                Original Input
              </span>
              <pre className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs max-h-[220px] overflow-auto whitespace-pre-wrap break-all text-zinc-700 dark:text-zinc-300">
                {testText}
              </pre>
            </div>
          </div>

          {/* Replaced Output Result */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Substituted Output
                </span>

                {result.replacedText !== null && (
                  <button
                    onClick={() => {
                      if (result.replacedText) {
                        navigator.clipboard.writeText(result.replacedText);
                        setCopiedReplaced(true);
                        setTimeout(() => setCopiedReplaced(false), 2000);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-xs"
                  >
                    {copiedReplaced ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedReplaced ? "Copied Output!" : "Copy Result"}</span>
                  </button>
                )}
              </div>

              <pre className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs sm:text-sm min-h-[240px] max-h-[440px] overflow-auto whitespace-pre-wrap break-all text-zinc-900 dark:text-zinc-100">
                {result.replacedText || testText}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CODE GENERATORS */}
      {/* ========================================================================= */}
      {activeTab === "codegen" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-500" />
                  Ready-to-Use Code Snippets
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Copy and paste this pattern directly into your backend service, build script, or CLI tool.
                </p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeSnippet.code);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-xs self-start sm:self-auto"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copied Snippet!" : "Copy Code"}</span>
              </button>
            </div>

            {/* Language Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              {snippets.map((s) => (
                <button
                  key={s.language}
                  onClick={() => setSelectedLang(s.language)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    selectedLang === s.language
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Code Display */}
            <pre className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-black font-mono text-xs sm:text-sm text-emerald-400 overflow-x-auto leading-relaxed">
              <code>{activeSnippet.code}</code>
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REGEX CHEAT SHEET */}
      {/* ========================================================================= */}
      {activeTab === "cheatsheet" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {REGEX_CHEAT_SHEET.map((cat, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-emerald-500" />
                {cat.category}
              </h3>

              <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-2.5">Token</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {cat.items.map((item, ii) => (
                      <tr
                        key={ii}
                        onClick={() => setPattern((prev) => prev + item.token)}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                        title="Click to append token to regex pattern"
                      >
                        <td className="p-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.token}
                        </td>
                        <td className="p-2.5 text-zinc-800 dark:text-zinc-200 font-medium">
                          <div>{item.name}</div>
                          <div className="text-[10px] text-zinc-400">{item.description}</div>
                        </td>
                        <td className="p-2.5 font-mono text-zinc-500 text-[11px]">
                          {item.example}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Privacy Guarantee Callout */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3 print:hidden">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Zero Data Egress Guarantee:
          </span>{" "}
          All regular expression evaluations, capturing group extractions, and substitutions are processed 100% in local browser memory via JavaScript V8 engine. Test strings, database connections, authorization tokens, and server logs are never sent to external servers.
        </div>
      </div>
    </div>
  );
}
