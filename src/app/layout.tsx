import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Privatools — 100% Client-Side Privacy Converters",
  description:
    "Zero-knowledge web utilities for structured data, images, code, and text. Fast, private, zero data egress.",
  keywords: [
    "privacy converter",
    "json to yaml",
    "csv to json",
    "webp converter",
    "client-side",
    "zero knowledge",
    "offline tools",
  ],
  authors: [{ name: "Privatools" }],
  openGraph: {
    title: "Privatools — Zero-Knowledge Privacy Converters",
    description:
      "All file conversions and transformations run 100% locally in your browser. Zero tracking, zero uploads.",
    type: "website",
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
