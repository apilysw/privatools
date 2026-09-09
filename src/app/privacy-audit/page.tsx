import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Terminal,
  Lock,
  Cpu,
  WifiOff,
  EyeOff,
  FileCheck,
  ArrowLeft,
} from "lucide-react";

export default function PrivacyAuditPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
          <ShieldCheck className="w-4 h-4" />
          <span>Independent Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          How Privatools Guarantees Zero Knowledge
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Unlike traditional utility websites that upload your spreadsheets, images, and API
          keys to remote cloud servers, Privatools operates exclusively inside your browser.
        </p>
      </div>

      {/* Core Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-500">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
            Client-Side Computation Engine
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            All algorithms—whether parsing a 20MB CSV, converting an image to WebP, or decoding
            an X.509 certificate—execute directly via the browser’s V8 JavaScript engine,
            Web Workers, and HTML5 Canvas API.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-500">
            <WifiOff className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
            Works Completely Offline
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Once the static assets load, you can turn on Airplane mode or disable your network
            connection entirely. Every converter and inspector will continue to function
            at full speed with zero degradation.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-500">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
            Zero Tracking & Zero Cookies
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            No Google Analytics, no Facebook pixels, no telemetry beacons, and no tracking
            cookies. What you convert remains strictly between you and your computer hardware.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-500">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
            Enterprise Compliance Friendly
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Because sensitive company spreadsheets, patient records (HIPAA), or customer
            identifiers (GDPR) never cross the network perimeter, you avoid data residency
            violations and third-party data processor risks.
          </p>
        </div>
      </div>

      {/* How to Verify Yourself (DevTools Guide) */}
      <section className="p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-6">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Verify for Yourself in 3 Steps
          </h2>
        </div>

        <ol className="space-y-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 list-decimal list-inside">
          <li className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <strong className="text-zinc-900 dark:text-zinc-200">Open Browser DevTools:</strong>{" "}
            Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-xs">F12</kbd> or{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-xs">Cmd + Option + I</kbd> and
            click on the <strong>Network</strong> tab.
          </li>
          <li className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <strong className="text-zinc-900 dark:text-zinc-200">Convert or Upload a File:</strong>{" "}
            Drop any large JSON, CSV, or Image into the converter and click Convert or Download.
          </li>
          <li className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <strong className="text-zinc-900 dark:text-zinc-200">Inspect the Network Tab:</strong>{" "}
            Observe that exactly <strong>0 requests</strong> are made. No background `fetch`, `XMLHttpRequest`, or `WebSocket`
            messages are emitted.
          </li>
        </ol>
      </section>
    </div>
  );
}
