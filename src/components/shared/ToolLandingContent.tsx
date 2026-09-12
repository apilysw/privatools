import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Cpu,
  Layers,
  HelpCircle,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Workflow,
} from "lucide-react";
import { TOOLS_CONTENT } from "@/lib/tool-content";
import { getToolById } from "@/lib/registry";

interface ToolLandingContentProps {
  toolId: string;
}

export function ToolLandingContent({ toolId }: ToolLandingContentProps) {
  const content = TOOLS_CONTENT[toolId];
  const tool = getToolById(toolId);

  if (!content || !tool) {
    return null;
  }

  // Related tools lookup
  const relatedTools = content.relatedToolIds
    .map((id) => getToolById(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  // JSON-LD Structured Data for SoftwareApplication and FAQPage
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: tool.name,
        description: tool.description,
        applicationCategory: "UtilityApplication",
        operatingSystem: "Web Browser",
        url: `https://privatools.com${tool.slug}`,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: content.howItWorks.join("; "),
        softwareRequirements: "Modern web browser with HTML5 and Web Crypto support",
        browserRequirements: "Requires JavaScript. Requires HTML5.",
      },
      {
        "@type": "FAQPage",
        mainEntity: content.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="mt-16 pt-12 border-t border-zinc-200 dark:border-zinc-800 space-y-16 print:hidden">
      {/* JSON-LD Script Tag */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Section 1: Overview & Architecture */}
      <section className="space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Architectural Privacy Guarantee</span>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {content.headline}
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-4xl">
            {content.overview}
          </p>
        </div>

        {/* Tech Stack Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-semibold text-zinc-400 mr-2 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            In-Browser Technology:
          </span>
          {content.techStack.map((tech, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Section 2: How It Works & Use Cases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* How It Works */}
        <section className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-5">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-lg">
            <Workflow className="w-5 h-5 text-emerald-500" />
            <h3>How Client-Side Processing Works</h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Every step executes within your browser runtime without network calls or cloud storage.
          </p>
          <ul className="space-y-3.5 text-sm">
            {content.howItWorks.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0 mt-0.5 border border-emerald-500/20">
                  {idx + 1}
                </span>
                <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {step}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Enterprise & Developer Use Cases */}
        <section className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-5">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-lg">
            <Layers className="w-5 h-5 text-emerald-500" />
            <h3>Common Workflows & Use Cases</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {content.useCases.map((useCase, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-800/30 space-y-1"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{useCase.title}</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pl-5.5">
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Section 3: Frequently Asked Questions (FAQ Accordion) */}
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Questions & Answers</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {content.faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/60 p-4 transition-all open:shadow-sm"
            >
              <summary className="flex items-center justify-between font-semibold text-sm text-zinc-900 dark:text-zinc-100 cursor-pointer list-none select-none">
                <span>{faq.question}</span>
                <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4" />
              </summary>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Section 4: Related Privacy-First Tools */}
      {relatedTools.length > 0 && (
        <section className="space-y-6 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Related Privacy-First Tools
            </h3>
            <Link
              href="/"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Explore all tools</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedTools.map((relTool) => (
              <Link
                key={relTool.id}
                href={relTool.slug}
                className="group p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                      {relTool.category}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Zero Uploads
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {relTool.name}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {relTool.shortDesc}
                  </p>
                </div>

                <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ToolLandingContent;
