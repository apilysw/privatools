import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Terminal,
  Cpu,
  WifiOff,
  EyeOff,
  FileCheck,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { GithubIcon } from "@/components/shared/GithubIcon";
import { SITE_NAME, getCanonicalUrl, DEFAULT_OG_IMAGE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Independent Privacy Audit & Zero-Knowledge Proof | Privatools",
  description:
    "Verifiable DevTools audit proof demonstrating 100% client-side execution with zero data uploads, zero cookies, and zero tracking.",
  alternates: {
    canonical: getCanonicalUrl("/privacy-audit"),
  },
  openGraph: {
    title: "Independent Privacy Audit & Zero-Knowledge Proof | Privatools",
    description:
      "Verifiable DevTools audit proof demonstrating 100% client-side execution with zero data uploads, zero cookies, and zero tracking.",
    url: getCanonicalUrl("/privacy-audit"),
    siteName: SITE_NAME,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Independent Privacy Audit & Zero-Knowledge Proof | Privatools",
    description:
      "Verifiable DevTools audit proof demonstrating 100% client-side execution with zero data uploads, zero cookies, and zero tracking.",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default function PrivacyAuditPage() {
  const auditJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        name: "How to Verify Zero Network Data Uploads in Privatools",
        description:
          "Step-by-step instructions to inspect browser DevTools Network tab and independently verify zero data egress.",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Open Browser DevTools",
            text: "Press F12 or Cmd+Option+I and select the Network tab.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Convert or Transform a File",
            text: "Drop any JSON, CSV, image, or certificate into a tool and execute the conversion.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Inspect Network Activity",
            text: "Observe that 0 data upload requests are made. No background fetch, XMLHttpRequest, or WebSocket messages transmit your data.",
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Does Privatools upload files to any remote server?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Privatools executes 100% of data processing in local browser memory using JavaScript, WebAssembly, and Canvas APIs. Zero bytes of payload data are uploaded.",
            },
          },
          {
            "@type": "Question",
            name: "Is Privatools compliant with GDPR, HIPAA, and SOC 2?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Because sensitive payloads and PII never leave the user's device, processing does not create third-party data processor exposure or data residency violations.",
            },
          },
          {
            "@type": "Question",
            name: "Does Privatools work offline?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. All tool engines run locally without network connection once loaded or installed via the PWA.",
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(auditJsonLd) }}
      />
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
            HTML5 Canvas API, Web Crypto, and WebAssembly (SQLite) runtime.
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
            Observe that exactly <strong>0 data upload requests</strong> are made. No background `fetch`, `XMLHttpRequest`, or `WebSocket`
            messages transmit your file or string data. (Optional offline PWA license activation contacts Gumroad solely to verify your license key).
          </li>
        </ol>
      </section>

      {/* Source Code Verification Card */}
      <section className="p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <GithubIcon className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Audit the Source Code on GitHub
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Privatools is completely transparent. You can clone the repository, inspect the WebAssembly & Canvas conversion algorithms, or build and run the static export locally on your own machine.
          </p>
        </div>

        <a
          href="https://github.com/apilysw/privatools"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs transition-colors shadow-sm shrink-0"
        >
          <GithubIcon className="w-4 h-4" />
          <span>View on GitHub</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </section>
    </div>
  );
}
