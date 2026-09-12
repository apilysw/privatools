"use client";

import { useSyncExternalStore, useCallback } from "react";
import { ToolMetadata, TOOLS_REGISTRY } from "./registry";

const STORAGE_KEY = "privatools_tool_preferences";
const EVENT_NAME = "privatools:prefs-changed";

export interface ToolPreferences {
  version: 1;
  pinnedIds: string[];
  customOrder: string[];
}

const DEFAULT_PREFERENCES: ToolPreferences = {
  version: 1,
  pinnedIds: [],
  customOrder: TOOLS_REGISTRY.map((t) => t.id),
};

let cachedRaw: string | null = null;
let cachedPreferences: ToolPreferences = DEFAULT_PREFERENCES;

function getSnapshot(): ToolPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedPreferences;
    }
    cachedRaw = raw;
    if (!raw) {
      cachedPreferences = DEFAULT_PREFERENCES;
      return cachedPreferences;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      cachedPreferences = {
        version: 1,
        pinnedIds: Array.isArray(parsed.pinnedIds) ? parsed.pinnedIds : [],
        customOrder: Array.isArray(parsed.customOrder) ? parsed.customOrder : [],
      };
      return cachedPreferences;
    }
  } catch (err) {
    console.warn("Failed to read tool preferences:", err);
  }
  cachedPreferences = DEFAULT_PREFERENCES;
  return cachedPreferences;
}

function getServerSnapshot(): ToolPreferences {
  return DEFAULT_PREFERENCES;
}

function subscribe(notify: () => void) {
  window.addEventListener(EVENT_NAME, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(EVENT_NAME, notify);
    window.removeEventListener("storage", notify);
  };
}

function writeStoredPreferences(prefs: ToolPreferences) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(prefs);
    cachedRaw = raw;
    cachedPreferences = prefs;
    localStorage.setItem(STORAGE_KEY, raw);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: prefs }));
  } catch (err) {
    console.warn("Failed to write tool preferences:", err);
  }
}

/**
 * Order any list of tools according to a custom ID order array.
 * Tools matching an ID in customOrder appear in that sequence,
 * and any unlisted tools append at the end in their original sequence.
 */
export function orderToolsByCustomOrder(
  tools: ToolMetadata[],
  customOrder: string[]
): ToolMetadata[] {
  if (!customOrder || customOrder.length === 0) return tools;

  const orderMap = new Map<string, number>();
  customOrder.forEach((id, index) => {
    orderMap.set(id, index);
  });

  return [...tools].sort((a, b) => {
    const orderA = orderMap.has(a.id) ? (orderMap.get(a.id) as number) : 9999;
    const orderB = orderMap.has(b.id) ? (orderMap.get(b.id) as number) : 9999;
    if (orderA !== orderB) return orderA - orderB;
    return 0;
  });
}

export function useToolPreferences() {
  const preferences = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isLoaded = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isPinned = useCallback(
    (toolId: string) => {
      return preferences.pinnedIds.includes(toolId);
    },
    [preferences.pinnedIds]
  );

  const togglePin = useCallback((toolId: string) => {
    const current = getSnapshot();
    const isCurrentlyPinned = current.pinnedIds.includes(toolId);
    const nextPinned = isCurrentlyPinned
      ? current.pinnedIds.filter((id) => id !== toolId)
      : [...current.pinnedIds, toolId];

    const nextPrefs: ToolPreferences = {
      ...current,
      pinnedIds: nextPinned,
    };
    writeStoredPreferences(nextPrefs);
  }, []);

  const reorderTools = useCallback((newOrder: string[]) => {
    const current = getSnapshot();
    const nextPrefs: ToolPreferences = {
      ...current,
      customOrder: newOrder,
    };
    writeStoredPreferences(nextPrefs);
  }, []);

  const moveTool = useCallback((toolId: string, direction: "up" | "down") => {
    const current = getSnapshot();
    const baseOrder =
      current.customOrder.length > 0
        ? [...current.customOrder]
        : TOOLS_REGISTRY.map((t) => t.id);

    TOOLS_REGISTRY.forEach((t) => {
      if (!baseOrder.includes(t.id)) {
        baseOrder.push(t.id);
      }
    });

    const currentIndex = baseOrder.indexOf(toolId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= baseOrder.length) return;

    const updated = [...baseOrder];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);

    const nextPrefs: ToolPreferences = {
      ...current,
      customOrder: updated,
    };
    writeStoredPreferences(nextPrefs);
  }, []);

  const resetToDefault = useCallback(() => {
    const defaultOrder = TOOLS_REGISTRY.map((t) => t.id);
    const current = getSnapshot();
    const nextPrefs: ToolPreferences = {
      ...current,
      customOrder: defaultOrder,
    };
    writeStoredPreferences(nextPrefs);
  }, []);

  return {
    isLoaded,
    pinnedIds: preferences.pinnedIds,
    customOrder: preferences.customOrder,
    isPinned,
    togglePin,
    reorderTools,
    moveTool,
    resetToDefault,
  };
}
