"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CommandPalette } from "./CommandPalette";

import { PwaProvider } from "@/components/pwa/PwaManager";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    // Client-side fallback for static hosting environments when format=md is requested in browser
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const fmt = params.get("format");
      if (fmt === "md" || fmt === "markdown") {
        const cleanPath = window.location.pathname.replace(/\/+$/, "") || "/index";
        window.location.replace(`${cleanPath}.md`);
        return;
      }
    }

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
    <PwaProvider>
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
    </PwaProvider>
  );
}

