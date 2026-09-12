import fs from "fs";
import path from "path";
import { TOOLS_REGISTRY } from "../src/lib/registry";

const SITE_URL = "https://privatools.dev";

function generateToolsJson() {
  const outputPath = path.join(process.cwd(), "public", "tools.json");

  const catalog = {
    version: "1.0.0",
    platform: "Privatools",
    description: "100% Client-Side Zero-Knowledge Privacy Utilities",
    canonicalBase: SITE_URL,
    privacyGuarantee:
      "Zero data uploads. All processing executes in browser memory via WebAssembly (SQLite), Web Crypto, and Canvas APIs.",
    toolCount: TOOLS_REGISTRY.length,
    tools: TOOLS_REGISTRY.map((t) => ({
      id: t.id,
      name: t.name,
      seoTitle: t.seoTitle,
      slug: t.slug,
      canonicalUrl: `${SITE_URL}${t.slug}/`,
      category: t.category,
      shortDesc: t.shortDesc,
      description: t.description,
      supportedFormats: t.supportedFormats,
      keywords: t.keywords,
      privacyModel: "100% Client-Side In-Memory Execution, Zero Data Uploads",
      status: t.status,
    })),
  };

  fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  console.log(`[generate-tools-json] Successfully generated public/tools.json with ${catalog.toolCount} tools.`);
}

generateToolsJson();
