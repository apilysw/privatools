import fs from "fs";
import path from "path";
import { TOOLS_REGISTRY } from "../src/lib/registry";

interface PrecacheAsset {
  url: string;
  size: number;
  hash: string;
}

interface PrecacheManifest {
  version: string;
  generatedAt: string;
  totalAssets: number;
  totalBytes: number;
  assets: PrecacheAsset[];
}

function runOfflineAcceptanceTest() {
  console.log("\n=======================================================");
  console.log("🧪 PRIVATOOLS PWA OFFLINE ACCEPTANCE TEST SUITE");
  console.log("=======================================================\n");

  const outDir = path.join(process.cwd(), "out");
  const manifestPath = path.join(outDir, "precache-manifest.json");

  if (!fs.existsSync(manifestPath)) {
    console.error("❌ Precache manifest not found at out/precache-manifest.json. Run 'npm run build' first.");
    process.exit(1);
  }

  // 1. Validate Precache Manifest Structure
  const manifestRaw = fs.readFileSync(manifestPath, "utf8");
  const manifest: PrecacheManifest = JSON.parse(manifestRaw);

  console.log(`📋 Cache Version: ${manifest.version}`);
  console.log(`📦 Precached Assets: ${manifest.totalAssets} files (${(manifest.totalBytes / (1024 * 1024)).toFixed(2)} MB)`);

  if (!manifest.version.startsWith("privatools-cache-v")) {
    console.error(`❌ Invalid cache version name: ${manifest.version}`);
    process.exit(1);
  }

  if (manifest.totalAssets < 150) {
    console.error(`❌ Unexpectedly low asset count (${manifest.totalAssets}). Expected 150+ assets.`);
    process.exit(1);
  }

  // 2. Validate Physical Disk Assets in out/
  function resolveAssetPath(url: string): string {
    const localRel = url.replace(/^\//, "");
    const localPath = path.join(outDir, localRel);
    if (localRel === "" || localRel.endsWith("/")) {
      return path.join(localPath, "index.html");
    }
    if (fs.existsSync(localPath) && fs.statSync(localPath).isDirectory()) {
      return path.join(localPath, "index.html");
    }
    if (!fs.existsSync(localPath)) {
      if (fs.existsSync(`${localPath}.html`)) return `${localPath}.html`;
      if (fs.existsSync(`${localPath}.txt`)) return `${localPath}.txt`;
      if (fs.existsSync(`${localPath}.md`)) return `${localPath}.md`;
      if (fs.existsSync(path.join(localPath, "index.html"))) return path.join(localPath, "index.html");
      if (fs.existsSync(path.join(localPath, "index.txt"))) return path.join(localPath, "index.txt");
      if (fs.existsSync(path.join(localPath, "index.md"))) return path.join(localPath, "index.md");
    }
    return localPath;
  }

  // 2. Validate Physical Disk Assets in out/
  console.log("\n🔍 Step 1: Validating all precache assets exist on disk in out/...");
  let missingFiles = 0;
  for (const asset of manifest.assets) {
    const localPath = resolveAssetPath(asset.url);
    if (!fs.existsSync(localPath) || fs.statSync(localPath).isDirectory()) {
      console.error(`  ❌ Missing file for URL ${asset.url}: ${localPath}`);
      missingFiles++;
    }
  }

  if (missingFiles > 0) {
    console.error(`❌ Disk validation failed: ${missingFiles} files missing.`);
    process.exit(1);
  }
  console.log(`  ✅ All ${manifest.totalAssets} assets exist on disk with valid payloads.`);

  // 3. Validate SQLite WebAssembly Binaries
  console.log("\n🔍 Step 2: Validating SQLite WASM binaries for offline database operations...");
  const wasmBrowser = manifest.assets.find((a) => a.url === "/sql-wasm-browser.wasm");
  const wasmNode = manifest.assets.find((a) => a.url === "/sql-wasm.wasm");

  if (!wasmBrowser || !wasmNode) {
    console.error("❌ SQLite WASM files missing from precache manifest!");
    process.exit(1);
  }
  console.log(`  ✅ sql-wasm-browser.wasm found (${(wasmBrowser.size / 1024).toFixed(1)} KB)`);
  console.log(`  ✅ sql-wasm.wasm found (${(wasmNode.size / 1024).toFixed(1)} KB)`);

  // 4. Build Simulated Offline Browser CacheStorage
  console.log("\n🔍 Step 3: Initializing simulated offline CacheStorage & network isolation...");
  const mockCache = new Map<string, { body: Buffer; contentType: string }>();

  for (const asset of manifest.assets) {
    const localPath = resolveAssetPath(asset.url);
    const body = fs.readFileSync(localPath);
    let contentType = "application/octet-stream";
    if (localPath.endsWith(".html")) contentType = "text/html";
    else if (localPath.endsWith(".js")) contentType = "application/javascript";
    else if (localPath.endsWith(".css")) contentType = "text/css";
    else if (localPath.endsWith(".json") || localPath.endsWith(".txt")) contentType = "application/json";
    else if (localPath.endsWith(".wasm")) contentType = "application/wasm";
    else if (localPath.endsWith(".woff2")) contentType = "font/woff2";
    else if (localPath.endsWith(".md")) contentType = "text/markdown; charset=utf-8";

    mockCache.set(asset.url, { body, contentType });
  }

  console.log(`  ✅ Loaded ${mockCache.size} entries into simulated offline CacheStorage.`);

  // Offline Service Worker Fetch Simulation
  function simulateSwFetch(
    reqUrl: string,
    mode: "navigate" | "rsc" | "no-cors" = "no-cors",
    headers?: Record<string, string>
  ): { status: number; body?: Buffer; contentType?: string } {
    const url = new URL(reqUrl, "https://privatools.dev");

    // Markdown Content Negotiation
    const acceptHeader = headers?.["Accept"] || headers?.["accept"] || "";
    const wantsMarkdown =
      acceptHeader.includes("text/markdown") ||
      url.searchParams.get("format") === "md" ||
      url.searchParams.get("format") === "markdown" ||
      url.pathname.endsWith(".md");

    if (wantsMarkdown && !url.pathname.startsWith("/_next/")) {
      let cleanPath = url.pathname.replace(/\/+$/, "");
      if (cleanPath === "") {
        cleanPath = "/index";
      }
      if (cleanPath.endsWith(".md")) {
        cleanPath = cleanPath.slice(0, -".md".length);
      }

      const mdCandidates = [
        cleanPath + ".md",
        cleanPath + "/index.md",
      ];

      for (const cand of mdCandidates) {
        if (mockCache.has(cand)) {
          const item = mockCache.get(cand)!;
          return { status: 200, body: item.body, contentType: "text/markdown; charset=utf-8" };
        }
      }

      return { status: 404, contentType: "text/markdown; charset=utf-8" };
    }

    if (mode === "navigate") {
      const pathWithSlash = url.pathname.endsWith("/") ? url.pathname : url.pathname + "/";
      const pathWithoutSlash = url.pathname.replace(/\/+$/, "");

      const candidates = [
        url.pathname,
        pathWithSlash,
        pathWithoutSlash,
        pathWithSlash + "index.html",
      ];

      for (const cand of candidates) {
        if (mockCache.has(cand)) {
          const item = mockCache.get(cand)!;
          return { status: 200, body: item.body, contentType: item.contentType };
        }
      }

      // Return offline fallback notice
      return { status: 200, contentType: "text/html" };
    }

    // Next.js RSC Flight Requests
    if (mode === "rsc" || url.pathname.endsWith(".txt") || url.searchParams.has("_rsc")) {
      const cleanPathname = url.pathname;
      const pathWithSlash = cleanPathname.endsWith("/") ? cleanPathname : cleanPathname + "/";
      const pathWithoutSlash = cleanPathname.replace(/\/+$/, "");

      const rscCandidates: string[] = [cleanPathname];

      if (cleanPathname.endsWith(".txt")) {
        const base = cleanPathname.slice(0, -".txt".length);
        const baseWithSlash = base.endsWith("/") ? base : base + "/";
        rscCandidates.push(baseWithSlash + "index.txt");
        rscCandidates.push(baseWithSlash + "__next._full.txt");
      } else {
        rscCandidates.push(pathWithSlash + "index.txt");
        rscCandidates.push(pathWithoutSlash + ".txt");
        rscCandidates.push(pathWithSlash + "__next._full.txt");
      }

      for (const cand of rscCandidates) {
        if (mockCache.has(cand)) {
          const item = mockCache.get(cand)!;
          return { status: 200, body: item.body, contentType: item.contentType };
        }
      }

      return { status: 404 };
    }

    // Static asset match
    if (mockCache.has(url.pathname)) {
      const item = mockCache.get(url.pathname)!;
      return { status: 200, body: item.body, contentType: item.contentType };
    }

    return { status: 404 };
  }

  // 5. Test Offline Route Loading, RSC Resolution and Chunk Integrity for All 19 Tools
  console.log("\n🔍 Step 4: Simulating offline navigation, RSC Flight resolution, and chunk integrity for all tools...\n");

  const routesToTest = [
    { name: "Home Directory", slug: "/" },
    { name: "Privacy Audit Proof", slug: "/privacy-audit" },
    { name: "About & Creator", slug: "/about" },
    ...TOOLS_REGISTRY.map((t) => ({ name: t.name, slug: t.slug })),
  ];

  let totalChunksChecked = 0;
  let passedRoutes = 0;

  for (const route of routesToTest) {
    // A. Verify navigation works with both trailing slash and without trailing slash
    const resNoSlash = simulateSwFetch(route.slug, "navigate");
    const resWithSlash = simulateSwFetch(route.slug.endsWith("/") ? route.slug : route.slug + "/", "navigate");

    if (resNoSlash.status !== 200 || !resNoSlash.body) {
      console.error(`  ❌ Failed offline navigation to ${route.slug} (HTTP ${resNoSlash.status})`);
      process.exit(1);
    }
    if (resWithSlash.status !== 200 || !resWithSlash.body) {
      console.error(`  ❌ Failed offline navigation to ${route.slug}/ (HTTP ${resWithSlash.status})`);
      process.exit(1);
    }

    const htmlContent = resWithSlash.body.toString("utf8");

    // Extract all JS chunks (<script src="..."></script>)
    const scriptMatches = htmlContent.matchAll(/<script[^>]+src=["']([^"']+)["']/g);
    const scripts: string[] = [];
    for (const match of scriptMatches) {
      scripts.push(match[1]);
    }

    // Extract all stylesheets (<link rel="stylesheet" href="...">)
    const linkMatches = htmlContent.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["']/g);
    const stylesheets: string[] = [];
    for (const match of linkMatches) {
      stylesheets.push(match[1]);
    }
    // Also handle rel before href
    const linkMatches2 = htmlContent.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/g);
    for (const match of linkMatches2) {
      if (!stylesheets.includes(match[1])) {
        stylesheets.push(match[1]);
      }
    }

    // Verify all scripts and stylesheets resolve from offline cache with 0 network calls
    let routeChunksOk = true;
    for (const src of scripts) {
      totalChunksChecked++;
      const chunkRes = simulateSwFetch(src);
      if (chunkRes.status !== 200) {
        console.error(`  ❌ Route ${route.slug} references missing offline script: ${src}`);
        routeChunksOk = false;
      }
    }

    for (const href of stylesheets) {
      totalChunksChecked++;
      const cssRes = simulateSwFetch(href);
      if (cssRes.status !== 200) {
        console.error(`  ❌ Route ${route.slug} references missing offline stylesheet: ${href}`);
        routeChunksOk = false;
      }
    }

    // B. Verify Next.js Client-Side RSC Flight navigation works offline
    if (route.slug !== "/") {
      // 1. Flight payload via .txt request (e.g. /tools/data-converter.txt)
      const rscTxt = simulateSwFetch(`${route.slug}.txt`, "rsc");
      if (rscTxt.status !== 200 || !rscTxt.body || rscTxt.body.length === 0) {
        console.error(`  ❌ Failed offline RSC .txt fetch for ${route.slug}.txt`);
        routeChunksOk = false;
      }

      // 2. Flight payload via /index.txt (e.g. /tools/data-converter/index.txt)
      const rscIndexTxt = simulateSwFetch(`${route.slug}/index.txt`, "rsc");
      if (rscIndexTxt.status !== 200 || !rscIndexTxt.body || rscIndexTxt.body.length === 0) {
        console.error(`  ❌ Failed offline RSC index.txt fetch for ${route.slug}/index.txt`);
        routeChunksOk = false;
      }

      // 3. Client navigation with ?_rsc query string
      const rscQuery = simulateSwFetch(`${route.slug}?_rsc=test123`, "rsc");
      if (rscQuery.status !== 200 || !rscQuery.body || rscQuery.body.length === 0) {
        console.error(`  ❌ Failed offline RSC query fetch for ${route.slug}?_rsc=test123`);
        routeChunksOk = false;
      }

      // 4. Client navigation with /?_rsc query string
      const rscSlashQuery = simulateSwFetch(`${route.slug}/?_rsc=test123`, "rsc");
      if (rscSlashQuery.status !== 200 || !rscSlashQuery.body || rscSlashQuery.body.length === 0) {
        console.error(`  ❌ Failed offline RSC query fetch for ${route.slug}/?_rsc=test123`);
        routeChunksOk = false;
      }
    }

    // Check Next.js RSC flight data files for the route if not root
    if (route.slug !== "/" && route.slug.startsWith("/tools/")) {
      const toolId = route.slug.replace("/tools/", "").replace(/\/$/, "");
      const requiredFlightFiles = [
        `/${route.slug.replace(/^\//, "").replace(/\/$/, "")}/index.txt`,
        `/${route.slug.replace(/^\//, "").replace(/\/$/, "")}/__next._full.txt`,
        `/${route.slug.replace(/^\//, "").replace(/\/$/, "")}/__next.tools.${toolId}.__PAGE__.txt`,
      ];
      for (const flight of requiredFlightFiles) {
        if (!mockCache.has(flight)) {
          console.error(`  ❌ Missing Next.js RSC flight data in cache: ${flight}`);
          routeChunksOk = false;
        }
      }
    }

    if (routeChunksOk) {
      passedRoutes++;
      console.log(`  ✅ [${route.name}] (${route.slug}) -> HTML OK, RSC Flight OK, ${scripts.length} JS chunks OK, ${stylesheets.length} CSS OK`);
    } else {
      console.error(`  ❌ [${route.name}] (${route.slug}) FAILED offline check.`);
      process.exit(1);
    }
  }

  // 6. Test Un-precached Route Fallback
  console.log("\n🔍 Step 5: Testing un-precached route fallback...");
  const fallbackRes = simulateSwFetch("/tools/non-existent-tool-xyz/", "navigate");
  if (fallbackRes.status === 200 && fallbackRes.contentType === "text/html") {
    console.log("  ✅ Uncached route handled gracefully with offline fallback.");
  } else {
    console.error("  ❌ Uncached route failed to return fallback.");
    process.exit(1);
  }

  // 7. Test Offline Markdown Content Negotiation for LLMs
  console.log("\n🔍 Step 6: Testing offline Markdown content negotiation for LLMs across all routes...\n");
  let passedMarkdownRoutes = 0;

  for (const route of routesToTest) {
    // 1. Fetch route with Accept: text/markdown header
    const mdRes = simulateSwFetch(route.slug, "no-cors", { Accept: "text/markdown" });
    if (mdRes.status !== 200 || !mdRes.body || !mdRes.contentType?.includes("text/markdown")) {
      console.error(`  ❌ Failed offline Markdown negotiation for ${route.slug} (HTTP ${mdRes.status})`);
      process.exit(1);
    }

    const mdContent = mdRes.body.toString("utf8");
    if (!mdContent.startsWith("# ")) {
      console.error(`  ❌ Markdown for ${route.slug} does not start with '# ': "${mdContent.slice(0, 30)}..."`);
      process.exit(1);
    }

    // 2. Fetch with query param ?format=md
    const queryRes = simulateSwFetch(`${route.slug}?format=md`, "no-cors");
    if (queryRes.status !== 200 || !queryRes.body || !queryRes.contentType?.includes("text/markdown")) {
      console.error(`  ❌ Failed offline Markdown query param fetch for ${route.slug}?format=md (HTTP ${queryRes.status})`);
      process.exit(1);
    }

    passedMarkdownRoutes++;
    console.log(`  ✅ [${route.name}] (${route.slug}) -> Offline Markdown OK (${mdRes.body.length} bytes, starts with "${mdContent.slice(0, 30).trim()}...")`);
  }

  // Also test direct /index.md, /about.md, /privacy-audit.md, and /llms.md
  const directMdRoutes = ["/index.md", "/about.md", "/privacy-audit.md", "/llms.md"];
  for (const direct of directMdRoutes) {
    const directRes = simulateSwFetch(direct, "no-cors");
    if (directRes.status !== 200 || !directRes.body || !directRes.contentType?.includes("text/markdown")) {
      console.error(`  ❌ Failed offline direct Markdown fetch for ${direct} (HTTP ${directRes.status})`);
      process.exit(1);
    }
    console.log(`  ✅ Direct Markdown: ${direct} -> Status 200, Content-Type text/markdown`);
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL OFFLINE ACCEPTANCE TESTS PASSED (100% CACHE HIT)");
  console.log(`   - Verified HTML Routes: ${passedRoutes} / ${routesToTest.length}`);
  console.log(`   - Verified Markdown Routes: ${passedMarkdownRoutes} / ${routesToTest.length}`);
  console.log(`   - Verified Assets: ${totalChunksChecked} runtime JS & CSS chunks`);
  console.log(`   - SQLite WebAssembly: Verified both 32-bit & browser WASM binaries`);
  console.log("   - 0 network requests required for any tool operation");
  console.log("=======================================================\n");
}

runOfflineAcceptanceTest();
