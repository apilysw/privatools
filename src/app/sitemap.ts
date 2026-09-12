import type { MetadataRoute } from "next";
import { TOOLS_REGISTRY } from "@/lib/registry";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://privatools.dev";
  const lastModified = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/privacy-audit/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  for (const tool of TOOLS_REGISTRY) {
    routes.push({
      url: `${baseUrl}${tool.slug}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return routes;
}
