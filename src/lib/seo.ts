import type { Metadata } from "next";
import { TOOLS_REGISTRY } from "./registry";
import { SITE_NAME, SITE_URL, getCanonicalUrl, DEFAULT_OG_IMAGE } from "./config";

/**
 * SEO metadata generator for Privatools utilities.
 * Generates canonical URLs, search-optimized titles, descriptions, and OpenGraph/Twitter cards.
 */
export function generateToolMetadata(toolIdOrSlug: string): Metadata {
  const tool = TOOLS_REGISTRY.find(
    (t) => t.id === toolIdOrSlug || t.slug === toolIdOrSlug || t.slug.endsWith(`/${toolIdOrSlug}`)
  );

  if (!tool) {
    return {
      title: `${SITE_NAME} — 100% Client-Side Privacy Utilities`,
      description:
        "Zero-knowledge web utilities for structured data, images, code, and text. Fast, private, zero data uploads.",
    };
  }

  const title = tool.seoTitle || `${tool.name} | ${SITE_NAME}`;
  const url = getCanonicalUrl(tool.slug);
  const description =
    tool.metaDescription ||
    `${tool.shortDesc} Executed 100% client-side in browser memory with zero data uploads.`;

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
      types: {
        "text/markdown": `${SITE_URL}${tool.slug}.md`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}
