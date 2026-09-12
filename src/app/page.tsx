"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  ArrowRight,
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
  Network,
  Clock,
  Video,
  Palette,
  Dices,
  Star,
  SlidersHorizontal,
  GripVertical,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Smartphone,
  KeyRound,
  ExternalLink,
  X,
} from "lucide-react";
import { TOOL_CATEGORIES, TOOLS_REGISTRY, searchTools, ToolMetadata } from "@/lib/registry";
import { useToolPreferences, orderToolsByCustomOrder } from "@/lib/useToolPreferences";
import { usePwa } from "@/components/pwa/PwaManager";
import {
  SITE_URL,
  SITE_NAME,
  GITHUB_REPO_URL,
  BUY_ME_A_COFFEE_URL,
  GUMROAD_BUY_URL,
  getCanonicalUrl,
} from "@/lib/config";

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
  Network,
  Clock,
  Video,
  Palette,
  Dices,
};

const BANNER_STORAGE_KEY = "privatools_pwa_banner_dismissed";
const BANNER_EVENT = "privatools:banner-dismissed";

function subscribeBanner(callback: () => void) {
  window.addEventListener(BANNER_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(BANNER_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getBannerSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(BANNER_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getBannerServerSnapshot(): boolean {
  return false;
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const {
    isLoaded,
    pinnedIds,
    customOrder,
    isPinned,
    togglePin,
    moveTool,
    reorderTools,
    resetToDefault,
  } = useToolPreferences();

  const { isLicensed, isInstalled, showLicenseGate } = usePwa();
  const isBannerDismissed = useSyncExternalStore(
    subscribeBanner,
    getBannerSnapshot,
    getBannerServerSnapshot
  );

  const handleDismissBanner = () => {
    try {
      sessionStorage.setItem(BANNER_STORAGE_KEY, "true");
      window.dispatchEvent(new Event(BANNER_EVENT));
    } catch {
      // ignore
    }
  };

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const showPwaBanner = isMounted && !isLicensed && !isInstalled && !isBannerDismissed;

  // Dynamically include Pinned filter if user has pinned tools
  const categories = useMemo(() => {
    if (isLoaded && pinnedIds.length > 0) {
      return ["All", "★ Pinned", ...TOOL_CATEGORIES.filter((c) => c !== "All")];
    }
    return TOOL_CATEGORIES;
  }, [isLoaded, pinnedIds.length]);

  // Order tools based on custom sequence
  const orderedTools = useMemo(() => {
    if (!isLoaded) {
      return searchTools(searchQuery, selectedCategory === "★ Pinned" ? "All" : selectedCategory);
    }

    if (selectedCategory === "★ Pinned") {
      let list = orderToolsByCustomOrder(
        searchTools("", "All").filter((t) => pinnedIds.includes(t.id)),
        customOrder
      );
      if (searchQuery.trim()) {
        const matching = searchTools(searchQuery, "All");
        const matchingIds = new Set(matching.map((m) => m.id));
        list = list.filter((t) => matchingIds.has(t.id));
      }
      return list;
    }

    const searched = searchTools(searchQuery, selectedCategory);
    return orderToolsByCustomOrder(searched, customOrder);
  }, [isLoaded, searchQuery, selectedCategory, pinnedIds, customOrder]);

  // Pinned favorites quick list for display on All tab
  const pinnedFavorites = useMemo(() => {
    if (!isLoaded || pinnedIds.length === 0) return [];
    return orderToolsByCustomOrder(
      searchTools("", "All").filter((t) => pinnedIds.includes(t.id)),
      customOrder
    );
  }, [isLoaded, pinnedIds, customOrder]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const list = [...customOrder];
    const fromIdx = list.indexOf(draggedId);
    const toIdx = list.indexOf(targetId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      reorderTools(list);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const renderToolCard = (tool: ToolMetadata, index: number, isPinnedQuickList = false) => {
    const Icon = iconMap[tool.icon] || FileSpreadsheet;
    const isReady = tool.status === "ready";
    const pinned = isPinned(tool.id);
    const isDragOver = dragOverId === tool.id && draggedId !== tool.id;

    const CardInner = (
      <div
        draggable={isReorderMode && !isPinnedQuickList}
        onDragStart={(e) => handleDragStart(e, tool.id)}
        onDragOver={(e) => handleDragOver(e, tool.id)}
        onDrop={(e) => {
          e.preventDefault();
          handleDrop(tool.id);
        }}
        onDragEnd={handleDragEnd}
        className={`group relative h-full flex flex-col justify-between p-6 rounded-2xl border transition-all duration-200 ${
          isDragOver
            ? "border-emerald-500 ring-2 ring-emerald-500/50 scale-[1.02] bg-emerald-500/5"
            : isReady
            ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 cursor-pointer"
            : "border-dashed border-zinc-300 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20 opacity-80"
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              {isReorderMode && !isPinnedQuickList && (
                <div
                  className="cursor-grab active:cursor-grabbing p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-2.5 rounded-xl ${
                  isReady
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Reorder Up/Down arrows in reorder mode */}
              {isReorderMode && !isPinnedQuickList && (
                <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      moveTool(tool.id, "up");
                    }}
                    className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-25 text-zinc-600 dark:text-zinc-300 transition-colors"
                    title="Move up / earlier"
                    aria-label="Move earlier"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={index === orderedTools.length - 1}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      moveTool(tool.id, "down");
                    }}
                    className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-25 text-zinc-600 dark:text-zinc-300 transition-colors"
                    title="Move down / later"
                    aria-label="Move later"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Pin / Favorite Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePin(tool.id);
                }}
                className={`p-1.5 rounded-xl transition-all ${
                  pinned
                    ? "text-amber-500 bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20"
                    : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 opacity-60 group-hover:opacity-100"
                }`}
                title={pinned ? "Remove from Pinned Favorites" : "Pin to Favorites"}
                aria-label={pinned ? "Remove from Pinned Favorites" : "Pin to Favorites"}
              >
                <Star className={`w-4 h-4 ${pinned ? "fill-amber-500" : ""}`} />
              </button>

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

          {isReady && !isReorderMode && (
            <div className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 group-hover:translate-x-0.5 transition-transform">
              <span>Launch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    );

    // Disable navigation click during reorder mode so users can interact with cards safely
    if (isReorderMode) {
      return <div key={tool.id}>{CardInner}</div>;
    }

    return isReady ? (
      <Link key={tool.id} href={tool.slug}>
        {CardInner}
      </Link>
    ) : (
      <div key={tool.id}>{CardInner}</div>
    );
  };

  const homepageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description:
          "100% Client-Side Zero-Knowledge Privacy Utilities. Process sensitive datasets, files, and secrets directly in browser memory with zero data uploads.",
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/icons/icon-512.png`,
        sameAs: [GITHUB_REPO_URL, BUY_ME_A_COFFEE_URL],
        founder: {
          "@type": "Person",
          "@id": `${getCanonicalUrl("/about")}#creator`,
          name: "Gareth Barlow",
          url: "https://github.com/apilysw",
          sameAs: ["https://github.com/apilysw", BUY_ME_A_COFFEE_URL],
          jobTitle: "Software Engineer & Creator of Privatools",
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "technical support",
            url: `${GITHUB_REPO_URL}/issues`,
          },
        ],
        knowsAbout: [
          "Zero-Knowledge Web Applications",
          "Client-Side Cryptography",
          "WebAssembly",
          "Privacy Engineering",
          "Offline Web Applications",
        ],
      },
      {
        "@type": "ItemList",
        name: "Privatools Web Utilities",
        description: "Complete catalog of 100% client-side privacy converters and developer studios",
        numberOfItems: TOOLS_REGISTRY.length,
        itemListElement: TOOLS_REGISTRY.map((t, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: t.name,
          description: t.shortDesc,
          url: getCanonicalUrl(t.slug),
        })),
      },
    ],
  };

  return (
    <div className="space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
      />
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
              Data Uploads:
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
              GDPR/HIPAA-Friendly
            </span>
          </div>
        </div>
      </section>

      {/* Prominent Offline PWA Promotion Banner */}
      {showPwaBanner && (
        <section
          suppressHydrationWarning
          className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-emerald-500/10 dark:from-emerald-500/10 dark:via-zinc-900/80 dark:to-teal-500/10 p-6 sm:p-8 shadow-xs animate-in fade-in duration-300"
        >
          {/* Dismiss button */}
          <button
            type="button"
            onClick={handleDismissBanner}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80 transition-colors z-10"
            title="Dismiss banner"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pr-8 lg:pr-0">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Desktop & Mobile Offline App</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Take Privatools Offline. Zero Internet Required.
              </h2>

              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Install all 19 privacy tools and converters directly to your home screen or dock. 100% ad-free, instant cached launches on flights and trains, with one-time ownership.
              </p>

              {/* Feature checklist */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400 pt-1 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Instant Cache & Offline
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  100% Ad-Free Forever
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Dock / Home Screen App
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  One-Time Purchase (~£3)
                </span>
              </div>
            </div>

            {/* Call to action buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 min-w-[200px]">
              <button
                type="button"
                onClick={showLicenseGate}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <KeyRound className="w-4 h-4" />
                <span>Get Offline App</span>
              </button>

              <a
                href={GUMROAD_BUY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buy License (~£3)</span>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Filter and Search Bar */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto w-full md:w-auto">
            {categories.map((category) => (
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

          {/* Quick Search & Reorder Action */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <label htmlFor="homepage-tool-search" className="sr-only">
                Filter tools by format or keyword
              </label>
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="homepage-tool-search"
                type="text"
                placeholder="Filter by format or keyword..."
                aria-label="Filter tools by format or keyword"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsReorderMode((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap ${
                isReorderMode
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50"
              }`}
              title={isReorderMode ? "Done reordering tools" : "Customize order of tools"}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isReorderMode ? "Done" : "Customise"}</span>
            </button>
          </div>
        </div>

        {/* Reorder Mode Helper Banner */}
        {isReorderMode && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-medium">
              <GripVertical className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Drag cards or use arrow buttons to arrange your tools. Reordering is saved to local storage.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={resetToDefault}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Default</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReorderMode(false)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
              >
                Done Reordering
              </button>
            </div>
          </div>
        )}

        {/* Pinned Favorites Section (Displayed on All tab when no search query and not in reorder mode) */}
        {!isReorderMode &&
          selectedCategory === "All" &&
          !searchQuery.trim() &&
          pinnedFavorites.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Pinned Favorites ({pinnedFavorites.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("★ Pinned")}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  View only favorites
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pinnedFavorites.map((tool, idx) => renderToolCard(tool, idx, true))}
              </div>

              <div className="pt-6 border-b border-zinc-200 dark:border-zinc-800"></div>
            </div>
          )}

        {/* Section Header for Main Grid */}
        {!isReorderMode &&
          selectedCategory === "All" &&
          !searchQuery.trim() &&
          pinnedFavorites.length > 0 && (
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                All Utilities ({orderedTools.length})
              </h2>
            </div>
          )}

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {orderedTools.length === 0 ? (
            <div className="col-span-full text-center py-12 space-y-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <Star className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {selectedCategory === "★ Pinned"
                  ? "No pinned favorites yet"
                  : "No tools found matching your search"}
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {selectedCategory === "★ Pinned"
                  ? "Click the star icon on any tool card to add it to your pinned favorites."
                  : "Try searching with different keywords, format names (e.g. json, csv, mp3), or clear the search input."}
              </p>
            </div>
          ) : (
            orderedTools.map((tool, idx) => renderToolCard(tool, idx))
          )}
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
              Fast Local Execution
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              No network round-trips, file upload latency, or server queue bottlenecks.
              Computations execute directly in device memory at native hardware speeds.
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
              Inspect our{" "}
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-500 transition-colors"
              >
                source-available code on GitHub
              </a>{" "}
              or check your browser’s DevTools Network tab. Tool processing makes zero data-upload requests. Zero telemetry, zero analytics tracking.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
