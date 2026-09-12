import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client-Side Privacy Audit Proof & Architecture — Privatools",
  description:
    "Inspect our zero-knowledge architecture. Verify how Privatools executes all file conversions, cryptographic calculations, and media processing in browser memory with zero data uploads.",
  alternates: {
    canonical: "https://privatools.dev/privacy-audit/",
  },
  openGraph: {
    title: "Client-Side Privacy Audit Proof — Privatools",
    description:
      "Inspect our zero-knowledge architecture and verify zero network egress.",
    url: "https://privatools.dev/privacy-audit/",
    siteName: "Privatools",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Client-Side Privacy Audit Proof — Privatools",
    description:
      "Verify how Privatools executes 100% in browser memory with zero data uploads.",
  },
};

export default function PrivacyAuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
