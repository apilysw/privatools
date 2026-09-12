import fs from "fs";
import path from "path";
import crypto from "crypto";
import { TOOLS_REGISTRY } from "../src/lib/registry";

interface AssetEntry {
  url: string;
  size: number;
  hash: string;
}

function walkDir(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Creates physical route aliases in out/ so static servers and browsers can
 * access both /path.txt and /path/index.txt, as well as /path.html and /path/index.html.
 */
function createRouteAliases(dir: string) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "_next" && entry.name !== "icons") {
        const indexTxt = path.join(fullPath, "index.txt");
        const targetTxt = `${fullPath}.txt`;
        if (fs.existsSync(indexTxt) && !fs.existsSync(targetTxt)) {
          fs.copyFileSync(indexTxt, targetTxt);
        }
        const indexHtml = path.join(fullPath, "index.html");
        const targetHtml = `${fullPath}.html`;
        if (fs.existsSync(indexHtml) && !fs.existsSync(targetHtml)) {
          fs.copyFileSync(indexHtml, targetHtml);
        }
        const indexMd = path.join(fullPath, "index.md");
        const targetMd = `${fullPath}.md`;
        if (fs.existsSync(indexMd) && !fs.existsSync(targetMd)) {
          fs.copyFileSync(indexMd, targetMd);
        } else if (fs.existsSync(targetMd) && !fs.existsSync(indexMd)) {
          fs.copyFileSync(targetMd, indexMd);
        }
        createRouteAliases(fullPath);
      }
    }
  }

  // Create llms.txt fallback alias from llms.md if present
  const outLlmsMd = path.join(dir, "llms.md");
  const outLlmsTxt = path.join(dir, "llms.txt");
  if (fs.existsSync(outLlmsMd) && !fs.existsSync(outLlmsTxt)) {
    fs.copyFileSync(outLlmsMd, outLlmsTxt);
  }
}

