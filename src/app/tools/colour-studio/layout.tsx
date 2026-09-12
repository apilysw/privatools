import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/seo";
import { ToolLandingContent } from "@/components/shared/ToolLandingContent";

const baseMetadata = generateToolMetadata("color-studio");
export const metadata: Metadata = {
  ...baseMetadata,
  title: "Private Colour Converter & Contrast Checker | Privatools",
  openGraph: {
    ...baseMetadata.openGraph,
    title: "Private Colour Converter & Contrast Checker | Privatools",
  },
  twitter: {
    ...baseMetadata.twitter,
    title: "Private Colour Converter & Contrast Checker | Privatools",
  },
};

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ToolLandingContent toolId="color-studio" />
    </>
  );
}
