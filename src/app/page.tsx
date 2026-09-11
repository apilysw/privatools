"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  ArrowRight,
  Sparkles,
  Lock,
  Cpu,
  Zap,
  CheckCircle2,
  FileSpreadsheet,
  Image as ImageIcon,
  Binary,
  Code2,
  Key,
  FileText,
  Hash,
  Database,
  GitCompare,
  QrCode,
  Regex,
  BookOpen,
  Camera,
} from "lucide-react";
import { TOOLS_REGISTRY, TOOL_CATEGORIES } from "@/lib/registry";

const iconMap: Record<string, React.ElementType> = {
  FileSpreadsheet,
  Image: ImageIcon,
  Binary,
  ShieldCheck,
  Code2,
  Key,
  FileText,
  Hash,
  Database,
  GitCompare,
  QrCode,
  Regex,
  BookOpen,
  Camera,
};

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredTools = TOOLS_REGISTRY.filter((tool) => {
    const matchesCategory =
      selectedCategory === "All" || tool.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      tool.name.toLowerCase().includes(q) ||
      tool.shortDesc.toLowerCase().includes(q) ||
      tool.keywords.some((k) => k.toLowerCase().includes(q)) ||
      tool.supportedFormats.some((f) => f.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center pt-6 sm:pt-12 pb-6 max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero Server Uploads • 100% Client-Side Execution</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.1]">
          Privacy-First Utilities.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
            Zero Data Egress.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Convert sensitive JSON, YAML, CSV datasets, optimize images, and decode
          credentials directly in your browser. No files or strings ever leave your device.
        </p>

        {/* Live Browser Audit Card */}
        <div className="inline-flex flex-wrap items-center justify-center gap-4 sm:gap-8 px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Network Egress:
            </span>
            <span className="font-mono font-semibold text-emerald-500">0 Bytes</span>
          </div>
          <div className="hidden sm:block text-zinc-300 dark:text-zinc-700">•</div>
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-600 dark:text-zinc-400">Engine:</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Local WebAssembly & Canvas
            </span>
          </div>
          <div className="hidden sm:block text-zinc-300 dark:text-zinc-700">•</div>
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-zinc-600 dark:text-zinc-400">Security:</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              GDPR & HIPAA Safe
            </span>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto w-full md:w-auto">
            {TOOL_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by format or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTools.map((tool) => {
            const Icon = iconMap[tool.icon] || FileSpreadsheet;
            const isReady = tool.status === "ready";

            const CardContent = (
              <div
                className={`group relative h-full flex flex-col justify-between p-6 rounded-2xl border transition-all duration-200 ${
                  isReady
                    ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 cursor-pointer"
                    : "border-dashed border-zinc-300 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20 opacity-80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isReady
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {tool.badge && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {tool.badge}
                        </span>
                      )}
                      {!isReady && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                          In Development
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                    {tool.shortDesc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {tool.supportedFormats.slice(0, 4).map((fmt) => (
                      <span
                        key={fmt}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      >
                        {fmt}
                      </span>
                    ))}
                    {tool.supportedFormats.length > 4 && (
                      <span className="text-[10px] font-mono text-zinc-400 px-1">
                        +{tool.supportedFormats.length - 4}
                      </span>
                    )}
                  </div>

                  {isReady && (
                    <div className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 group-hover:translate-x-0.5 transition-transform">
                      <span>Launch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );

            return isReady ? (
              <Link key={tool.id} href={tool.slug}>
                {CardContent}
              </Link>
            ) : (
              <div key={tool.id}>{CardContent}</div>
            );
          })}
        </div>
      </section>

      {/* Trust & Architecture Showcase */}
      <section className="pt-10 border-t border-zinc-200 dark:border-zinc-800">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Why Zero-Knowledge Matters
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Most online converters upload your spreadsheets, images, and keys to unknown
            cloud servers. Privatools is architected differently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-500 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              100% Client-Side Sandbox
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Computations happen inside your browser’s isolated V8/SpiderMonkey runtime.
              You can even disconnect your Wi-Fi and the tools keep working.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-500 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Sub-Millisecond Execution
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              No network round-trips, file upload latency, or server queue bottlenecks.
              Instant keystroke conversions powered by optimized WebAssembly.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-500 mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Verifiable Privacy Proof
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Inspect our open source source code or check your browser’s DevTools Network
              tab. Zero HTTP POST requests, zero telemetry, zero analytics tracking.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
