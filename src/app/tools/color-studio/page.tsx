"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Palette,
  Pipette,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  CheckCircle2,
  XCircle,
  Eye,
  Sun,
  Moon,
  Sparkles,
  Layers,
  Code2,
  FileCode,
  ArrowRightLeft,
  Info,
  ShieldCheck,
  Wand2,
  Maximize2,
  RefreshCw,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import {
  RgbColor,
  HslColor,
  OklchColor,
  parseColor,
  getColorFormats,
  calculateContrast,
  autoFixContrast,
  getAllColorBlindnessSimulations,
  generateHarmonies,
  generateShadeScale,
  exportToCssVariables,
  exportToTailwindV4,
  exportToTailwindV3,
  exportToJsonTokens,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToOklch,
  oklchToRgb,
  HarmonyType,
} from "@/lib/converters/color";

type StudioTab = "convert" | "contrast" | "blindness" | "harmonies" | "shades" | "preview";

interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  description: string;
}

const PRESETS: ColorPreset[] = [
  {
    id: "emerald-tech",
    name: "Emerald Tech",
    hex: "#10B981",
    description: "Vibrant, privacy-focused modern emerald accent.",
  },
  {
    id: "electric-indigo",
    name: "Electric Indigo",
    hex: "#6366F1",
    description: "Modern SaaS primary indigo with high digital presence.",
  },
  {
    id: "sunset-coral",
    name: "Sunset Coral",
    hex: "#F43F5E",
    description: "Warm, energetic coral rose for high-contrast highlights.",
  },
  {
    id: "cyberpunk-amber",
    name: "Cyber Amber",
    hex: "#F59E0B",
    description: "Luminous amber yellow for alerts and punchy brand accents.",
  },
  {
    id: "sky-modern",
    name: "Sky Modern",
    hex: "#0284C7",
    description: "Clean enterprise blue with clear daylight visibility.",
  },
  {
    id: "deep-slate",
    name: "Deep Slate",
    hex: "#475569",
    description: "Neutral corporate slate for accessible UI scaffolding.",
  },
];

