"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Cpu, Globe, WifiOff } from "lucide-react";
import { GithubIcon } from "../shared/GithubIcon";
import { usePwa, PwaInstallButton } from "@/components/pwa/PwaManager";

export function Footer() {
  const { isOnline } = usePwa();

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
              Privatools processes files and data strictly in local browser memory with 0 bytes uploaded to remote servers. Install the standalone desktop or mobile PWA to run all 20+ utilities anywhere with zero internet connection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Online / Offline status badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                isOnline
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online & Ready</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span>Offline Mode Active</span>
                </>
              )}
            </div>

            <Link
              href="/privacy-audit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-zinc-700 dark:text-zinc-300 transition-colors shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verify Audit Proof</span>
            </Link>

            {/* PWA Install Trigger */}
            <PwaInstallButton />
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
                <Link href="/tools/random-studio" className="hover:text-emerald-500 transition-colors">
                  Provably Fair & Random Studio
                </Link>
              </li>
              <li>
                <Link href="/tools/regex-studio" className="hover:text-emerald-500 transition-colors">
                  Regex Workbench & Tester
                </Link>
              </li>
              <li>
                <Link href="/tools/hash-studio" className="hover:text-emerald-500 transition-colors">
                  Checksum & File Hash Studio
                </Link>
              </li>
              <li>
                <Link href="/tools/cert-inspector" className="hover:text-emerald-500 transition-colors">
                  X.509 Certificate Inspector
                </Link>
              </li>
              <li>
                <Link href="/tools/jwt-inspector" className="hover:text-emerald-500 transition-colors">
                  JWT & OAuth Token Debugger
                </Link>
              </li>
              <li>
                <Link href="/tools/edi-viewer" className="hover:text-emerald-500 transition-colors">
                  EDI X12 & UN/EDIFACT Viewer
                </Link>
              </li>
              <li>
                <Link href="/tools/subnet-calculator" className="hover:text-emerald-500 transition-colors">
                  Network & Subnet CIDR Studio
                </Link>
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
                <Link href="/tools/image-converter" className="hover:text-emerald-500 transition-colors">
                  Client-Side Image Lab (WebP/PNG/JPEG)
                </Link>
              </li>
              <li>
                <Link href="/tools/media-lab" className="hover:text-emerald-500 transition-colors">
                  Media Privacy & EXIF Scrubber
                </Link>
              </li>
              <li>
                <Link href="/tools/video-lab" className="hover:text-emerald-500 transition-colors">
                  Video & Audio Transcoder Studio
                </Link>
              </li>
              <li>
                <Link href="/tools/color-studio" className="hover:text-emerald-500 transition-colors">
                  CSS & Modern Color Palette Studio
                </Link>
              </li>
              <li>
                <Link href="/tools/qr-studio" className="hover:text-emerald-500 transition-colors">
                  Offline QR Code & Barcode Studio
                </Link>
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
                <Link href="/tools/data-converter" className="hover:text-emerald-500 transition-colors">
                  Structured Data (JSON/YAML/CSV/XML)
                </Link>
              </li>
              <li>
                <Link href="/tools/pdf-lab" className="hover:text-emerald-500 transition-colors">
                  Client-Side PDF Privacy Lab
                </Link>
              </li>
              <li>
                <Link href="/tools/diff-viewer" className="hover:text-emerald-500 transition-colors">
                  Code & Text Diff / Patch Studio
                </Link>
              </li>
              <li>
                <Link href="/tools/sqlite-lab" className="hover:text-emerald-500 transition-colors">
                  SQLite Database Explorer & Exporter
                </Link>
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
                <Link href="/tools/markdown-lab" className="hover:text-emerald-500 transition-colors">
                  Markdown & Technical Doc Studio
                </Link>
              </li>
              <li>
                <Link href="/tools/text-converter" className="hover:text-emerald-500 transition-colors">
                  Text & String Encoding Studio
                </Link>
              </li>
              <li>
                <Link href="/tools/date-time-calculator" className="hover:text-emerald-500 transition-colors">
                  Date, Time, Epoch & Cron Studio
                </Link>
              </li>
              <li className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <Link href="/privacy-audit" className="hover:text-emerald-500 transition-colors font-medium flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span>Client-Side Audit Proof</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/apilysw/privatools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-500 transition-colors font-medium flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
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
            <a
              href="https://github.com/apilysw/privatools"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-emerald-500 transition-colors"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>apilysw/privatools</span>
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span>Static Export</span>
            <span>•</span>
            <span>100% Client-Side</span>
            <span>•</span>
            <span>PWA Offline Capable</span>
            <span>•</span>
            <span>Zero Tracking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
