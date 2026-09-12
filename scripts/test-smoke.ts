import fs from "fs";
import path from "path";
import { TOOLS_REGISTRY } from "../src/lib/registry";

interface SmokeFailure {
  route: string;
  check: string;
  error: string;
}

const failures: SmokeFailure[] = [];
let passedCount = 0;

function assert(condition: boolean, route: string, check: string, details?: string) {
  if (!condition) {
    const err = details || "Check failed";
    failures.push({ route, check, error: err });
    console.error(`  ❌ [${route}] ${check}: ${err}`);
  } else {
    passedCount++;
    console.log(`  ✅ [${route}] ${check}`);
  }
}

function findHtmlFile(outDir: string, routePath: string): string | null {
  // Routes can be exported as /path.html or /path/index.html
  const cleanPath = routePath.replace(/^\//, "").replace(/\/$/, "");
  if (!cleanPath) {
    const direct = path.join(outDir, "index.html");
    return fs.existsSync(direct) ? direct : null;
  }

  const directHtml = path.join(outDir, `${cleanPath}.html`);
  if (fs.existsSync(directHtml)) return directHtml;

  const indexHtml = path.join(outDir, cleanPath, "index.html");
  if (fs.existsSync(indexHtml)) return indexHtml;

  return null;
}

function runSmokeTests() {
  console.log("\n💨 Running Privatools Post-Build Static Smoke Test Suite...\n");

  const outDir = path.join(process.cwd(), "out");
  assert(fs.existsSync(outDir), "Build Output", "out/ directory exists");

  if (!fs.existsSync(outDir)) {
    console.error("❌ Cannot run smoke tests: out/ directory does not exist. Run 'npm run build' first.");
    process.exit(1);
  }

  // 1. Static Assets Verification in out/
  console.log("--- 1. Static Artifacts & Security Headers ---");
  const requiredFiles = [
    "_headers",
    "sw.js",
    "precache-manifest.json",
    "manifest.json",
    "tools.json",
    "llms.txt",
    "robots.txt",
    "sitemap.xml",
    "og-image.png",
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(outDir, file);
    assert(fs.existsSync(filePath), "Artifact", `out/${file} exists`);
    if (file === "_headers" && fs.existsSync(filePath)) {
      const headersContent = fs.readFileSync(filePath, "utf8");
      assert(headersContent.includes("Content-Security-Policy"), "Headers", "out/_headers contains CSP");
      assert(headersContent.includes("Permissions-Policy"), "Headers", "out/_headers contains Permissions-Policy");
    }
  }

  // 2. Canonical Routes HTML Smoke Tests
  console.log("\n--- 2. Route Static HTML Integrity ---");
  const routesToTest: Array<{ route: string; name: string; isTool?: boolean }> = [
    { route: "/", name: "Homepage" },
    { route: "/privacy-audit", name: "Privacy Audit" },
    ...TOOLS_REGISTRY.map((t) => ({ route: t.slug, name: t.name, isTool: true })),
  ];

  const seenTitles = new Map<string, string>();
  const seenDescriptions = new Map<string, string>();

  for (const { route, name, isTool } of routesToTest) {
    const htmlFile = findHtmlFile(outDir, route);
    assert(Boolean(htmlFile), route, `Static HTML file exists for ${name}`);

    if (!htmlFile) continue;

    const html = fs.readFileSync(htmlFile, "utf8");

    // Check exactly one <h1>
    const h1Matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
    assert(
      h1Matches.length === 1,
      route,
      `Exactly one <h1> element on page (found: ${h1Matches.length})`
    );

    // Check <title>
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    assert(title.length > 5, route, `Page has non-empty <title>: "${title.slice(0, 40)}..."`);
    assert(
      !seenTitles.has(title),
      route,
      `Title is unique across all pages`,
      `Duplicate title found: "${title}" (already used on ${seenTitles.get(title)})`
    );
    seenTitles.set(title, route);

    if (isTool) {
      const hasPrivacyHook = /private|offline|no uploads/i.test(title);
      assert(
        hasPrivacyHook,
        route,
        `Tool title contains privacy/offline hook: "${title}"`
      );
    }

    // Check meta description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const desc = descMatch ? descMatch[1].trim() : "";
    assert(desc.length > 20, route, `Page has meta description`);

    if (isTool) {
      assert(
        desc.length >= 140 && desc.length <= 160,
        route,
        `Tool meta description length is ${desc.length} chars (expected 140-160)`
      );
    }

    assert(
      !seenDescriptions.has(desc),
      route,
      `Meta description is unique across all pages`,
      `Duplicate description found: "${desc.slice(0, 40)}..." (already used on ${seenDescriptions.get(desc)})`
    );
    seenDescriptions.set(desc, route);

    // Check canonical link
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
                           html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
    const canonical = canonicalMatch ? canonicalMatch[1].trim() : "";
    assert(
      canonical.startsWith("https://privatools.dev"),
      route,
      `Canonical URL points to https://privatools.dev: "${canonical}"`
    );

    // Check Open Graph tags
    assert(html.includes('property="og:title"') || html.includes("property='og:title'"), route, "Has og:title");
    assert(html.includes('property="og:description"') || html.includes("property='og:description'"), route, "Has og:description");
    assert(html.includes('property="og:image"') || html.includes("property='og:image'"), route, "Has og:image");

    // Check JSON-LD
    const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    assert(jsonLdMatches.length >= 1, route, `Contains JSON-LD schema (${jsonLdMatches.length} found)`);

    for (const block of jsonLdMatches) {
      const contentMatch = block.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      if (contentMatch) {
        try {
          const jsonLdData = JSON.parse(contentMatch[1]);
          assert(Boolean(jsonLdData), route, "JSON-LD parses as valid JSON");
        } catch (err) {
          assert(false, route, `Invalid JSON-LD syntax: ${err}`);
        }
      }
    }

    // Sanity check: zero domain drift
    assert(!html.includes("privatools.com"), route, "Contains zero privatools.com domain references");
  }

  // Final Summary
  console.log("\n=======================================================");
  if (failures.length === 0) {
    console.log(`🎉 ALL ${passedCount} STATIC SMOKE TESTS PASSED (0 FAILURES)`);
    console.log("=======================================================\n");
    process.exit(0);
  } else {
    console.error(`💥 FAILED: ${failures.length} smoke test(s) failed.`);
    for (const f of failures) {
      console.error(`   - [${f.route}] ${f.check}: ${f.error}`);
    }
    console.log("=======================================================\n");
    process.exit(1);
  }
}

runSmokeTests();