export default function ColorStudioPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>("convert");
  const [activePreset, setActivePreset] = useState<string | null>("emerald-tech");

  // Core Base Color State
  const [hexInput, setHexInput] = useState<string>("#10B981");
  const [currentRgb, setCurrentRgb] = useState<RgbColor>({ r: 16, g: 185, b: 129, a: 1 });
  const [alphaPercent, setAlphaPercent] = useState<number>(100);

  // Contrast Tab State
  const [contrastFgHex, setContrastFgHex] = useState<string>("#FFFFFF");
  const [contrastBgHex, setContrastBgHex] = useState<string>("#10B981");

  // Harmonies Tab State
  const [harmonySpace, setHarmonySpace] = useState<"oklch" | "hsl">("oklch");
  const [selectedHarmonyType, setSelectedHarmonyType] = useState<HarmonyType>("complementary");

  // Shades Tab State
  const [shadeBrandName, setShadeBrandName] = useState<string>("brand");
  const [shadeExportFormat, setShadeExportFormat] = useState<"tailwind4" | "tailwind3" | "css" | "json">("tailwind4");

  // UI Preview Tab State
  const [previewDarkTheme, setPreviewDarkTheme] = useState<boolean>(false);

  // Copy Feedback State
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const copyToClipboard = useCallback((text: string, formatKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatKey);
    setTimeout(() => setCopiedFormat(null), 1800);
  }, []);

  // Update from string input or color picker
  const handleSetHex = useCallback((newHex: string, presetId?: string) => {
    setActivePreset(presetId || null);
    setHexInput(newHex);
    const parsed = parseColor(newHex);
    if (parsed) {
      setCurrentRgb({ ...parsed, a: alphaPercent / 100 });
      setContrastBgHex(newHex);
    }
  }, [alphaPercent]);

  // Update from RGB sliders
  const handleUpdateRgb = (channel: "r" | "g" | "b", val: number) => {
    setActivePreset(null);
    const newRgb = { ...currentRgb, [channel]: val, a: alphaPercent / 100 };
    setCurrentRgb(newRgb);
    setHexInput(rgbToHex(newRgb, false));
    setContrastBgHex(rgbToHex(newRgb, false));
  };

  // Update Alpha
  const handleUpdateAlpha = (val: number) => {
    setAlphaPercent(val);
    const newRgb = { ...currentRgb, a: val / 100 };
    setCurrentRgb(newRgb);
  };

  // EyeDropper API (Chromium)
  const isEyeDropperSupported = typeof window !== "undefined" && "EyeDropper" in window;
  const handlePickEyeDropper = async () => {
    if (!isEyeDropperSupported) return;
    try {
      // @ts-expect-error EyeDropper is a modern Web API
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result && result.sRGBHex) {
        handleSetHex(result.sRGBHex);
      }
    } catch {
      // User cancelled picker
    }
  };

  // Reset to default
  const handleReset = () => {
    handleSetHex("#10B981", "emerald-tech");
    setContrastFgHex("#FFFFFF");
    setContrastBgHex("#10B981");
    setAlphaPercent(100);
  };

  // Derived Color Formats
  const formats = useMemo(() => getColorFormats(currentRgb), [currentRgb]);

  // Contrast Calculation
  const contrastFgRgb = useMemo(() => parseColor(contrastFgHex) || { r: 255, g: 255, b: 255, a: 1 }, [contrastFgHex]);
  const contrastBgRgb = useMemo(() => parseColor(contrastBgHex) || { r: 16, g: 185, b: 129, a: 1 }, [contrastBgHex]);
  const contrast = useMemo(() => calculateContrast(contrastFgRgb, contrastBgRgb), [contrastFgRgb, contrastBgRgb]);

  // Color Blindness Simulations
  const simulations = useMemo(() => getAllColorBlindnessSimulations(currentRgb), [currentRgb]);

  // Harmonies
  const harmonies = useMemo(() => generateHarmonies(currentRgb, harmonySpace === "oklch"), [currentRgb, harmonySpace]);
  const activeHarmony = useMemo(
    () => harmonies.find((h) => h.type === selectedHarmonyType) || harmonies[0],
    [harmonies, selectedHarmonyType]
  );

  // Shade Scale
  const shadeScale = useMemo(() => generateShadeScale(currentRgb), [currentRgb]);

  // Shade Code Export
  const shadeExportCode = useMemo(() => {
    switch (shadeExportFormat) {
      case "tailwind4":
        return exportToTailwindV4(shadeBrandName, shadeScale);
      case "tailwind3":
        return exportToTailwindV3(shadeBrandName, shadeScale);
      case "css":
        return exportToCssVariables(shadeBrandName, shadeScale);
      case "json":
        return exportToJsonTokens(shadeBrandName, shadeScale);
    }
  }, [shadeBrandName, shadeScale, shadeExportFormat]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <ToolHeader
          title="CSS & Modern Color Palette Studio"
          description="Zero-egress client-side color studio. Bi-directional HEX, RGB, HSL, OKLCH, and HWB conversions, WCAG 2.1 & APCA contrast checker with intelligent auto-fixer, 8-profile color blindness simulator, interactive color wheel harmonies, and Tailwind 11-step design token generator."
          badge="Zero Egress"
        />
      </div>

      {/* Top Presets Bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mr-1 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-zinc-400" />
            Sample Palettes:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSetHex(p.hex, p.id)}
              title={p.description}
              className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                activePreset === p.id
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20 shadow-xs"
                style={{ backgroundColor: p.hex }}
              />
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleReset}
          className="shrink-0 whitespace-nowrap self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Default</span>
        </button>
      </div>

      {/* Active Color Master Card */}
      <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Color Swatch / Native Picker */}
            <div className="relative group w-14 h-14 rounded-2xl overflow-hidden shadow-inner border border-zinc-200 dark:border-zinc-700 shrink-0">
              <div
                className="w-full h-full transition-colors"
                style={{ backgroundColor: formats.rgbaStr }}
              />
              <input
                type="color"
                value={formats.hex}
                onChange={(e) => handleSetHex(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Click to open system color picker"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {formats.hex}
                </h2>
                <button
                  onClick={() => copyToClipboard(formats.hex, "master-hex")}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  title="Copy HEX"
                >
                  {copiedFormat === "master-hex" ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                {isEyeDropperSupported && (
                  <button
                    onClick={handlePickEyeDropper}
                    className="p-1 rounded-md text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                    title="Sample pixel from screen (EyeDropper API)"
                  >
                    <Pipette className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 mt-0.5">
                <span>Luminance: {formats.luminance}</span>
                <span>•</span>
                <span>{formats.temperature} Palette</span>
                <span>•</span>
                <span className="font-mono">{formats.oklchStr}</span>
              </div>
            </div>
          </div>

          {/* Quick Sliders */}
          <div className="w-full sm:w-72 space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>Alpha Transparency:</span>
                <span className="font-mono">{alphaPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={alphaPercent}
                onChange={(e) => handleUpdateAlpha(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleSetHex(e.target.value)}
                placeholder="#10B981 or rgb(16, 185, 129)"
                className="flex-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto print:hidden">
        <button
          onClick={() => setActiveTab("convert")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "convert"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Format Conversions</span>
        </button>

        <button
          onClick={() => setActiveTab("contrast")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "contrast"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>WCAG & APCA Contrast</span>
        </button>

        <button
          onClick={() => setActiveTab("blindness")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "blindness"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Color Blindness (CVD)</span>
        </button>

        <button
          onClick={() => setActiveTab("harmonies")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "harmonies"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Color Harmonies & Wheel</span>
        </button>

        <button
          onClick={() => setActiveTab("shades")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "shades"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tailwind 11-Shade Tokens</span>
        </button>

        <button
          onClick={() => setActiveTab("preview")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "preview"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>UI Component Preview</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: FORMAT CONVERSIONS & INSPECTOR */}
      {/* ==================================================================== */}
      {activeTab === "convert" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sliders Column */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-5">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              Channel Sliders
            </h3>

            {/* Red Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-red-500 font-semibold">Red (R):</span>
                <span>{currentRgb.r}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={currentRgb.r}
                onChange={(e) => handleUpdateRgb("r", parseInt(e.target.value, 10))}
                className="w-full accent-red-500 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Green Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-500 font-semibold">Green (G):</span>
                <span>{currentRgb.g}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={currentRgb.g}
                onChange={(e) => handleUpdateRgb("g", parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Blue Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-blue-500 font-semibold">Blue (B):</span>
                <span>{currentRgb.b}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={currentRgb.b}
                onChange={(e) => handleUpdateRgb("b", parseInt(e.target.value, 10))}
                className="w-full accent-blue-500 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* HSL Quick Sliders */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                HSL Controls
              </h4>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-zinc-500">
                  <span>Hue:</span>
                  <span>{formats.hsl.h}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={formats.hsl.h}
                  onChange={(e) => {
                    const h = parseInt(e.target.value, 10);
                    const newRgb = hslToRgb({ ...formats.hsl, h });
                    setCurrentRgb({ ...newRgb, a: alphaPercent / 100 });
                    setHexInput(rgbToHex(newRgb, false));
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background:
                      "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                  }}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-zinc-500">
                  <span>Saturation:</span>
                  <span>{formats.hsl.s}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formats.hsl.s}
                  onChange={(e) => {
                    const s = parseInt(e.target.value, 10);
                    const newRgb = hslToRgb({ ...formats.hsl, s });
                    setCurrentRgb({ ...newRgb, a: alphaPercent / 100 });
                    setHexInput(rgbToHex(newRgb, false));
                  }}
                  className="w-full accent-emerald-500 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-zinc-500">
                  <span>Lightness:</span>
                  <span>{formats.hsl.l}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formats.hsl.l}
                  onChange={(e) => {
                    const l = parseInt(e.target.value, 10);
                    const newRgb = hslToRgb({ ...formats.hsl, l });
                    setCurrentRgb({ ...newRgb, a: alphaPercent / 100 });
                    setHexInput(rgbToHex(newRgb, false));
                  }}
                  className="w-full accent-emerald-500 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Formats Grid Column */}
          <div className="lg:col-span-2 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span>Standard & Modern CSS Syntax</span>
              <span className="text-xs text-zinc-500 font-normal">Click any value to copy</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { label: "HEX (6-digit)", value: formats.hex, key: "hex" },
                { label: "HEX (8-digit with alpha)", value: formats.hex8, key: "hex8" },
                { label: "RGB (CSS Standard)", value: formats.rgbStr, key: "rgb" },
                { label: "RGBA (Alpha Included)", value: formats.rgbaStr, key: "rgba" },
                { label: "Modern Space-Separated RGB", value: formats.modernRgb, key: "modernRgb" },
                { label: "HSL (Hue, Sat, Light)", value: formats.hslStr, key: "hsl" },
                { label: "Modern Space-Separated HSL", value: formats.modernHsl, key: "modernHsl" },
                { label: "HWB (Hue, Whiteness, Blackness)", value: formats.hwbStr, key: "hwb" },
                { label: "OKLCH (CSS Color 4 Standard)", value: formats.oklchStr, key: "oklch" },
                { label: "OKLAB (Perceptual Lab)", value: formats.oklabStr, key: "oklab" },
                { label: "CIE L*a*b* (Photometric)", value: formats.labStr, key: "lab" },
                { label: "CIE LCH (Cylindrical)", value: formats.lchStr, key: "lch" },
                { label: "CMYK (Print Reference)", value: formats.cmykStr, key: "cmyk" },
                { label: "Tailwind Arbitrary Class", value: formats.tailwindArbitrary, key: "tw" },
                { label: "CSS Custom Property", value: formats.cssVariable, key: "cssVar" },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => copyToClipboard(item.value, item.key)}
                  className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
                      {item.label}
                    </div>
                    <div className="text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {item.value}
                    </div>
                  </div>
                  <div className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 shrink-0">
                    {copiedFormat === item.key ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: WCAG & APCA CONTRAST CHECKER */}
      {/* ==================================================================== */}
      {activeTab === "contrast" && (
        <div className="space-y-6">
          {/* Dual Pickers & Quick Swap */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Foreground Picker */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div
                  className="w-12 h-12 rounded-xl border border-zinc-300 dark:border-zinc-700 shadow-inner relative overflow-hidden shrink-0"
                  style={{ backgroundColor: contrastFgHex }}
                >
                  <input
                    type="color"
                    value={contrastFgHex}
                    onChange={(e) => setContrastFgHex(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                    Foreground (Text)
                  </label>
                  <input
                    type="text"
                    value={contrastFgHex}
                    onChange={(e) => setContrastFgHex(e.target.value)}
                    className="px-2 py-1 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 w-28 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <button
                onClick={() => {
                  const temp = contrastFgHex;
                  setContrastFgHex(contrastBgHex);
                  setContrastBgHex(temp);
                }}
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors shrink-0"
                title="Swap foreground and background"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>

              {/* Background Picker */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div
                  className="w-12 h-12 rounded-xl border border-zinc-300 dark:border-zinc-700 shadow-inner relative overflow-hidden shrink-0"
                  style={{ backgroundColor: contrastBgHex }}
                >
                  <input
                    type="color"
                    value={contrastBgHex}
                    onChange={(e) => setContrastBgHex(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                    Background
                  </label>
                  <input
                    type="text"
                    value={contrastBgHex}
                    onChange={(e) => setContrastBgHex(e.target.value)}
                    className="px-2 py-1 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 w-28 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Auto Fixer Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:justify-end">
                <button
                  onClick={() => {
                    const fixed = autoFixContrast(contrastFgRgb, contrastBgRgb, 4.5);
                    setContrastFgHex(rgbToHex(fixed, false));
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Auto-Fix AA (4.5:1)</span>
                </button>
                <button
                  onClick={() => {
                    const fixed = autoFixContrast(contrastFgRgb, contrastBgRgb, 7.0);
                    setContrastFgHex(rgbToHex(fixed, false));
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Fix AAA (7:1)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Contrast Score Card & Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Text Cards */}
            <div
              className="lg:col-span-2 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-4"
              style={{ backgroundColor: contrastBgHex, color: contrastFgHex }}
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                  Headline Sample (24px Bold)
                </span>
                <h3 className="text-2xl font-bold tracking-tight mt-1">
                  Zero-Knowledge Privacy Architecture
                </h3>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                  Body Text Sample (16px Regular)
                </span>
                <p className="text-base leading-relaxed mt-1">
                  All transformations and contrast calculations occur inside client-side browser memory.
                  No documents, tokens, or color strings are transmitted to remote cloud servers.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  className="px-4 py-2 rounded-xl text-xs font-semibold border"
                  style={{ borderColor: contrastFgHex }}
                >
                  Primary Action
                </button>
                <span className="text-xs opacity-80">
                  Graphical Element & Focus Ring Threshold: 3.0:1
                </span>
              </div>
            </div>

            {/* Compliance Matrix */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Contrast Ratio
                </span>
                <span
                  className={`text-2xl font-mono font-extrabold ${
                    contrast.ratio >= 4.5
                      ? "text-emerald-500"
                      : contrast.ratio >= 3.0
                      ? "text-amber-500"
                      : "text-red-500"
                  }`}
                >
                  {contrast.scoreStr}
                </span>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Normal Text (WCAG AA ≥ 4.5)</span>
                  {contrast.normalTextAA ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Fail
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Normal Text (WCAG AAA ≥ 7.0)</span>
                  {contrast.normalTextAAA ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Fail
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Large Text (WCAG AA ≥ 3.0)</span>
                  {contrast.largeTextAA ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Fail
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Large Text (WCAG AAA ≥ 4.5)</span>
                  {contrast.largeTextAAA ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Fail
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">UI Components (WCAG AA ≥ 3.0)</span>
                  {contrast.uiComponentsAA ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Fail
                    </span>
                  )}
                </div>
              </div>

              {/* APCA Score Badge */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-medium">APCA Lightness Score:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    Lc {contrast.apcaScore}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">{contrast.apcaRating}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: COLOR BLINDNESS (CVD) SIMULATOR */}
      {/* ==================================================================== */}
      {activeTab === "blindness" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/30 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Simulated with Brettel & Machado linear spectral projection matrices for 8 vision profiles.
              </span>
            </div>
            <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 shrink-0">
              Active: {formats.hex}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {simulations.map((sim) => (
              <div
                key={sim.condition}
                onClick={() => copyToClipboard(sim.simulatedHex, `cvd-${sim.condition}`)}
                className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3 cursor-pointer hover:border-emerald-500/40 transition-all group"
              >
                {/* Swatch */}
                <div
                  className="w-full h-20 rounded-xl shadow-inner border border-black/10 dark:border-white/10 relative flex items-center justify-center"
                  style={{ backgroundColor: sim.simulatedHex }}
                >
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-mono font-bold shadow-xs"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.6)",
                      color: "#FFFFFF",
                    }}
                  >
                    {sim.simulatedHex}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {sim.name}
                    </h4>
                    <span className="text-zinc-400 group-hover:text-emerald-500">
                      {copiedFormat === `cvd-${sim.condition}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                    {sim.description}
                  </p>
                  <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                    {sim.prevalence}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: COLOR HARMONIES & INTERACTIVE COLOR WHEEL */}
      {/* ==================================================================== */}
      {activeTab === "harmonies" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wheel & Harmony Selector */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Color Harmony Wheels
              </h3>

              <div className="flex items-center gap-1 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold">
                <button
                  onClick={() => setHarmonySpace("oklch")}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    harmonySpace === "oklch"
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-zinc-500"
                  }`}
                >
                  OKLCH
                </button>
                <button
                  onClick={() => setHarmonySpace("hsl")}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    harmonySpace === "hsl"
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-zinc-500"
                  }`}
                >
                  HSL
                </button>
              </div>
            </div>

            {/* SVG Color Wheel */}
            <div className="flex items-center justify-center p-2">
              <svg width="220" height="220" viewBox="0 0 220 220" className="drop-shadow-xs">
                {/* 360-degree color ring segments */}
                <defs>
                  <linearGradient id="wheel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff0000" />
                    <stop offset="17%" stopColor="#ffff00" />
                    <stop offset="33%" stopColor="#00ff00" />
                    <stop offset="50%" stopColor="#00ffff" />
                    <stop offset="67%" stopColor="#0000ff" />
                    <stop offset="83%" stopColor="#ff00ff" />
                    <stop offset="100%" stopColor="#ff0000" />
                  </linearGradient>
                </defs>

                {/* Donut wheel base */}
                <circle
                  cx="110"
                  cy="110"
                  r="90"
                  fill="none"
                  stroke="url(#wheel-grad)"
                  strokeWidth="20"
                  className="opacity-90"
                />

                {/* Inner hub */}
                <circle
                  cx="110"
                  cy="110"
                  r="78"
                  className="fill-white dark:fill-zinc-900"
                />

                {/* Center Swatch */}
                <circle
                  cx="110"
                  cy="110"
                  r="24"
                  fill={formats.hex}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  className="shadow-sm"
                />

                {/* Harmony Lines and Markers */}
                {activeHarmony.colors.map((c, i) => {
                  const angle =
                    harmonySpace === "oklch"
                      ? rgbToOklch(c.rgb).h
                      : rgbToHsl(c.rgb).h;
                  const rad = ((angle - 90) * Math.PI) / 180;
                  const x = 110 + 90 * Math.cos(rad);
                  const y = 110 + 90 * Math.sin(rad);

                  return (
                    <g key={i}>
                      {/* Connecting line to hub */}
                      <line
                        x1="110"
                        y1="110"
                        x2={x}
                        y2={y}
                        stroke="rgba(100, 116, 139, 0.4)"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                      />
                      {/* Swatch node */}
                      <circle
                        cx={x}
                        cy={y}
                        r="8"
                        fill={c.hex}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="shadow-sm"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Harmony Type Selector Buttons */}
            <div className="space-y-1">
              {harmonies.map((h) => (
                <button
                  key={h.type}
                  onClick={() => setSelectedHarmonyType(h.type)}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition-colors ${
                    selectedHarmonyType === h.type
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span>{h.title}</span>
                  <div className="flex items-center gap-1">
                    {h.colors.map((c, idx) => (
                      <span
                        key={idx}
                        className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20 shadow-2xs"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Harmony Swatches Column */}
          <div className="lg:col-span-2 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {activeHarmony.title} Scheme
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">{activeHarmony.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeHarmony.colors.map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => copyToClipboard(c.hex, `harmony-${idx}`)}
                  className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl shadow-xs border border-black/10 dark:border-white/20 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                        {c.hex}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-medium">{c.role}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetHex(c.hex);
                      }}
                      className="px-2 py-1 rounded text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-700 hover:bg-emerald-500 hover:text-white transition-colors text-zinc-700 dark:text-zinc-300"
                    >
                      Make Base
                    </button>
                    <span className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200">
                      {copiedFormat === `harmony-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: TAILWIND 11-STEP DESIGN TOKEN SHADES (50 - 950) */}
      {/* ==================================================================== */}
      {activeTab === "shades" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  Perceptual OKLCH Shade Scale
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  11-step lightness curve interpolated in OKLCH to eliminate saturation clipping and hue distortion.
                </p>
              </div>

              {/* Brand Name Input */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Token Prefix:</span>
                <input
                  type="text"
                  value={shadeBrandName}
                  onChange={(e) => setShadeBrandName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="px-2.5 py-1 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 w-24 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Shades Horizontal Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2 pt-2">
              {shadeScale.map((s) => (
                <div
                  key={s.step}
                  onClick={() => copyToClipboard(s.hex, `shade-${s.step}`)}
                  className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all flex flex-col items-center space-y-2 group"
                >
                  <div
                    className="w-full h-12 rounded-lg shadow-inner border border-black/10 dark:border-white/10 relative flex items-center justify-center"
                    style={{ backgroundColor: s.hex }}
                  >
                    {s.isBase && (
                      <span className="w-2 h-2 rounded-full bg-white shadow-xs border border-black/40" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                      {s.step}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">{s.hex}</div>
                  </div>
                  <div className="text-zinc-400 group-hover:text-emerald-500 text-[10px] flex items-center gap-1">
                    {copiedFormat === `shade-${s.step}` ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <span>Copy</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Code Export Box */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold">
                <button
                  onClick={() => setShadeExportFormat("tailwind4")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    shadeExportFormat === "tailwind4"
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-zinc-500"
                  }`}
                >
                  Tailwind v4 (@theme)
                </button>
                <button
                  onClick={() => setShadeExportFormat("tailwind3")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    shadeExportFormat === "tailwind3"
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-zinc-500"
                  }`}
                >
                  Tailwind v3 Config
                </button>
                <button
                  onClick={() => setShadeExportFormat("css")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    shadeExportFormat === "css"
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-zinc-500"
                  }`}
                >
                  CSS Variables
                </button>
                <button
                  onClick={() => setShadeExportFormat("json")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    shadeExportFormat === "json"
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-zinc-500"
                  }`}
                >
                  W3C JSON
                </button>
              </div>

              <button
                onClick={() => copyToClipboard(shadeExportCode, "export-snippet")}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
              >
                {copiedFormat === "export-snippet" ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy Code Block</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-zinc-950 text-zinc-200 text-xs font-mono overflow-x-auto border border-zinc-800">
              <code>{shadeExportCode}</code>
            </pre>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: UI COMPONENT PREVIEW */}
      {/* ==================================================================== */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-medium">
              Interactive Design System Preview (styled with {formats.hex})
            </span>
            <button
              onClick={() => setPreviewDarkTheme(!previewDarkTheme)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-xs"
            >
              {previewDarkTheme ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Switch to Light Mockup</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Switch to Dark Mockup</span>
                </>
              )}
            </button>
          </div>

          <div
            className={`p-8 rounded-3xl border transition-colors ${
              previewDarkTheme
                ? "bg-zinc-950 border-zinc-800 text-zinc-100"
                : "bg-zinc-50 border-zinc-200 text-zinc-900"
            }`}
          >
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Mockup Card */}
              <div
                className={`p-6 rounded-2xl border shadow-sm space-y-4 ${
                  previewDarkTheme
                    ? "bg-zinc-900/80 border-zinc-800"
                    : "bg-white border-zinc-200/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: formats.rgbaStr,
                        color: formats.isDark ? "#FFFFFF" : "#000000",
                      }}
                    >
                      Featured Utility
                    </span>
                    <span className="text-xs opacity-60">Version 2.4.0</span>
                  </div>

                  <span
                    className="w-3 h-3 rounded-full shadow-xs"
                    style={{ backgroundColor: formats.hex }}
                  />
                </div>

                <div>
                  <h4 className="text-xl font-bold tracking-tight">
                    Encrypted Zero-Knowledge Workspace
                  </h4>
                  <p className="text-xs opacity-75 mt-1 leading-relaxed">
                    Client-side utilities run entirely inside your device&apos;s memory. No tracking cookies,
                    no third-party CDNs, and zero data egress.
                  </p>
                </div>

                {/* Interactive Mockup Form Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium opacity-80">API Gateway Endpoint</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value="https://api.privatools.local/v1/vault"
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none transition-shadow ${
                        previewDarkTheme
                          ? "bg-zinc-950 border-zinc-800 text-zinc-200"
                          : "bg-zinc-50 border-zinc-200 text-zinc-800"
                      }`}
                      style={{ borderColor: formats.hex }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95 shadow-xs"
                    style={{
                      backgroundColor: formats.hex,
                      color: formats.isDark ? "#FFFFFF" : "#000000",
                    }}
                  >
                    Solid Action
                  </button>

                  <button
                    className="px-4 py-2 rounded-xl text-xs font-semibold border transition-colors"
                    style={{
                      borderColor: formats.hex,
                      color: formats.hex,
                    }}
                  >
                    Outline Button
                  </button>

                  <button
                    className="px-3 py-2 rounded-xl text-xs font-medium opacity-80 hover:opacity-100 transition-opacity"
                  >
                    Ghost Dismiss
                  </button>
                </div>
              </div>

              {/* Alert Mockup */}
              <div
                className="p-4 rounded-2xl border flex items-start gap-3"
                style={{
                  backgroundColor: previewDarkTheme ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.12)",
                  borderColor: formats.hex,
                }}
              >
                <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: formats.hex }} />
                <div>
                  <h5 className="text-xs font-bold" style={{ color: formats.hex }}>
                    Security Policy Enforced
                  </h5>
                  <p className="text-xs opacity-80 mt-0.5">
                    End-to-end sandbox active. Color matrices computed with floating-point linear optics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
