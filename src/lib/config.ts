/**
 * Centralized site configuration and canonical URLs for Privatools.
 * Single source of truth to avoid domain drift.
 */

export const SITE_URL = "https://privatools.dev";
export const SITE_NAME = "Privatools";
export const SITE_TAGLINE = "100% Client-Side Privacy Utilities";
export const GITHUB_REPO_URL = "https://github.com/apilysw/privatools";
export const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/privatools";
export const GUMROAD_BUY_URL = "https://privatools.gumroad.com/l/pwa";
export const GUMROAD_PRODUCT_PERMALINK = "N1BU6qyBq-repkH5XejMpQ==";

/**
 * Generates the canonical URL for a given relative path.
 * Ensures clean trailing slashes consistent with sitemap.
 */
export function getCanonicalUrl(path = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath === "/") {
    return `${SITE_URL}/`;
  }
  return `${SITE_URL}${cleanPath.endsWith("/") ? cleanPath : `${cleanPath}/`}`;
}

/**
 * Common OpenGraph & Twitter Image specification.
 */
export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/og-image.png`,
  width: 1200,
  height: 630,
  alt: "Privatools — 100% Client-Side Privacy Utilities",
  type: "image/png",
};
