import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  Cpu,
  Coffee,
  ExternalLink,
  Lock,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  WifiOff,
  EyeOff,
  Code2,
} from "lucide-react";
import { GithubIcon } from "@/components/shared/GithubIcon";
import {
  SITE_URL,
  SITE_NAME,
  GITHUB_REPO_URL,
  BUY_ME_A_COFFEE_URL,
  GUMROAD_BUY_URL,
  getCanonicalUrl,
} from "@/lib/config";

export default function AboutPage() {
  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${getCanonicalUrl("/about")}#webpage`,
        url: getCanonicalUrl("/about"),
        name: "About Privatools — Creator, Mission & Zero-Knowledge Architecture",
        description:
          "Meet the creator of Privatools, discover why we built 100% client-side privacy utilities, and learn how our zero-knowledge architecture protects your data.",
        isPartOf: {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: SITE_NAME,
          url: `${SITE_URL}/`,
        },
        mainEntity: {
          "@id": `${SITE_URL}/#organization`,
        },
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
          jobTitle: "Software Engineer & Privacy Advocate",
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
        "@type": "Person",
        "@id": `${getCanonicalUrl("/about")}#creator`,
        name: "Gareth Barlow",
        url: "https://github.com/apilysw",
        sameAs: ["https://github.com/apilysw", BUY_ME_A_COFFEE_URL],
        jobTitle: "Creator of Privatools",
        worksFor: {
          "@id": `${SITE_URL}/#organization`,
        },
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
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
          <span>Independent Privacy Engineering</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          About Privatools & The Privacy Mission
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Privatools was built to solve a pervasive problem: you shouldn&apos;t have to surrender
          sensitive business data, customer records, SSL certificates, or API tokens to remote
          cloud servers just to convert a file or inspect a payload.
        </p>
      </div>

      {/* Creator Profile Card */}
      <section className="p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
              GB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Gareth Barlow
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Creator & Engineer
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Software engineer & privacy advocate • United Kingdom
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://github.com/apilysw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors shadow-2xs"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub Profile</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 transition-colors shadow-2xs"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-500" />
              <span>Buy Me a Coffee</span>
              <ExternalLink className="w-3 h-3 text-amber-500/70" />
            </a>
          </div>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3">
          <p>
            Hi! I&apos;m Gareth. In my day-to-day software engineering work, I frequently found
            myself needing to convert data between formats, parse JSON Web Tokens, inspect X.509
            certificates, format EDI files, or run quick queries against SQLite databases.
          </p>
          <p>
            Almost every existing web tool for these tasks operated by sending the data to a remote
            backend server. When dealing with proprietary company source code, customer payroll
            spreadsheets, or production cryptographic tokens, uploading that data to an unknown
            third-party server is a severe compliance and security violation.
          </p>
          <p>
            Privatools was built to prove that modern browsers are fully equipped to run these
            workloads client-side. There are no venture capital investors pushing for data monetization,
            no tracking pixels, and no backend data collection. It is an independent engineering project
            dedicated to privacy and speed.
          </p>
        </div>
      </section>

      {/* Why Privatools Exists: Problem & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
          <div className="p-2.5 w-fit rounded-xl bg-red-500/10 text-red-500">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            The Danger of Traditional Cloud Converters
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Standard online conversion utilities route your files through remote backend servers.
            Even if their privacy policies state files are deleted after an hour, your sensitive
            data traverses public networks, sits in server-side temp storage, and is exposed to
            logging systems, third-party analytics, and database breaches. For GDPR, HIPAA, and
            SOC 2 compliance, this creates unnecessary risk.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
          <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            The Zero-Knowledge Client-Side Alternative
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Privatools completely inverts the model. All 19 tools execute exclusively inside your
            local browser sandbox. Data never leaves your RAM. Whether you are parsing a 50MB
            CSV, inspecting an enterprise SSL root certificate, or debugging OAuth tokens,
            0 bytes are uploaded to remote servers.
          </p>
        </div>
      </div>

      {/* Architectural Pillars */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          How It Works Under the Hood
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-2">
            <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-500">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              WebAssembly & Web Crypto
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              SQLite compiles to WebAssembly (sql.js) running near native speed. Cryptographic
              hashes and HMACs use the browser&apos;s native hardware-accelerated Web Crypto API.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-2">
            <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-500">
              <WifiOff className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              100% Offline Capability
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Equipped with a Cache-First Service Worker precaching all chunks, wasm binaries, and
              styles. You can disconnect your Wi-Fi or enable Airplane mode and all tools work.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-2">
            <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-500">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Zero Telemetry or Cookies
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              No tracking cookies, no Google Analytics, no session recorders, and no remote
              telemetry beacons. Your browsing activity and transformed data remain private.
            </p>
          </div>
        </div>
      </section>

      {/* Verify Independently */}
      <section className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Don&apos;t Just Take My Word for It — Verify the Proof
            </h2>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
            Because Privatools is 100% client-side, you can open your browser&apos;s DevTools Network tab,
            convert files, and see for yourself that exactly 0 network requests are sent.
          </p>
        </div>
        <Link
          href="/privacy-audit"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shrink-0 shadow-sm"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>View Privacy Audit Proof</span>
        </Link>
      </section>

      {/* Contact & Support Channels */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          How to Get in Touch & Support Privatools
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href={`${GITHUB_REPO_URL}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-emerald-500/50 transition-colors shadow-2xs group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="p-2 w-fit rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                <span>Bug Reports & Feature Requests</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Found a bug, want support for a new file format, or have ideas for a new utility?
                Open an issue on the GitHub issue tracker.
              </p>
            </div>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              github.com/apilysw/privatools/issues →
            </span>
          </a>

          <a
            href={BUY_ME_A_COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/10 hover:border-amber-500/50 transition-colors shadow-2xs group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="p-2 w-fit rounded-lg bg-amber-500/10 text-amber-500">
                <Coffee className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-amber-500 transition-colors flex items-center gap-1.5">
                <span>Support Development on Buy Me a Coffee</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-500/70 group-hover:text-amber-500 transition-colors" />
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Tips and community support go directly toward maintaining the project, expanding
                test suites, and adding new offline privacy tools based on community feedback.
              </p>
            </div>
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              buymeacoffee.com/privatools →
            </span>
          </a>

          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-emerald-500/50 transition-colors shadow-2xs group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="p-2 w-fit rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <Code2 className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                <span>Inspect the Source Code</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Privatools is source-available under the Business Source License 1.1, converting to
                open-source MIT on September 12, 2030. Audit our code anytime.
              </p>
            </div>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              github.com/apilysw/privatools →
            </span>
          </a>

          <a
            href={GUMROAD_BUY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-emerald-500/50 transition-colors shadow-2xs group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="p-2 w-fit rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                <span>Standalone Offline PWA License</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                If you want Privatools installed directly on your home screen or desktop with
                full offline support, grab a lifetime PWA license on Gumroad.
              </p>
            </div>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              privatools.gumroad.com/l/pwa →
            </span>
          </a>
        </div>
      </section>
    </div>
  );
}
