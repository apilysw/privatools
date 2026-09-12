import fs from "fs";
import path from "path";
import { TOOLS_REGISTRY } from "../src/lib/registry";
import { TOOLS_CONTENT } from "../src/lib/tool-content";
import { SITE_URL, GUMROAD_BUY_URL } from "../src/lib/config";

interface TestFailure {
  category: string;
  message: string;
}

const failures: TestFailure[] = [];

function assert(condition: boolean, category: string, message: string) {
  if (!condition) {
    failures.push({ category, message });
    console.error(`  ❌ [${category}] ${message}`);
  } else {
    console.log(`  ✅ [${category}] ${message}`);
  }
}

function runTests() {
  console.log("\n🧪 Running Privatools Consistency & Integrity Test Suite...\n");

  // 1. Config Invariants
  console.log("--- 1. Configuration Invariants ---");
  assert(
    SITE_URL === "https://privatools.dev",
    "Config",
    `SITE_URL must be https://privatools.dev (actual: ${SITE_URL})`
  );
  assert(
    GUMROAD_BUY_URL === "https://privatools.gumroad.com/l/pwa",
    "Config",
    `GUMROAD_BUY_URL must be https://privatools.gumroad.com/l/pwa (actual: ${GUMROAD_BUY_URL})`
  );

  // 2. Tool Registry Invariants
  console.log("\n--- 2. Tool Registry Catalog ---");
  assert(
    TOOLS_REGISTRY.length >= 19,
    "Registry",
    `TOOLS_REGISTRY must have at least 19 tools (found: ${TOOLS_REGISTRY.length})`
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
      `Tool "${tool.id}" slug must match "/tools/${tool.id}" (actual: "${tool.slug}")`
    );

    assert(
      tool.supportedFormats.length > 0,
      "Registry",
      `Tool "${tool.id}" must specify supportedFormats`
    );

    assert(
      tool.keywords.length >= 3,
      "Registry",
      `Tool "${tool.id}" must specify at least 3 keywords`
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
      `Missing page.tsx for tool "${tool.id}" at src/app/tools/${tool.id}/page.tsx`
    );

    assert(
      fs.existsSync(layoutPath),
      "Routes",
      `Missing layout.tsx for tool "${tool.id}" at src/app/tools/${tool.id}/layout.tsx`
    );

    if (fs.existsSync(pagePath)) {
      const pageContent = fs.readFileSync(pagePath, "utf8");
      assert(
        pageContent.includes(`toolId="${tool.id}"`),
        "Routes",
        `Tool page ${tool.id}/page.tsx must pass toolId="${tool.id}" to ToolHeader`
      );
    }
  }

  // 4. Rich Landing Content & SEO Catalog
  console.log("\n--- 4. Rich Landing Content (SEO) ---");
  for (const tool of TOOLS_REGISTRY) {
    const content = TOOLS_CONTENT[tool.id];
    assert(
      Boolean(content),
      "SEO Content",
      `TOOLS_CONTENT must have an entry for tool "${tool.id}"`
    );

    if (content) {
      assert(
        content.headline.length > 10,
        "SEO Content",
        `Tool "${tool.id}" headline must be descriptive`
      );
      assert(
        content.techStack.length >= 2,
        "SEO Content",
        `Tool "${tool.id}" must list at least 2 technologies in techStack`
      );
      assert(
        content.useCases.length >= 2,
        "SEO Content",
        `Tool "${tool.id}" must list at least 2 useCases`
      );
      assert(
        content.faqs.length >= 2,
        "SEO Content",
        `Tool "${tool.id}" must list at least 2 FAQs`
      );
    }
  }

  // 5. public/tools.json Verification
  console.log("\n--- 5. Public tools.json Catalog ---");
  const toolsJsonPath = path.join(process.cwd(), "public", "tools.json");
  assert(fs.existsSync(toolsJsonPath), "tools.json", "public/tools.json must exist on disk");

  if (fs.existsSync(toolsJsonPath)) {
    try {
      const raw = fs.readFileSync(toolsJsonPath, "utf8");
      const data = JSON.parse(raw);

      assert(
        data.canonicalBase === "https://privatools.dev",
        "tools.json",
        `canonicalBase must be https://privatools.dev (actual: ${data.canonicalBase})`
      );

      assert(
        data.toolCount === TOOLS_REGISTRY.length,
        "tools.json",
        `toolCount (${data.toolCount}) must match TOOLS_REGISTRY.length (${TOOLS_REGISTRY.length})`
      );

      assert(
        Array.isArray(data.tools) && data.tools.length === TOOLS_REGISTRY.length,
        "tools.json",
        "data.tools array length must match TOOLS_REGISTRY"
      );

      const jsonToolIds = new Set((data.tools || []).map((t: { id: string }) => t.id));
      for (const tool of TOOLS_REGISTRY) {
        assert(
          jsonToolIds.has(tool.id),
          "tools.json",
          `Tool "${tool.id}" is present in tools.json`
        );
      }
    } catch (err) {
      assert(false, "tools.json", `Failed to parse public/tools.json: ${err}`);
    }
  }

  // 6. public/llms.txt Verification
  console.log("\n--- 6. Public llms.txt Discovery Document ---");
  const llmsPath = path.join(process.cwd(), "public", "llms.txt");
  assert(fs.existsSync(llmsPath), "llms.txt", "public/llms.txt must exist on disk");

  if (fs.existsSync(llmsPath)) {
    const llmsContent = fs.readFileSync(llmsPath, "utf8");
    assert(
      llmsContent.includes("https://privatools.dev"),
      "llms.txt",
      "llms.txt must contain canonical domain https://privatools.dev"
    );

    for (const tool of TOOLS_REGISTRY) {
      const canonicalUrl = `https://privatools.dev${tool.slug}/`;
      assert(
        llmsContent.includes(canonicalUrl),
        "llms.txt",
        `llms.txt must contain canonical URL for tool: "${canonicalUrl}"`
      );
    }
  }

  // 7. Workspace-wide Domain & Placeholder Scanning
  console.log("\n--- 7. Domain & Placeholder Sanity Scan ---");
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
        // Skip this test script itself for the regex pattern check
        if (fullPath.endsWith("test-consistency.ts")) continue;

        const content = fs.readFileSync(fullPath, "utf8");
        for (const { regex, label } of badPatterns) {
          if (regex.test(content)) {
            assert(
              false,
              "Sanity Scan",
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
