import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    ...(!isDev ? { output: "export" } : {}),
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
  };
}
