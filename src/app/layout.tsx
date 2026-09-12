import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/config";

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Privatools — 100% Client-Side Privacy Converters",
  description:
    "Zero-knowledge web utilities for structured data, images, code, and text. Fast, private, zero data uploads.",
  keywords: [
    "privacy converter",
    "json to yaml",
    "csv to json",
    "webp converter",
    "client-side",
    "zero knowledge",
    "offline tools",
    "pwa",
  ],
  authors: [{ name: "Privatools" }],
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Privatools",
  },
  openGraph: {
    title: "Privatools — Zero-Knowledge Privacy Converters",
    description:
      "All file conversions and transformations run 100% locally in your browser. Zero tracking, zero uploads.",
    url: SITE_URL,
    siteName: "Privatools",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privatools — Zero-Knowledge Privacy Converters",
    description:
      "All file conversions and transformations run 100% locally in your browser. Zero tracking, zero uploads.",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
