"use client";

import React from "react";
import Link from "next/link";
import { Shield, Search } from "lucide-react";
import { PrivacyBadge } from "../shared/PrivacyBadge";
import { GithubIcon } from "../shared/GithubIcon";
import { PwaInstallButton } from "@/components/pwa/PwaManager";

interface NavbarProps {
  onOpenCommandPalette?: () => void;
}

export function Navbar({ onOpenCommandPalette }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                Privatools
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Zero-Knowledge
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 hidden sm:block">
              100% Client-Side Privacy Utilities
            </p>
          </div>
        </Link>

        {/* Center Search / Command Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex-1 max-w-md hidden md:flex items-center justify-between px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search converters or tools...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono text-zinc-500">
            <span>⌘</span>K
          </kbd>
        </button>

        {/* Right navigation */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={onOpenCommandPalette}
            className="md:hidden p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Search tools"
          >
            <Search className="w-4 h-4" />
          </button>
          <div className="hidden xl:block">
            <PrivacyBadge />
          </div>
          <Link
            href="/privacy-audit"
            className="hidden sm:inline-block text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Proof & Audit
          </Link>
          <a
            href="https://github.com/apilysw/privatools"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="View Source on GitHub"
            aria-label="View Source on GitHub"
          >
            <GithubIcon className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <PwaInstallButton />
        </div>
      </div>
    </header>
  );
}
