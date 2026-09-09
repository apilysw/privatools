"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function PrivacyBadge() {
  return (
    <Link
      href="/privacy-audit"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors"
      title="Click to learn how client-side privacy is guaranteed"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <ShieldCheck className="w-3.5 h-3.5" />
      <span>100% Client-Side (0 Data Sent)</span>
    </Link>
  );
}
