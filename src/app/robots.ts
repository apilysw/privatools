import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      other: {
        "Content-Signal": "ai-train=yes,search=yes,ai-input=yes",
      },
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
