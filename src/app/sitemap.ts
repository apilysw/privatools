import type { MetadataRoute } from "next";
import { TOOLS_REGISTRY } from "@/lib/registry";
import { SITE_URL, getCanonicalUrl } from "@/lib/config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: getCanonicalUrl("/privacy-audit"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: getCanonicalUrl("/about"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  for (const tool of TOOLS_REGISTRY) {
    routes.push({
      url: getCanonicalUrl(tool.slug),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return routes;
}
