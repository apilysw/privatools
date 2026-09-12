import type { Metadata } from "next";
import { TOOLS_REGISTRY } from "./registry";

/**
 * SEO metadata generator for Privatools utilities.
 * Generates canonical URLs, keyword-rich titles, descriptions, and OpenGraph/Twitter cards.
 */
export function generateToolMetadata(toolIdOrSlug: string): Metadata {
  const tool = TOOLS_REGISTRY.find(
    (t) => t.id === toolIdOrSlug || t.slug === toolIdOrSlug || t.slug.endsWith(`/${toolIdOrSlug}`)
  );

  if (!tool) {
    return {
      title: "Privatools — 100% Client-Side Privacy Utilities",
      description:
        "Zero-knowledge web utilities for structured data, images, code, and text. Fast, private, zero data uploads.",
    };
  }

  const title = `${tool.name} — 100% Client-Side | Privatools`;
  const url = `https://privatools.dev${tool.slug}/`;
  const description = `${tool.shortDesc} Executed 100% client-side in browser memory with zero data uploads.`;

  return {
    title,
    description,
    keywords: [
      ...tool.keywords,
      "privacy converter",
      "zero upload",
      "client-side",
      "offline tool",
      "privatools",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: tool.description,
      url,
      siteName: "Privatools",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
