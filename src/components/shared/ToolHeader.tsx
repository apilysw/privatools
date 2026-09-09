"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PrivacyBadge } from "./PrivacyBadge";

interface ToolHeaderProps {
  title: string;
  description: string;
  badge?: string;
}

export function ToolHeader({ title, description, badge }: ToolHeaderProps) {
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