function generateSwManifest() {
  const outDir = path.join(process.cwd(), "out");
  if (!fs.existsSync(outDir)) {
    console.error("❌ Error: out/ directory does not exist. Run 'npm run build' first.");
    process.exit(1);
  }

  // Create physical .txt and .html aliases in out/ before scanning
  createRouteAliases(outDir);

  console.log("\n📦 Scanning out/ directory to generate complete PWA precache manifest...");

  const allFiles = walkDir(outDir);
  const assetMap = new Map<string, AssetEntry>();

  // Excluded files from service worker precaching
  const excludedNames = new Set([
    "_headers",
    "robots.txt",
    "sitemap.xml",
    "sw.js",
    "precache-manifest.json",
  ]);

  for (const filePath of allFiles) {
    const relPath = path.relative(outDir, filePath).replace(/\\/g, "/");
    const filename = path.basename(filePath);

    if (excludedNames.has(filename) || filename.endsWith(".map")) {
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const size = fileBuffer.length;
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex").slice(0, 12);

    let urlPath = `/${relPath}`;

    // Map HTML files to canonical route paths
    if (relPath === "index.html") {
      urlPath = "/";
    } else if (relPath.endsWith("/index.html")) {
      urlPath = `/${relPath.slice(0, -"index.html".length)}`;
    } else if (relPath.endsWith(".html") && !relPath.startsWith("_not-found")) {
      const route = relPath.slice(0, -".html".length);
      urlPath = `/${route}/`;
    }

    // Normalize double slashes
    urlPath = urlPath.replace(/\/+/g, "/");

    assetMap.set(urlPath, {
      url: urlPath,
      size,
      hash: fileHash,
    });
  }

  // Explicitly ensure canonical tool URLs and root are present with and without trailing slash
  const requiredRoutes = [
    "/",
    "/privacy-audit/",
    "/privacy-audit",
    "/about/",
    "/about",
    ...TOOLS_REGISTRY.flatMap((t) => [`${t.slug}/`, t.slug]),
    "/404.html",
  ];

  for (const route of requiredRoutes) {
    if (!assetMap.has(route)) {
      // Find corresponding file in out
      const clean = route.replace(/^\//, "").replace(/\/$/, "");
      const candidates = [
        path.join(outDir, clean, "index.html"),
        path.join(outDir, `${clean}.html`),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          const buf = fs.readFileSync(cand);
          assetMap.set(route, {
            url: route,
            size: buf.length,
            hash: crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12),
          });
          break;
        }
      }
    }
  }

  // Explicitly ensure all RSC flight payload files (.txt) are in precache
  const requiredTxtRoutes = [
    "/index.txt",
    "/privacy-audit/index.txt",
    "/privacy-audit.txt",
    "/about/index.txt",
    "/about.txt",
    ...TOOLS_REGISTRY.flatMap((t) => [`${t.slug}/index.txt`, `${t.slug}.txt`]),
  ];

  for (const txtRoute of requiredTxtRoutes) {
    if (!assetMap.has(txtRoute)) {
      const clean = txtRoute.replace(/^\//, "");
      const fullPath = path.join(outDir, clean);
      if (fs.existsSync(fullPath)) {
        const buf = fs.readFileSync(fullPath);
        assetMap.set(txtRoute, {
          url: txtRoute,
          size: buf.length,
          hash: crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12),
        });
      }
    }
  }

  // Explicitly ensure all Markdown files (.md) are in precache
  const requiredMdRoutes = [
    "/index.md",
    "/privacy-audit/index.md",
    "/privacy-audit.md",
    "/about/index.md",
    "/about.md",
    "/llms.md",
    ...TOOLS_REGISTRY.flatMap((t) => [`${t.slug}/index.md`, `${t.slug}.md`]),
  ];

  for (const mdRoute of requiredMdRoutes) {
    if (!assetMap.has(mdRoute)) {
      const clean = mdRoute.replace(/^\//, "");
      const fullPath = path.join(outDir, clean);
      if (fs.existsSync(fullPath)) {
        const buf = fs.readFileSync(fullPath);
        assetMap.set(mdRoute, {
          url: mdRoute,
          size: buf.length,
          hash: crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12),
        });
      }
    }
  }

  // Convert to sorted array
  const assetList = Array.from(assetMap.values()).sort((a, b) => a.url.localeCompare(b.url));

  // Compute composite version hash across all assets
  const compositeHash = crypto
    .createHash("sha256")
    .update(assetList.map((a) => `${a.url}:${a.hash}`).join("|"))
    .digest("hex")
    .slice(0, 10);

  const cacheName = `privatools-cache-v${compositeHash}`;
  const totalBytes = assetList.reduce((sum, a) => sum + a.size, 0);
  const precacheUrls = assetList.map((a) => a.url);

  console.log(`  - Discovered ${assetList.length} total precache assets (${(totalBytes / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`  - Cache Version: ${cacheName}`);

  // 1. Write precache-manifest.json
  const manifestData = {
    version: cacheName,
    generatedAt: new Date().toISOString(),
    totalAssets: assetList.length,
    totalBytes,
    assets: assetList,
  };

  fs.writeFileSync(
    path.join(outDir, "precache-manifest.json"),
    JSON.stringify(manifestData, null, 2) + "\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(process.cwd(), "public", "precache-manifest.json"),
    JSON.stringify(manifestData, null, 2) + "\n",
    "utf8"
  );
  console.log(`  ✅ Generated out/precache-manifest.json and public/precache-manifest.json`);

  // 2. Generate and write sw.js with embedded precache manifest and progress reporting
  const swTemplate = `/**
 * Privatools Offline Service Worker
 * 100% Client-Side Privacy Utilities
 * Auto-generated by scripts/generate-sw-manifest.ts
 * Cache Version: ${cacheName}
 */

const CACHE_NAME = "${cacheName}";

// Comprehensive precache manifest generated at build time (${assetList.length} assets, ${(totalBytes / (1024 * 1024)).toFixed(2)} MB)
const PRECACHE_ASSETS = ${JSON.stringify(precacheUrls, null, 2)};

// Fallback offline HTML notice
const OFFLINE_FALLBACK_HTML = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Privatools — Offline</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #09090b; color: #f4f4f5; text-align: center; padding: 1.5rem; }
    .card { max-width: 480px; padding: 2rem; border-radius: 1.5rem; border: 1px solid #27272a; background: #18181b; }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: #34d399; }
    p { font-size: 0.875rem; color: #a1a1aa; line-height: 1.5; margin-bottom: 1.5rem; }
    a { display: inline-block; padding: 0.625rem 1.25rem; font-size: 0.875rem; font-weight: 600; color: #09090b; background: #10b981; border-radius: 0.75rem; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Page Not Cached Offline</h1>
    <p>This page was not found in local offline storage. Connect to the internet once to cache all 19 tools.</p>
    <a href="/">Go to Home</a>
  </div>
</body>
</html>\`;

// Helper to broadcast progress messages to all open browser windows
async function broadcast(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage(message);
  }
}

// Pre-cache all assets in concurrent batches during install
async function precacheAllAssets() {
  const cache = await caches.open(CACHE_NAME);
  let loaded = 0;
  const total = PRECACHE_ASSETS.length;

  await broadcast({ type: "PRECACHE_START", total });

  const BATCH_SIZE = 12;
  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = PRECACHE_ASSETS.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (url) => {
        try {
          const res = await fetch(url, { cache: "reload" });
          if (res && res.status === 200) {
            await cache.put(url, res.clone());
            loaded++;

            // Alias route variations into cache for instantaneous lookups
            if (url.endsWith("/index.txt")) {
              const txtAlias = url.replace(/\\/index\\.txt$/, ".txt");
              await cache.put(txtAlias, res.clone());
            } else if (url.endsWith(".txt") && !url.endsWith("/index.txt")) {
              const indexTxtAlias = url.replace(/\\.txt$/, "/index.txt");
              await cache.put(indexTxtAlias, res.clone());
            }

            if (url.endsWith("/index.md")) {
              const mdAlias = url.replace(/\\/index\\.md$/, ".md");
              await cache.put(mdAlias, res.clone());
            } else if (url.endsWith(".md") && !url.endsWith("/index.md")) {
              const indexMdAlias = url.replace(/\\.md$/, "/index.md");
              await cache.put(indexMdAlias, res.clone());
            }

            if (url.endsWith("/") && url !== "/") {
              const noSlashAlias = url.slice(0, -1);
              await cache.put(noSlashAlias, res.clone());
            } else if (!url.endsWith("/") && !url.includes(".")) {
              const slashAlias = url + "/";
              await cache.put(slashAlias, res.clone());
            }
          } else {
            console.warn("[Privatools SW] Precache non-200 for " + url + ": " + (res ? res.status : "null"));
          }
        } catch (err) {
          console.warn("[Privatools SW] Precache failed for " + url + ":", err);
        }
      })
    );

    await broadcast({
      type: "PRECACHE_PROGRESS",
      loaded,
      total,
      percent: Math.round((loaded / total) * 100),
    });
  }

  const isSuccess = loaded >= Math.floor(total * 0.95);
  if (isSuccess) {
    await broadcast({
      type: "PRECACHE_COMPLETE",
      loaded,
      total,
      version: CACHE_NAME,
    });
  } else {
    await broadcast({
      type: "PRECACHE_ERROR",
      loaded,
      total,
      error: "Failed to download " + (total - loaded) + " offline assets. Please check your network and retry.",
    });
  }

  return isSuccess;
}

// Service Worker Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    precacheAllAssets()
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error("[Privatools SW] Install error:", err);
      })
  );
});

// Service Worker Activate: clean up stale cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log("[Privatools SW] Deleting obsolete cache: " + key);
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Allow clients to trigger manual precaching or check status
self.addEventListener("message", async (event) => {
  if (event.data && event.data.type === "TRIGGER_PRECACHE") {
    precacheAllAssets();
  } else if (event.data && event.data.type === "CHECK_PRECACHE_STATUS") {
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      const total = PRECACHE_ASSETS.length;
      const loaded = keys.length;
      if (loaded >= Math.floor(total * 0.95)) {
        await broadcast({
          type: "PRECACHE_COMPLETE",
          loaded,
          total,
          version: CACHE_NAME,
        });
      } else if (loaded > 0) {
        await broadcast({
          type: "PRECACHE_PROGRESS",
          loaded,
          total,
          percent: Math.round((loaded / total) * 100),
        });
      }
    } catch {
      // ignore
    }
  }
});

// Fetch Interceptor
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1. Markdown Content Negotiation (Accept: text/markdown, Content-Type: text/markdown, ?format=md, or .md requests)
  const acceptHeader = request.headers.get("Accept") || "";
  const contentTypeHeader = request.headers.get("Content-Type") || "";
  const wantsMarkdown =
    acceptHeader.includes("text/markdown") ||
    contentTypeHeader.includes("text/markdown") ||
    url.searchParams.get("format") === "md" ||
    url.searchParams.get("format") === "markdown" ||
    url.pathname.endsWith(".md");

  if (wantsMarkdown && !url.pathname.startsWith("/_next/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        let cleanPath = url.pathname.replace(/\\/+$/, "");
        if (cleanPath === "") {
          cleanPath = "/index";
        }
        if (cleanPath.endsWith(".md")) {
          cleanPath = cleanPath.slice(0, -".md".length);
        }

        const mdCandidates = [
          cleanPath + ".md",
          url.origin + cleanPath + ".md",
          cleanPath + "/index.md",
          url.origin + cleanPath + "/index.md",
        ];

        for (const cand of mdCandidates) {
          const matched = await cache.match(cand, { ignoreSearch: true });
          if (matched) {
            const body = await matched.text();
            return new Response(body, {
              status: 200,
              headers: {
                "Content-Type": "text/markdown; charset=utf-8",
                "Vary": "Accept, Content-Type",
                "Access-Control-Allow-Origin": "*",
              },
            });
          }
        }

        if (navigator.onLine) {
          try {
            for (const cand of mdCandidates) {
              const netRes = await fetch(cand);
              if (netRes && netRes.status === 200) {
                const copy = netRes.clone();
                cache.put(cand, copy);
                const body = await netRes.text();
                return new Response(body, {
                  status: 200,
                  headers: {
                    "Content-Type": "text/markdown; charset=utf-8",
                    "Vary": "Accept, Content-Type",
                    "Access-Control-Allow-Origin": "*",
                  },
                });
              }
            }
          } catch {
            // Fall through to 404
          }
        }

        return new Response("# 404 Not Found\\n\\nThe requested Markdown content was not found.\\n", {
          status: 404,
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Vary": "Accept, Content-Type",
          },
        });
      })()
    );
    return;
  }

  // 2. Navigation requests (HTML document loads)
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        if (navigator.onLine) {
          try {
            const networkResponse = await fetch(request);
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
              return networkResponse;
            }
          } catch {
            // Network failed — proceed to offline cache lookup
          }
        }

        const cache = await caches.open(CACHE_NAME);
        const pathWithSlash = url.pathname.endsWith("/") ? url.pathname : url.pathname + "/";
        const pathWithoutSlash = url.pathname.replace(/\\/+$/, "");

        const candidates = [
          request,
          url.origin + pathWithSlash,
          url.origin + pathWithoutSlash,
          pathWithSlash,
          pathWithoutSlash,
          pathWithSlash + "index.html",
        ];

        for (const cand of candidates) {
          const matched = await cache.match(cand, { ignoreSearch: true });
          if (matched) return matched;
        }

        return new Response(OFFLINE_FALLBACK_HTML, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      })()
    );
    return;
  }

  // 3. Next.js RSC Flight Requests (Client-Side Navigation and Prefetching)
  const isRsc =
    request.headers.get("RSC") === "1" ||
    url.searchParams.has("_rsc") ||
    url.pathname.endsWith(".txt");

  if (isRsc) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cleanPathname = url.pathname;
        const pathWithSlash = cleanPathname.endsWith("/") ? cleanPathname : cleanPathname + "/";
        const pathWithoutSlash = cleanPathname.replace(/\\/+$/, "");

        const rscCandidates = [
          request,
          url.origin + cleanPathname,
          cleanPathname,
        ];

        if (cleanPathname.endsWith(".txt")) {
          const base = cleanPathname.slice(0, -".txt".length);
          const baseWithSlash = base.endsWith("/") ? base : base + "/";
          rscCandidates.push(baseWithSlash + "index.txt");
          rscCandidates.push(url.origin + baseWithSlash + "index.txt");
          rscCandidates.push(baseWithSlash + "__next._full.txt");
          rscCandidates.push(url.origin + baseWithSlash + "__next._full.txt");
        } else {
          rscCandidates.push(pathWithSlash + "index.txt");
          rscCandidates.push(url.origin + pathWithSlash + "index.txt");
          rscCandidates.push(pathWithoutSlash + ".txt");
          rscCandidates.push(url.origin + pathWithoutSlash + ".txt");
          rscCandidates.push(pathWithSlash + "__next._full.txt");
          rscCandidates.push(url.origin + pathWithSlash + "__next._full.txt");
        }

        for (const cand of rscCandidates) {
          const matched = await cache.match(cand, { ignoreSearch: true });
          if (matched) return matched;
        }

        if (navigator.onLine) {
          try {
            const networkResponse = await fetch(request);
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              cache.put(request, copy);
              return networkResponse;
            }
          } catch {
            // Fall through
          }
        }

        return new Response(null, { status: 404, statusText: "Offline RSC Miss" });
      })()
    );
    return;
  }

  // 4. Static Assets: JS chunks, CSS, Fonts, Images, SQLite WASM, Manifest
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".wasm") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".md") ||
    url.pathname.endsWith(".json");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then(async (cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        const cleanUrl = url.origin + url.pathname;
        const cleanCached = await caches.match(cleanUrl, { ignoreSearch: true });
        if (cleanCached) return cleanCached;

        if (navigator.onLine) {
          try {
            const networkResponse = await fetch(request);
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
              return networkResponse;
            }
          } catch {
            // Fall through
          }
        }

        return new Response(null, { status: 404, statusText: "Offline Asset Miss" });
      })
    );
    return;
  }

  // 5. Default Stale-While-Revalidate
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (!navigator.onLine && cached) return cached;

      const fetchPromise = fetch(request)
        .then((network) => {
          if (network && network.status === 200) {
            const copy = network.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return network;
        })
        .catch(() => cached || new Response(null, { status: 404 }));

      return cached || fetchPromise;
    })
  );
});
`;

  fs.writeFileSync(path.join(outDir, "sw.js"), swTemplate, "utf8");
  fs.writeFileSync(path.join(process.cwd(), "public", "sw.js"), swTemplate, "utf8");
  console.log(`  ✅ Generated out/sw.js and public/sw.js with embedded precache manifest.`);
}

generateSwManifest();
