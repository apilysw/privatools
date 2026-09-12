"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CommandPalette } from "./CommandPalette";

// Conditionally import PWA provider — falls back to passthrough when
// src/components/pwa/ is absent (e.g. public GitHub clone without PWA code).
let PwaProviderComponent: React.ComponentType<{ children: React.ReactNode }>;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pwa = require("@/components/pwa/PwaManager");
  PwaProviderComponent = pwa.PwaProvider;
} catch {
  function PwaProviderFallback({ children }: { children: React.ReactNode }) { return <>{children}</>; }
  PwaProviderComponent = PwaProviderFallback;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <PwaProviderComponent>
      <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-emerald-500/20 selection:text-emerald-500">
        <Navbar onOpenCommandPalette={() => setIsCommandOpen(true)} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {children}
        </main>
        <Footer />
        <CommandPalette
          isOpen={isCommandOpen}
          onClose={() => setIsCommandOpen(false)}
        />
      </div>
    </PwaProviderComponent>
  );
}

