"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Lock, Cpu, Globe, WifiOff, Coffee } from "lucide-react";
import { GithubIcon } from "../shared/GithubIcon";
import { usePwa, PwaInstallButton } from "@/components/pwa/PwaManager";
import { GITHUB_REPO_URL, BUY_ME_A_COFFEE_URL } from "@/lib/config";

interface ToolLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

function ToolLink({ href, children, className = "" }: ToolLinkProps) {
  const pathname = usePathname();
  const cleanPath = (pathname || "").replace(/\/+$/, "");
  const cleanHref = href.replace(/\/+$/, "");
  const active = cleanPath !== "" && cleanPath === cleanHref;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 transition-all ${
        active
          ? "text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 dark:bg-emerald-500/15 px-2 py-0.5 -mx-2 rounded-md border border-emerald-500/25 shadow-2xs"
          : `hover:text-emerald-500 transition-colors ${className}`
      }`}
    >
      {active && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" aria-hidden="true" />
      )}
      <span>{children}</span>
    </Link>
  );
}

export function Footer() {
  const { isOnline } = usePwa();
  const pathname = usePathname();
  const cleanPath = (pathname || "").replace(/\/+$/, "");
  const isActive = (href: string) => cleanPath !== "" && cleanPath === href.replace(/\/+$/, "");

  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 py-12 mt-20 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Guarantee & PWA Status Card */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Zero-Knowledge Privacy Guarantee & Offline PWA
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Zero Uploads
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Privatools processes files and data strictly in local browser memory with 0 bytes uploaded to remote servers. Install the standalone desktop or mobile PWA to run all 19 privacy tools with zero internet connection once cached.
            </p>
          </div>

          {/* Action & Status Buttons: 2x2 Grid aligned right */}
          <div className="grid grid-cols-2 gap-2.5 shrink-0 w-full sm:w-auto self-stretch sm:self-auto">
            {/* Row 1, Col 1: About & Mission */}
            <Link
              href="/about"
              aria-current={isActive("/about") ? "page" : undefined}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors shadow-xs whitespace-nowrap w-full ${
                isActive("/about")
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold"
                  : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>About & Mission</span>
            </Link>

            {/* Row 1, Col 2: Verify Audit Proof */}
            <Link
              href="/privacy-audit"
              aria-current={isActive("/privacy-audit") ? "page" : undefined}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors shadow-xs whitespace-nowrap w-full ${
                isActive("/privacy-audit")
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold"
                  : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Verify Audit Proof</span>
            </Link>

            {/* Row 2, Col 1: Online & Ready */}
            <div
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap w-full ${
                isOnline
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>Online & Ready</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Offline Mode Active</span>
                </>
              )}
            </div>

            {/* Row 2, Col 2: Install App */}
            <PwaInstallButton className="w-full" />
          </div>
        </div>

        {/* Categorized Tools Grid (4 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
          {/* Column 1: Security & Cryptography */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Security & Cryptography</span>
            </h4>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>
                <ToolLink href="/tools/random-studio">
                  Provably Fair & Random Studio
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/regex-studio">
                  Regex Workbench & Tester
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/hash-studio">
                  Checksum & File Hash Studio
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/cert-inspector">
                  X.509 Certificate Inspector
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/jwt-inspector">
                  JWT & OAuth Token Debugger
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/edi-viewer">
                  EDI X12 & UN/EDIFACT Viewer
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/subnet-calculator">
                  Network & Subnet CIDR Studio
                </ToolLink>
              </li>
            </ul>
          </div>

          {/* Column 2: Media & Visualization */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span>Media & Visualization</span>
            </h4>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>
                <ToolLink href="/tools/image-converter">
                  Client-Side Image Lab (WebP/PNG/JPEG)
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/media-lab">
                  Media Privacy & EXIF Scrubber
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/video-lab">
                  Video & Audio Transcoder Studio
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/color-studio">
                  CSS & Modern Color Palette Studio
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/qr-studio">
                  Offline QR Code & Barcode Studio
                </ToolLink>
              </li>
            </ul>
          </div>

          {/* Column 3: Data & Storage */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-500" />
              <span>Data & Storage</span>
            </h4>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>
                <ToolLink href="/tools/data-converter">
                  Structured Data (JSON/YAML/CSV/XML)
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/pdf-lab">
                  Client-Side PDF Privacy Lab
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/diff-viewer">
                  Code & Text Diff / Patch Studio
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/sqlite-lab">
                  SQLite Database Explorer & Exporter
                </ToolLink>
              </li>
            </ul>
          </div>

          {/* Column 4: Text, Time & Architecture */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Text, Time & Architecture</span>
            </h4>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>
                <ToolLink href="/tools/markdown-lab">
                  Markdown & Technical Doc Studio
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/text-converter">
                  Text & String Encoding Studio
                </ToolLink>
              </li>
              <li>
                <ToolLink href="/tools/date-time-calculator">
                  Date, Time, Epoch & Cron Studio
                </ToolLink>
              </li>
              <li className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <ToolLink
                  href="/about"
                  className="font-medium flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300"
                >
                  About & Creator
                </ToolLink>
              </li>
              <li>
                <ToolLink
                  href="/privacy-audit"
                  className="font-medium flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300"
                >
                  Client-Side Audit Proof
                </ToolLink>
              </li>
              <li>
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-500 transition-colors font-medium flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href={BUY_ME_A_COFFEE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-500 transition-colors font-medium flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-500" />
                  <span>Buy Me a Coffee</span>
                </a>
              </li>
              <li className="text-[11px] text-zinc-400">
                PWA Offline Service Worker (Cache-First)
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Metadata & Copyright */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex flex-wrap items-center gap-2">
            <p>© {new Date().getFullYear()} Privatools. Designed for privacy, speed, and zero friction.</p>
            <span>•</span>
            <Link
              href="/about"
              className={
                isActive("/about")
                  ? "text-emerald-600 dark:text-emerald-400 font-medium transition-colors"
                  : "hover:text-emerald-500 transition-colors"
              }
            >
              About & Mission
            </Link>
            <span>•</span>
            <Link
              href="/privacy-audit"
              className={
                isActive("/privacy-audit")
                  ? "text-emerald-600 dark:text-emerald-400 font-medium transition-colors"
                  : "hover:text-emerald-500 transition-colors"
              }
            >
              Audit Proof
            </Link>
            <span>•</span>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-emerald-500 transition-colors"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>apilysw/privatools</span>
            </a>
            <span>•</span>
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-amber-500 transition-colors"
            >
              <Coffee className="w-3 h-3 text-amber-500" />
              <span>Buy Me a Coffee</span>
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span>Static Export</span>
            <span>•</span>
            <span>100% Client-Side</span>
            <span>•</span>
            <span>PWA Offline Capable</span>
            <span>•</span>
            <span>Source-Available (BSL 1.1)</span>
            <span>•</span>
            <span>Zero Tracking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
