import fs from "fs";
import path from "path";
import { TOOLS_REGISTRY } from "../src/lib/registry";
import { TOOLS_CONTENT } from "../src/lib/tool-content";
import { SITE_URL, GUMROAD_BUY_URL, BUY_ME_A_COFFEE_URL } from "../src/lib/config";
import { generateToolMetadata } from "../src/lib/seo";
import sitemap from "../src/app/sitemap";
import robots from "../src/app/robots";

interface TestFailure {
  category: string;
  message: string;
}

const failures: TestFailure[] = [];

function assert(condition: boolean, category: string, message: string, failMessage?: string) {
  if (!condition) {
    const err = failMessage || message;
    failures.push({ category, message: err });
    console.error(`  ❌ [${category}] ${err}`);
  } else {
    console.log(`  ✅ [${category}] ${message}`);
  }
}

async function runTests() {
  console.log("\n🧪 Running Privatools Consistency & Integrity Test Suite...\n");

  // 1. Config Invariants
  console.log("--- 1. Configuration Invariants ---");
  assert(
    SITE_URL === "https://privatools.dev",
    "Config",
    `SITE_URL is https://privatools.dev`,
    `SITE_URL must be https://privatools.dev (actual: ${SITE_URL})`
  );
  assert(
    GUMROAD_BUY_URL === "https://privatools.gumroad.com/l/pwa",
    "Config",
    `GUMROAD_BUY_URL is https://privatools.gumroad.com/l/pwa`,
    `GUMROAD_BUY_URL must be https://privatools.gumroad.com/l/pwa (actual: ${GUMROAD_BUY_URL})`
  );
  assert(
    BUY_ME_A_COFFEE_URL === "https://buymeacoffee.com/privatools",
    "Config",
    `BUY_ME_A_COFFEE_URL is https://buymeacoffee.com/privatools`,
    `BUY_ME_A_COFFEE_URL must be https://buymeacoffee.com/privatools (actual: ${BUY_ME_A_COFFEE_URL})`
  );

  // 2. Tool Registry Invariants
  console.log("\n--- 2. Tool Registry Catalog ---");
  assert(
    TOOLS_REGISTRY.length === 19,
    "Registry",
    `TOOLS_REGISTRY has exactly 19 tools (found: ${TOOLS_REGISTRY.length})`,
    `TOOLS_REGISTRY must have exactly 19 tools (found: ${TOOLS_REGISTRY.length})`
  );

  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  for (const tool of TOOLS_REGISTRY) {
    assert(!seenIds.has(tool.id), "Registry", `Unique tool ID: "${tool.id}"`);
    seenIds.add(tool.id);

    assert(!seenSlugs.has(tool.slug), "Registry", `Unique tool slug: "${tool.slug}"`);
    seenSlugs.add(tool.slug);

    assert(
      tool.slug === `/tools/${tool.id}`,
      "Registry",
      `Tool "${tool.id}" slug matches "/tools/${tool.id}"`,
      `Tool "${tool.id}" slug must match "/tools/${tool.id}" (actual: "${tool.slug}")`
    );

    assert(
      tool.supportedFormats.length > 0,
      "Registry",
      `Tool "${tool.id}" specifies supportedFormats (${tool.supportedFormats.length} formats)`
    );

    assert(
      tool.keywords.length >= 3,
      "Registry",
      `Tool "${tool.id}" specifies keywords (${tool.keywords.length} keywords)`
    );
  }

  // 3. File System Routes & Layouts
  console.log("\n--- 3. Page Routes & Server Layouts ---");
  const toolsDir = path.join(process.cwd(), "src", "app", "tools");

  for (const tool of TOOLS_REGISTRY) {
    const pagePath = path.join(toolsDir, tool.id, "page.tsx");
    const layoutPath = path.join(toolsDir, tool.id, "layout.tsx");

    assert(
      fs.existsSync(pagePath),
      "Routes",
      `Page exists for tool "${tool.id}" at src/app/tools/${tool.id}/page.tsx`,
      `Missing page.tsx for tool "${tool.id}" at src/app/tools/${tool.id}/page.tsx`
    );

    assert(
      fs.existsSync(layoutPath),
      "Routes",
      `Layout exists for tool "${tool.id}" at src/app/tools/${tool.id}/layout.tsx`,
      `Missing layout.tsx for tool "${tool.id}" at src/app/tools/${tool.id}/layout.tsx`
    );

    if (fs.existsSync(pagePath)) {
      const pageContent = fs.readFileSync(pagePath, "utf8");
      assert(
        pageContent.includes(`toolId="${tool.id}"`),
        "Routes",
        `Tool page ${tool.id}/page.tsx passes toolId="${tool.id}" to ToolHeader`
      );
    }
  }

  // Non-tool standalone routes
  const aboutPagePath = path.join(process.cwd(), "src", "app", "about", "page.tsx");
  const aboutLayoutPath = path.join(process.cwd(), "src", "app", "about", "layout.tsx");
  assert(fs.existsSync(aboutPagePath), "Routes", "src/app/about/page.tsx exists");
  assert(fs.existsSync(aboutLayoutPath), "Routes", "src/app/about/layout.tsx exists");

  const privacyAuditPath = path.join(process.cwd(), "src", "app", "privacy-audit", "page.tsx");
  assert(fs.existsSync(privacyAuditPath), "Routes", "src/app/privacy-audit/page.tsx exists");

  // 4. Rich Landing Content & SEO Catalog
  console.log("\n--- 4. Rich Landing Content & Meta Descriptions ---");
  for (const tool of TOOLS_REGISTRY) {
    const content = TOOLS_CONTENT[tool.id];
    assert(
      Boolean(content),
      "SEO Content",
      `TOOLS_CONTENT has entry for tool "${tool.id}"`
    );

    if (content) {
      assert(
        content.headline.length > 10,
        "SEO Content",
        `Tool "${tool.id}" headline is descriptive: "${content.headline.slice(0, 40)}..."`
      );
      assert(
        content.techStack.length >= 2,
        "SEO Content",
        `Tool "${tool.id}" lists at least 2 technologies in techStack`
      );
      assert(
        content.useCases.length >= 2,
        "SEO Content",
        `Tool "${tool.id}" lists at least 2 useCases`
      );
      assert(
        content.faqs.length >= 2,
        "SEO Content",
        `Tool "${tool.id}" lists at least 2 FAQs`
      );
    }

    // Check meta description length (strictly 140 - 155 chars)
    const meta = generateToolMetadata(tool.id);
    const title = (meta.title as string) || "";
    const desc = meta.description || "";
    const len = desc.length;

    // Check title contains privacy/offline hook
    const hasPrivacyHook = /private|offline|no uploads/i.test(title);
    assert(
      hasPrivacyHook,
      "SEO Title",
      `Tool "${tool.id}" title contains privacy/offline hook ("Private", "Offline", or "No Uploads"): "${title}"`
    );

    assert(
      len >= 140 && len <= 155,
      "SEO Description",
      `Tool "${tool.id}" meta description length is ${len} chars (140-155 range)`,
      `Tool "${tool.id}" meta description length is ${len} chars (expected 140-155). Description: "${desc}"`
    );
  }

  // 5. public/tools.json Verification & Deep Compare
  console.log("\n--- 5. Public tools.json Deep Catalog Verification ---");
  const toolsJsonPath = path.join(process.cwd(), "public", "tools.json");
  assert(fs.existsSync(toolsJsonPath), "tools.json", "public/tools.json exists on disk");

  if (fs.existsSync(toolsJsonPath)) {
    try {
      const raw = fs.readFileSync(toolsJsonPath, "utf8");
      const data = JSON.parse(raw);

      assert(
        data.canonicalBase === "https://privatools.dev",
        "tools.json",
        `canonicalBase is https://privatools.dev`
      );

      assert(
        data.toolCount === TOOLS_REGISTRY.length,
        "tools.json",
        `toolCount (${data.toolCount}) matches TOOLS_REGISTRY.length (${TOOLS_REGISTRY.length})`
      );

      assert(
        Array.isArray(data.tools) && data.tools.length === TOOLS_REGISTRY.length,
        "tools.json",
        "data.tools array length matches TOOLS_REGISTRY"
      );

      for (const registryTool of TOOLS_REGISTRY) {
        const jsonTool = (data.tools || []).find((t: { id: string }) => t.id === registryTool.id);
        assert(Boolean(jsonTool), "tools.json", `Tool "${registryTool.id}" found in tools.json`);

        if (jsonTool) {
          assert(
            jsonTool.name === registryTool.name,
            "tools.json",
            `Tool "${registryTool.id}" name matches ("${jsonTool.name}")`
          );
          assert(
            jsonTool.seoTitle === registryTool.seoTitle,
            "tools.json",
            `Tool "${registryTool.id}" seoTitle matches ("${jsonTool.seoTitle}")`
          );
          assert(
            jsonTool.slug === registryTool.slug,
            "tools.json",
            `Tool "${registryTool.id}" slug matches ("${jsonTool.slug}")`
          );
          assert(
            jsonTool.category === registryTool.category,
            "tools.json",
            `Tool "${registryTool.id}" category matches ("${jsonTool.category}")`
          );
          assert(
            jsonTool.shortDesc === registryTool.shortDesc,
            "tools.json",
            `Tool "${registryTool.id}" shortDesc matches`
          );
          assert(
            JSON.stringify(jsonTool.supportedFormats) === JSON.stringify(registryTool.supportedFormats),
            "tools.json",
            `Tool "${registryTool.id}" supportedFormats match`
          );
          assert(
            JSON.stringify(jsonTool.keywords) === JSON.stringify(registryTool.keywords),
            "tools.json",
            `Tool "${registryTool.id}" keywords match`
          );
        }
      }
    } catch (err) {
      assert(false, "tools.json", `Failed to parse public/tools.json: ${err}`);
    }
  }

  // 6. public/llms.md Verification
  console.log("\n--- 6. Public llms.md Discovery Document ---");
  const llmsPath = path.join(process.cwd(), "public", "llms.md");
  assert(fs.existsSync(llmsPath), "llms.md", "public/llms.md exists on disk");

  if (fs.existsSync(llmsPath)) {
    const llmsContent = fs.readFileSync(llmsPath, "utf8");
    assert(
      llmsContent.includes("https://privatools.dev"),
      "llms.md",
      "llms.md contains canonical domain https://privatools.dev"
    );

    assert(
      llmsContent.includes("BUSL-1.1") || llmsContent.includes("BSL 1.1"),
      "llms.md",
      "llms.md references BSL 1.1 / BUSL-1.1 license"
    );

    assert(
      llmsContent.includes("September 12, 2030"),
      "llms.md",
      "llms.md documents the September 12, 2030 MIT change date"
    );

    for (const tool of TOOLS_REGISTRY) {
      const canonicalUrl = `https://privatools.dev${tool.slug}/`;
      assert(
        llmsContent.includes(canonicalUrl),
        "llms.md",
        `llms.md contains canonical URL for tool: "${canonicalUrl}"`
      );
    }
  }

  // 6b. robots.ts Content-Signal Verification
  console.log("\n--- 6b. Robots Content-Signal Directive ---");
  try {
    const robotsConfig = robots();
    const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules];
    const hasContentSignal = rules.some(
      (rule) =>
        rule.other &&
        rule.other["Content-Signal"] === "ai-train=yes,search=yes,ai-input=yes"
    );
    assert(
      hasContentSignal,
      "Robots",
      "robots.ts includes 'Content-Signal: ai-train=yes,search=yes,ai-input=yes'"
    );
  } catch (err) {
    assert(false, "Robots", `Failed to evaluate src/app/robots.ts: ${err}`);
  }

  // 7. Sitemap & Canonical URL Integrity
  console.log("\n--- 7. Sitemap & Canonical URLs ---");
  try {
    const sitemapEntries = sitemap();
    assert(
      Array.isArray(sitemapEntries) && sitemapEntries.length === TOOLS_REGISTRY.length + 3,
      "Sitemap",
      `Sitemap has ${TOOLS_REGISTRY.length + 3} entries (root, privacy-audit, about, and 19 tools)`
    );

    const sitemapUrls = new Set<string>();
    for (const entry of sitemapEntries) {
      assert(!sitemapUrls.has(entry.url), "Sitemap", `Sitemap URL is unique: ${entry.url}`);
      sitemapUrls.add(entry.url);
      assert(
        entry.url.startsWith("https://privatools.dev"),
        "Sitemap",
        `Sitemap URL has correct base: ${entry.url}`
      );
    }

    assert(
      sitemapUrls.has("https://privatools.dev/about/"),
      "Sitemap",
      "Sitemap contains canonical https://privatools.dev/about/"
    );
  } catch (err) {
    assert(false, "Sitemap", `Failed to generate sitemap: ${err}`);
  }

  // 7b. Organization & Creator Schema Invariants
  console.log("\n--- 7b. Organization & Creator Schema Invariants ---");
  const homepagePath = path.join(process.cwd(), "src", "app", "page.tsx");
  if (fs.existsSync(homepagePath)) {
    const homeContent = fs.readFileSync(homepagePath, "utf8");
    assert(
      homeContent.includes("Gareth Barlow"),
      "Schema",
      "Homepage Organization schema attributes Gareth Barlow as founder"
    );
    assert(
      homeContent.includes("BUY_ME_A_COFFEE_URL"),
      "Schema",
      "Homepage Organization schema includes BUY_ME_A_COFFEE_URL in sameAs"
    );
  }

  // 8. Security Headers Verification (public/_headers)
  console.log("\n--- 8. Cloudflare Production Security Headers ---");
  const headersPath = path.join(process.cwd(), "public", "_headers");
  assert(fs.existsSync(headersPath), "Headers", "public/_headers exists on disk");

  if (fs.existsSync(headersPath)) {
    const headersContent = fs.readFileSync(headersPath, "utf8");
    assert(
      headersContent.includes("Content-Security-Policy"),
      "Headers",
      "Includes Content-Security-Policy header"
    );
    assert(
      headersContent.includes("X-Content-Type-Options: nosniff"),
      "Headers",
      "Includes X-Content-Type-Options: nosniff"
    );
    assert(
      headersContent.includes("Referrer-Policy: strict-origin-when-cross-origin"),
      "Headers",
      "Includes Referrer-Policy: strict-origin-when-cross-origin"
    );
    assert(
      headersContent.includes("Permissions-Policy: camera=(self)"),
      "Headers",
      "Includes Permissions-Policy with camera=(self) for QR scanner"
    );
    assert(
      headersContent.includes("wasm-unsafe-eval") && !headersContent.includes("'unsafe-eval'"),
      "Headers",
      "Uses wasm-unsafe-eval for WebAssembly while strictly forbidding general unsafe-eval"
    );
    assert(
      headersContent.includes("frame-ancestors 'none'"),
      "Headers",
      "Includes frame-ancestors 'none' for complete clickjacking protection"
    );
    assert(
      headersContent.includes("X-Frame-Options: DENY"),
      "Headers",
      "Includes X-Frame-Options: DENY"
    );
    assert(
      headersContent.includes("/_next/static/*") && headersContent.includes("immutable"),
      "Headers",
      "Includes immutable caching for /_next/static/*"
    );
    assert(
      headersContent.includes("/sw.js") && headersContent.includes("no-cache"),
      "Headers",
      "Includes no-cache revalidation for /sw.js"
    );
    assert(
      headersContent.includes("/precache-manifest.json") && headersContent.includes("no-cache"),
      "Headers",
      "Includes no-cache revalidation for /precache-manifest.json"
    );
  }

  // 9. Workspace-wide Domain & Placeholder Scanning
  console.log("\n--- 9. Domain & Placeholder Sanity Scan ---");
  const scanDirs = ["src", "public", "scripts"];
  const badPatterns = [
    { regex: /privatools\.com/i, label: "privatools.com (use .dev instead)" },
    { regex: /YOUR_[A-Z0-9_]+/i, label: "YOUR_ placeholder" },
  ];

  function scanDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (file !== "node_modules" && file !== ".next" && file !== ".git") {
          scanDir(fullPath);
        }
      } else if (/\.(ts|tsx|js|jsx|json|txt|md|css|html)$/.test(file)) {
        // Skip test scripts themselves for the regex pattern check
        if (fullPath.endsWith("test-consistency.ts") || fullPath.endsWith("test-smoke.ts")) continue;

        const content = fs.readFileSync(fullPath, "utf8");
        for (const { regex, label } of badPatterns) {
          if (regex.test(content)) {
            assert(
              false,
              "Sanity Scan",
              `Check passed for ${path.relative(process.cwd(), fullPath)}`,
              `Found forbidden pattern "${label}" in ${path.relative(process.cwd(), fullPath)}`
            );
          }
        }
      }
    }
  }

  for (const dir of scanDirs) {
    const fullDir = path.join(process.cwd(), dir);
    if (fs.existsSync(fullDir)) {
      scanDir(fullDir);
    }
  }

  // Final Summary
  console.log("\n=======================================================");
  if (failures.length === 0) {
    console.log("🎉 ALL INTEGRITY & CONSISTENCY CHECKS PASSED (0 ERRORS)");
    console.log("=======================================================\n");
    process.exit(0);
  } else {
    console.error(`💥 FAILED: ${failures.length} check(s) failed.`);
    console.log("=======================================================\n");
    process.exit(1);
  }
}

runTests();
