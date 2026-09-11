import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Cpu, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Zero-Knowledge Guarantee
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md">
              Privatools executes all conversions, parsers, and decoders strictly inside your
              browser’s execution sandbox using WebAssembly, Canvas, and pure JavaScript. Your
              files, text, certificates, and secrets are never transmitted across the network.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Core Converters
            </h4>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/tools/data-converter" className="hover:text-emerald-500 transition-colors">
                  JSON / YAML / CSV / XML
                </Link>
              </li>
              <li>
                <Link href="/tools/image-converter" className="hover:text-emerald-500 transition-colors">
                  WebP / PNG / JPEG Lab
                </Link>
              </li>
              <li>
                <Link href="/tools/text-converter" className="hover:text-emerald-500 transition-colors">
                  Base64 / Hex / URL / Markdown
                </Link>
              </li>
              <li>
                <Link href="/tools/cert-inspector" className="hover:text-emerald-500 transition-colors">
                  X.509 Certificate Inspector
                </Link>
              </li>
              <li>
                <Link href="/tools/edi-viewer" className="hover:text-emerald-500 transition-colors">
                  EDI X12 & EDIFACT Viewer
                </Link>
              </li>
              <li>
                <Link href="/tools/jwt-inspector" className="hover:text-emerald-500 transition-colors">
                  JWT & OAuth Token Debugger
                </Link>
              </li>
              <li>
                <Link href="/tools/pdf-lab" className="hover:text-emerald-500 transition-colors">
                  PDF Privacy Lab (Merge & Split)
                </Link>
              </li>
              <li>
                <Link href="/tools/hash-studio" className="hover:text-emerald-500 transition-colors">
                  Checksum & Hash Studio (SHA/MD5/HMAC)
                </Link>
              </li>
              <li>
                <Link href="/tools/sqlite-lab" className="hover:text-emerald-500 transition-colors">
                  SQLite Database Explorer & Exporter
                </Link>
              </li>
              <li>
                <Link href="/tools/diff-viewer" className="hover:text-emerald-500 transition-colors">
                  Code & Text Diff / Patch Studio
                </Link>
              </li>
              <li>
                <Link href="/tools/qr-studio" className="hover:text-emerald-500 transition-colors">
                  Offline QR & Barcode Studio
                </Link>
              </li>
              <li>
                <Link href="/tools/regex-studio" className="hover:text-emerald-500 transition-colors">
                  Regex Workbench & Tester
                </Link>
              </li>
              <li>
                <Link href="/tools/markdown-lab" className="hover:text-emerald-500 transition-colors">
                  Markdown & Documentation Studio
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Architecture
            </h4>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/privacy-audit" className="hover:text-emerald-500 transition-colors">
                  Client-Side Audit Proof
                </Link>
              </li>
              <li className="flex items-center gap-1 text-zinc-500">
                <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                <span>WebAssembly & Web Workers</span>
              </li>
              <li className="flex items-center gap-1 text-zinc-500">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero Server Dependencies</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} Privatools. Designed for privacy, speed, and zero friction.</p>
          <div className="flex items-center gap-4">
            <span>Static Export</span>
            <span>•</span>
            <span>Offline Capable</span>
            <span>•</span>
            <span>Zero Tracking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
