"use client";

import React from "react";

/**
 * Feature-flagged ad slot for EthicalAds integration.
 *
 * - Only renders when NEXT_PUBLIC_ADS_ENABLED=true
 * - Never renders for licensed PWA users (checks PwaContext.isLicensed)
 * - Ships completely inert by default — zero ad JS loaded when disabled
 *
 * To enable:
 * 1. Set NEXT_PUBLIC_ADS_ENABLED=true in your .env
 * 2. Replace the placeholder below with your EthicalAds publisher embed code
 *
 * @see https://www.ethicalads.io/publishers/
 */

const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

// Conditionally import usePwa to check license status
let usePwa: () => { isLicensed: boolean };
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pwa = require("@/components/pwa/PwaManager");
  usePwa = pwa.usePwa;
} catch {
  usePwa = () => ({ isLicensed: false });
}

export function AdSlot({ className = "" }: { className?: string }) {
  const { isLicensed } = usePwa();

  // Never render ads for licensed PWA users or when ads are disabled
  if (!ADS_ENABLED || isLicensed) {
    return null;
  }

  return (
    <div
      className={`ad-slot ${className}`}
      data-ea-publisher="privatools"
      data-ea-type="text"
      aria-label="Advertisement"
    >
      {/* EthicalAds embed will render here when configured */}
      {/* Replace this comment with the EthicalAds script tag when accepted */}
    </div>
  );
}
