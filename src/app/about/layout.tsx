import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, getCanonicalUrl, DEFAULT_OG_IMAGE } from "@/lib/config";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About Privatools — Creator, Mission & Zero-Knowledge Architecture | Privatools",
  description:
    "Meet the creator of Privatools, discover why we built 100% client-side privacy utilities, and learn how our zero-knowledge architecture protects your data.",
  alternates: {
    canonical: getCanonicalUrl("/about"),
    types: {
      "text/markdown": `${SITE_URL}/about.md`,
    },
  },
  openGraph: {
    title: "About Privatools — Creator, Mission & Zero-Knowledge Architecture | Privatools",
    description:
      "Meet the creator of Privatools, discover why we built 100% client-side privacy utilities, and learn how our zero-knowledge architecture protects your data.",
    url: getCanonicalUrl("/about"),
    siteName: SITE_NAME,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Privatools — Creator, Mission & Zero-Knowledge Architecture | Privatools",
    description:
      "Meet the creator of Privatools, discover why we built 100% client-side privacy utilities, and learn how our zero-knowledge architecture protects your data.",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
