import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/seo";
import { ToolLandingContent } from "@/components/shared/ToolLandingContent";

export const metadata: Metadata = generateToolMetadata("subnet-calculator");

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ToolLandingContent toolId="subnet-calculator" />
    </>
  );
}
