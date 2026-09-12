"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Star } from "lucide-react";
import { PrivacyBadge } from "./PrivacyBadge";
import { useToolPreferences } from "@/lib/useToolPreferences";

interface ToolHeaderProps {
  title: string;
  description: string;
  badge?: string;
  toolId?: string;
}

export function ToolHeader({ title, description, badge, toolId }: ToolHeaderProps) {
  const { isPinned, togglePin, isLoaded } = useToolPreferences();
  const pinned = toolId && isLoaded ? isPinned(toolId) : false;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4 mb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tools</span>
        </Link>
        <PrivacyBadge />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>

        {toolId && (
          <button
            type="button"
            onClick={() => togglePin(toolId)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              pinned
                ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
                : "bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
            title={pinned ? "Remove from Pinned Favorites" : "Pin to Favorites"}
            aria-label={pinned ? "Remove from Pinned Favorites" : "Pin to Favorites"}
          >
            <Star className={`w-3.5 h-3.5 ${pinned ? "fill-amber-500 text-amber-500" : ""}`} />
            <span>{pinned ? "Pinned" : "Pin Tool"}</span>
          </button>
        )}

        {badge && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {badge}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-3xl">
        {description}
      </p>
    </div>
  );
}
