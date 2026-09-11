/**
 * Pure TypeScript Color Science & Conversion Engine
 * Zero-dependency, client-side color transformations, perceptual OKLCH color space,
 * WCAG 2.1 & APCA contrast calculations, color blindness simulations, and harmonic palette algorithms.
 */

export interface RgbColor {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
  a?: number; // 0 - 1
}

export interface HslColor {
  h: number; // 0 - 360
  s: number; // 0 - 100
  l: number; // 0 - 100
  a?: number; // 0 - 1
}

export interface HwbColor {
  h: number; // 0 - 360
  w: number; // 0 - 100
  b: number; // 0 - 100
  a?: number; // 0 - 1
}

export interface OklchColor {
  l: number; // 0 - 1 (Lightness)
  c: number; // 0 - 0.4+ (Chroma)
  h: number; // 0 - 360 (Hue angle)
  a?: number; // 0 - 1
}

export interface OklabColor {
  l: number; // 0 - 1
  a: number; // -0.4 - 0.4
  b: number; // -0.4 - 0.4
  alpha?: number; // 0 - 1
}

export interface LabColor {
  l: number; // 0 - 100
  a: number; // -128 - 127
  b: number; // -128 - 127
}

export interface LchColor {
  l: number; // 0 - 100
  c: number; // 0 - 150+
  h: number; // 0 - 360
}

export interface CmykColor {
  c: number; // 0 - 100
  m: number; // 0 - 100
  y: number; // 0 - 100
  k: number; // 0 - 100
}

export interface ColorFormats {
  hex: string;
  hex8: string;
  rgbStr: string;
  rgbaStr: string;
  modernRgb: string;
  hslStr: string;
  hslaStr: string;
  modernHsl: string;
  hwbStr: string;
  oklchStr: string;
  oklabStr: string;
  labStr: string;
  lchStr: string;
  cmykStr: string;
  tailwindArbitrary: string;
  cssVariable: string;
  rgb: RgbColor;
  hsl: HslColor;
  oklch: OklchColor;
  luminance: number;
  isDark: boolean;
  temperature: "Cool" | "Neutral" | "Warm";
}

export interface ContrastResult {
  ratio: number;
  scoreStr: string;
  normalTextAA: boolean;
  normalTextAAA: boolean;
  largeTextAA: boolean;
  largeTextAAA: boolean;
  uiComponentsAA: boolean;
  apcaScore: number;
  apcaRating: string;
}

export type BlindnessCondition =
  | "normal"
  | "protanopia"
  | "protanomaly"
  | "deuteranopia"
  | "deuteranomaly"
  | "tritanopia"
  | "tritanomaly"
  | "achromatopsia";

export interface BlindnessSimulation {
  condition: BlindnessCondition;
  name: string;
  description: string;
  prevalence: string;
  simulatedRgb: RgbColor;
  simulatedHex: string;
}

export interface ShadeStep {
  step: number; // 50, 100, 200, ..., 900, 950
  hex: string;
  rgb: RgbColor;
  oklch: OklchColor;
  isBase?: boolean;
}

// ============================================================================
// 1. GAMMA EXPANSION & COMPRESSION (sRGB <-> Linear RGB)
// ============================================================================

export function sRgbToLinear(c: number): number {
  const norm = Math.max(0, Math.min(255, c)) / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

export function linearToSRgb(cLin: number): number {
  const clamped = Math.max(0, Math.min(1, cLin));
  const s = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, s)) * 255);
}

// ============================================================================
// 2. HEX & RGB CONVERSIONS
// ============================================================================

export function hexToRgb(hex: string): RgbColor {
  let cleaned = hex.trim().replace(/^#/, "");
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  } else if (cleaned.length === 4) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (cleaned.length === 8) {
    const r = parseInt(cleaned.slice(0, 2), 16) || 0;
    const g = parseInt(cleaned.slice(2, 4), 16) || 0;
    const b = parseInt(cleaned.slice(4, 6), 16) || 0;
    const a = Number((parseInt(cleaned.slice(6, 8), 16) / 255).toFixed(3));
    return { r, g, b, a };
  }

  const r = parseInt(cleaned.slice(0, 2), 16) || 0;
  const g = parseInt(cleaned.slice(2, 4), 16) || 0;
  const b = parseInt(cleaned.slice(4, 6), 16) || 0;
  return { r, g, b, a: 1 };
}

export function rgbToHex(rgb: RgbColor, includeAlpha = false): string {
  const r = Math.max(0, Math.min(255, Math.round(rgb.r)));
  const g = Math.max(0, Math.min(255, Math.round(rgb.g)));
  const b = Math.max(0, Math.min(255, Math.round(rgb.b)));

  const hex6 = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  if (!includeAlpha || rgb.a === undefined || rgb.a >= 1) {
    return hex6;
  }
  const a = Math.max(0, Math.min(255, Math.round(rgb.a * 255)));
  const aHex = a.toString(16).padStart(2, "0").toUpperCase();
  return `${hex6}${aHex}`;
}

// ============================================================================
// 3. RGB & HSL CONVERSIONS
// ============================================================================

export function rgbToHsl(rgb: RgbColor): HslColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      case b:
        h = (r - g) / delta + 4;
        break;
    }
    h *= 60;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a: rgb.a !== undefined ? rgb.a : 1,
  };
}

export function hslToRgb(hsl: HslColor): RgbColor {
  const h = (hsl.h % 360 + 360) % 360;
  const s = Math.max(0, Math.min(100, hsl.s)) / 100;
  const l = Math.max(0, Math.min(100, hsl.l)) / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val, a: hsl.a };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hue2rgb(p, q, h / 360 + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h / 360) * 255);
  const b = Math.round(hue2rgb(p, q, h / 360 - 1 / 3) * 255);

  return { r, g, b, a: hsl.a !== undefined ? hsl.a : 1 };
}

// ============================================================================
// 4. HWB CONVERSIONS
// ============================================================================

export function rgbToHwb(rgb: RgbColor): HwbColor {
  const hsl = rgbToHsl(rgb);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const w = Math.min(r, g, b);
  const blk = 1 - Math.max(r, g, b);

  return {
    h: hsl.h,
    w: Math.round(w * 100),
    b: Math.round(blk * 100),
    a: rgb.a,
  };
}

export function hwbToRgb(hwb: HwbColor): RgbColor {
  const w = Math.max(0, Math.min(100, hwb.w)) / 100;
  const b = Math.max(0, Math.min(100, hwb.b)) / 100;

  if (w + b >= 1) {
    const gray = Math.round((w / (w + b)) * 255);
    return { r: gray, g: gray, b: gray, a: hwb.a };
  }

  const baseRgb = hslToRgb({ h: hwb.h, s: 100, l: 50 });
  const factor = 1 - w - b;

  const r = Math.round((baseRgb.r / 255) * factor * 255 + w * 255);
  const g = Math.round((baseRgb.g / 255) * factor * 255 + w * 255);
  const bl = Math.round((baseRgb.b / 255) * factor * 255 + w * 255);

  return {
    r: Math.max(0, Math.min(255, r)),
    g: Math.max(0, Math.min(255, g)),
    b: Math.max(0, Math.min(255, bl)),
    a: hwb.a,
  };
}

// ============================================================================
// 5. OKLAB & OKLCH PERCEPTUAL CONVERSIONS (Björn Ottosson, 2020)
// ============================================================================

export function rgbToOklab(rgb: RgbColor): OklabColor {
  const rLin = sRgbToLinear(rgb.r);
  const gLin = sRgbToLinear(rgb.g);
  const bLin = sRgbToLinear(rgb.b);

  const l = 0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin;
  const m = 0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin;
  const s = 0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    l: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
    alpha: rgb.a,
  };
}

export function oklabToRgb(oklab: OklabColor): RgbColor {
  const l_ = oklab.l + 0.3963377774 * oklab.a + 0.2158037573 * oklab.b;
  const m_ = oklab.l - 0.1055613458 * oklab.a - 0.0638541728 * oklab.b;
  const s_ = oklab.l - 0.0894841775 * oklab.a - 1.291485548 * oklab.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: linearToSRgb(rLin),
    g: linearToSRgb(gLin),
    b: linearToSRgb(bLin),
    a: oklab.alpha,
  };
}

export function oklabToOklch(oklab: OklabColor): OklchColor {
  const c = Math.sqrt(oklab.a * oklab.a + oklab.b * oklab.b);
  let h = (Math.atan2(oklab.b, oklab.a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return {
    l: Number(oklab.l.toFixed(4)),
    c: Number(c.toFixed(4)),
    h: Number(h.toFixed(2)),
    a: oklab.alpha,
  };
}

export function oklchToOklab(oklch: OklchColor): OklabColor {
  const hRad = (oklch.h * Math.PI) / 180;
  return {
    l: oklch.l,
    a: oklch.c * Math.cos(hRad),
    b: oklch.c * Math.sin(hRad),
    alpha: oklch.a,
  };
}

export function rgbToOklch(rgb: RgbColor): OklchColor {
  return oklabToOklch(rgbToOklab(rgb));
}

export function oklchToRgb(oklch: OklchColor): RgbColor {
  return oklabToRgb(oklchToOklab(oklch));
}

// ============================================================================
// 6. CIE LAB & LCH CONVERSIONS (D65 Illuminant)
// ============================================================================

export function rgbToCieLab(rgb: RgbColor): LabColor {
  const rLin = sRgbToLinear(rgb.r);
  const gLin = sRgbToLinear(rgb.g);
  const bLin = sRgbToLinear(rgb.b);

  // D65 standard observer
  const x = (0.4124564 * rLin + 0.3575761 * gLin + 0.1804375 * bLin) / 0.95047;
  const y = (0.2126729 * rLin + 0.7151522 * gLin + 0.072175 * bLin) / 1.0;
  const z = (0.0193339 * rLin + 0.119192 * gLin + 0.9503041 * bLin) / 1.08883;

  const f = (t: number) =>
    t > 0.00885645 ? Math.cbrt(t) : 7.787037 * t + 16 / 116;

  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return {
    l: Number(l.toFixed(2)),
    a: Number(a.toFixed(2)),
    b: Number(b.toFixed(2)),
  };
}

export function cieLabToLch(lab: LabColor): LchColor {
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return {
    l: lab.l,
    c: Number(c.toFixed(2)),
    h: Number(h.toFixed(2)),
  };
}

// ============================================================================
// 7. CMYK CONVERSIONS
// ============================================================================

export function rgbToCmyk(rgb: RgbColor): CmykColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const k = 1 - Math.max(r, g, b);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

// ============================================================================
// 8. STRING PARSING & FULL PROPERTY EXTRACTION
// ============================================================================

const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#FFFFFF",
  red: "#FF0000",
  green: "#008000",
  blue: "#0000FF",
  yellow: "#FFFF00",
  cyan: "#00FFFF",
  magenta: "#FF00FF",
  gray: "#808080",
  grey: "#808080",
  orange: "#FFA500",
  purple: "#800080",
  pink: "#FFC0CB",
  indigo: "#4B0082",
  teal: "#008080",
  violet: "#EE82EE",
  emerald: "#10B981",
  slate: "#64748B",
  amber: "#F59E0B",
  rose: "#F43F5E",
};

export function parseColor(input: string): RgbColor | null {
  const s = input.trim().toLowerCase();

  // Named color
  if (NAMED_COLORS[s]) {
    return hexToRgb(NAMED_COLORS[s]);
  }

  // Hex (#FFF, #FFFFFF, #FFFFFFFF)
  if (/^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) {
    return hexToRgb(s);
  }

  // rgb(r, g, b) or rgba(r, g, b, a) or modern rgb(r g b / a)
  const rgbMatch = s.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const a = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1;
    return { r, g, b, a };
  }

  // hsl(h, s%, l%) or hsla(h, s%, l%, a) or modern hsl(h s% l% / a)
  const hslMatch = s.match(/hsla?\((\d+)[deg,\s]+(\d+)%?[,\s]+(\d+)%?(?:[,\s/]+([\d.]+))?\)/i);
  if (hslMatch) {
    const h = parseInt(hslMatch[1], 10);
    const sVal = parseInt(hslMatch[2], 10);
    const l = parseInt(hslMatch[3], 10);
    const a = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1;
    return hslToRgb({ h, s: sVal, l, a });
  }

  // oklch(l c h [/ a])
  const oklchMatch = s.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/i);
  if (oklchMatch) {
    const l = parseFloat(oklchMatch[1]);
    const c = parseFloat(oklchMatch[2]);
    const h = parseFloat(oklchMatch[3]);
    const a = oklchMatch[4] !== undefined ? parseFloat(oklchMatch[4]) : 1;
    return oklchToRgb({ l, c, h, a });
  }

  // hwb(h w% b% [/ a])
  const hwbMatch = s.match(/hwb\(\s*([\d.]+)[deg,\s]+(\d+)%?[,\s]+(\d+)%?(?:\s*\/\s*([\d.]+))?\s*\)/i);
  if (hwbMatch) {
    const h = parseFloat(hwbMatch[1]);
    const w = parseFloat(hwbMatch[2]);
    const b = parseFloat(hwbMatch[3]);
    const a = hwbMatch[4] !== undefined ? parseFloat(hwbMatch[4]) : 1;
    return hwbToRgb({ h, w, b, a });
  }

  return null;
}

export function getColorFormats(rgb: RgbColor): ColorFormats {
  const a = rgb.a !== undefined ? Math.max(0, Math.min(1, rgb.a)) : 1;
  const safeRgb = {
    r: Math.max(0, Math.min(255, Math.round(rgb.r))),
    g: Math.max(0, Math.min(255, Math.round(rgb.g))),
    b: Math.max(0, Math.min(255, Math.round(rgb.b))),
    a,
  };

  const hex = rgbToHex(safeRgb, false);
  const hex8 = rgbToHex(safeRgb, true);

  const hsl = rgbToHsl(safeRgb);
  const hwb = rgbToHwb(safeRgb);
  const oklch = rgbToOklch(safeRgb);
  const oklab = rgbToOklab(safeRgb);
  const lab = rgbToCieLab(safeRgb);
  const lch = cieLabToLch(lab);
  const cmyk = rgbToCmyk(safeRgb);

  // Relative luminance according to WCAG 2.1
  const rLin = sRgbToLinear(safeRgb.r);
  const gLin = sRgbToLinear(safeRgb.g);
  const bLin = sRgbToLinear(safeRgb.b);
  const luminance = Number((0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin).toFixed(4));

  const isDark = luminance < 0.45;

  // Temperature
  let temperature: "Cool" | "Neutral" | "Warm" = "Neutral";
  if (hsl.h >= 20 && hsl.h <= 70) {
    temperature = "Warm";
  } else if (hsl.h >= 170 && hsl.h <= 260) {
    temperature = "Cool";
  } else if (hsl.h > 70 && hsl.h < 170) {
    temperature = "Neutral"; // Greens
  } else {
    temperature = "Warm"; // Reds / Magentas
  }

  const alphaStr = a < 1 ? `, ${a}` : "";
  const alphaSlash = a < 1 ? ` / ${a}` : "";

  return {
    hex,
    hex8,
    rgbStr: `rgb(${safeRgb.r}, ${safeRgb.g}, ${safeRgb.b})`,
    rgbaStr: `rgba(${safeRgb.r}, ${safeRgb.g}, ${safeRgb.b}${alphaStr})`,
    modernRgb: `rgb(${safeRgb.r} ${safeRgb.g} ${safeRgb.b}${alphaSlash})`,
    hslStr: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    hslaStr: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%${alphaStr})`,
    modernHsl: `hsl(${hsl.h}deg ${hsl.s}% ${hsl.l}%${alphaSlash})`,
    hwbStr: `hwb(${hwb.h} ${hwb.w}% ${hwb.b}%${alphaSlash})`,
    oklchStr: `oklch(${oklch.l} ${oklch.c} ${oklch.h}${alphaSlash})`,
    oklabStr: `oklab(${Number(oklab.l.toFixed(3))} ${Number(oklab.a.toFixed(3))} ${Number(oklab.b.toFixed(3))}${alphaSlash})`,
    labStr: `lab(${lab.l}% ${lab.a} ${lab.b})`,
    lchStr: `lch(${lch.l}% ${lch.c} ${lch.h})`,
    cmykStr: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
    tailwindArbitrary: `bg-[${hex}]`,
    cssVariable: `--color-brand: ${hex};`,
    rgb: safeRgb,
    hsl,
    oklch,
    luminance,
    isDark,
    temperature,
  };
}

// ============================================================================
// 9. WCAG 2.1 & APCA CONTRAST CALCULATION & AUTO-FIXER
// ============================================================================

export function calculateContrast(fg: RgbColor, bg: RgbColor): ContrastResult {
  const rLin1 = sRgbToLinear(fg.r);
  const gLin1 = sRgbToLinear(fg.g);
  const bLin1 = sRgbToLinear(fg.b);
  const l1 = 0.2126 * rLin1 + 0.7152 * gLin1 + 0.0722 * bLin1;

  const rLin2 = sRgbToLinear(bg.r);
  const gLin2 = sRgbToLinear(bg.g);
  const bLin2 = sRgbToLinear(bg.b);
  const l2 = 0.2126 * rLin2 + 0.7152 * gLin2 + 0.0722 * bLin2;

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const rawRatio = (lighter + 0.05) / (darker + 0.05);
  const ratio = Number(rawRatio.toFixed(2));

  // APCA (Lightness Contrast) calculation
  // Taking ocular light scatter into account
  let apcaScore = 0;
  if (l2 > l1) {
    // Dark text on light background
    const sBg = Math.pow(l2, 0.56);
    const sTxt = Math.pow(l1, 0.57);
    apcaScore = Math.round((sBg - sTxt) * 114 - 2.7);
  } else {
    // Light text on dark background
    const sBg = Math.pow(l2, 0.65);
    const sTxt = Math.pow(l1, 0.62);
    apcaScore = Math.round((sBg - sTxt) * 114 + 2.7);
  }

  let apcaRating = "Fail";
  if (Math.abs(apcaScore) >= 90) apcaRating = "Preferred Body (Any size)";
  else if (Math.abs(apcaScore) >= 75) apcaRating = "Body Text (16px+)";
  else if (Math.abs(apcaScore) >= 60) apcaRating = "Content Text (18px+ / Bold 14px+)";
  else if (Math.abs(apcaScore) >= 45) apcaRating = "Headline Text (24px+ / Bold 18px+)";
  else if (Math.abs(apcaScore) >= 30) apcaRating = "UI Controls / Badges Only";

  return {
    ratio,
    scoreStr: `${ratio.toFixed(2)}:1`,
    normalTextAA: ratio >= 4.5,
    normalTextAAA: ratio >= 7.0,
    largeTextAA: ratio >= 3.0,
    largeTextAAA: ratio >= 4.5,
    uiComponentsAA: ratio >= 3.0,
    apcaScore,
    apcaRating,
  };
}

/**
 * Intelligent Contrast Auto-Fixer:
 * Nudges the foreground OKLCH Lightness until it passes the target contrast ratio against the background,
 * preserving hue and natural chroma saturation.
 */
export function autoFixContrast(
  fg: RgbColor,
  bg: RgbColor,
  targetRatio = 4.5
): RgbColor {
  const current = calculateContrast(fg, bg);
  if (current.ratio >= targetRatio) return fg;

  const bgFormats = getColorFormats(bg);
  const fgOklch = rgbToOklch(fg);

  // If background is light, we need a darker foreground (lower L)
  // If background is dark, we need a lighter foreground (higher L)
  const needDarker = bgFormats.luminance >= 0.35;

  let low = needDarker ? 0 : fgOklch.l;
  let high = needDarker ? fgOklch.l : 1;
  let bestRgb = fg;

  // Binary search for closest lightness that achieves the target ratio
  for (let i = 0; i < 20; i++) {
    const midL = (low + high) / 2;
    const testOklch: OklchColor = {
      l: midL,
      c: Math.min(fgOklch.c, midL < 0.2 || midL > 0.85 ? fgOklch.c * 0.7 : fgOklch.c),
      h: fgOklch.h,
      a: fgOklch.a,
    };
    const testRgb = oklchToRgb(testOklch);
    const testContrast = calculateContrast(testRgb, bg);

    if (testContrast.ratio >= targetRatio) {
      bestRgb = testRgb;
      if (needDarker) {
        low = midL; // try lighter (less extreme)
      } else {
        high = midL; // try darker (less extreme)
      }
    } else {
      if (needDarker) {
        high = midL; // need even darker
      } else {
        low = midL; // need even lighter
      }
    }
  }

  return bestRgb;
}

// ============================================================================
// 10. COLOR VISION DEFICIENCY (COLOR BLINDNESS) SIMULATION
// ============================================================================

const CVD_MATRICES: Record<BlindnessCondition, number[][]> = {
  normal: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  // Protanopia (Missing L-cones / Red-blind)
  protanopia: [
    [0.56667, 0.43333, 0.0],
    [0.55833, 0.44167, 0.0],
    [0.0, 0.24167, 0.75833],
  ],
  // Protanomaly (Anomalous L-cones / Red-weak)
  protanomaly: [
    [0.81667, 0.18333, 0.0],
    [0.33333, 0.66667, 0.0],
    [0.0, 0.125, 0.875],
  ],
  // Deuteranopia (Missing M-cones / Green-blind)
  deuteranopia: [
    [0.625, 0.375, 0.0],
    [0.7, 0.3, 0.0],
    [0.0, 0.3, 0.7],
  ],
  // Deuteranomaly (Anomalous M-cones / Green-weak) - most common CVD (~5% males)
  deuteranomaly: [
    [0.8, 0.2, 0.0],
    [0.25833, 0.74167, 0.0],
    [0.0, 0.14167, 0.85833],
  ],
  // Tritanopia (Missing S-cones / Blue-blind)
  tritanopia: [
    [0.95, 0.05, 0.0],
    [0.0, 0.43333, 0.56667],
    [0.0, 0.475, 0.525],
  ],
  // Tritanomaly (Anomalous S-cones / Blue-weak)
  tritanomaly: [
    [0.96667, 0.03333, 0.0],
    [0.0, 0.73333, 0.26667],
    [0.0, 0.18333, 0.81667],
  ],
  // Achromatopsia (Complete Monochromacy)
  achromatopsia: [
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
  ],
};

export const CVD_PROFILES: {
  condition: BlindnessCondition;
  name: string;
  description: string;
  prevalence: string;
}[] = [
  {
    condition: "normal",
    name: "Normal Trichromacy",
    description: "Standard full human color vision across three cone types.",
    prevalence: "91% of population",
  },
  {
    condition: "deuteranomaly",
    name: "Deuteranomaly",
    description: "Green-weak cone sensitivity. Red and green shades appear muted.",
    prevalence: "~5% of males, 0.4% females (most common)",
  },
  {
    condition: "deuteranopia",
    name: "Deuteranopia",
    description: "Complete lack of green cones. Difficulty distinguishing red/green.",
    prevalence: "~1.2% of males",
  },
  {
    condition: "protanomaly",
    name: "Protanomaly",
    description: "Red-weak cone sensitivity. Reds appear darker and shifted.",
    prevalence: "~1.0% of males",
  },
  {
    condition: "protanopia",
    name: "Protanopia",
    description: "Complete lack of red cones. Reds appear black or dark olive.",
    prevalence: "~1.0% of males",
  },
  {
    condition: "tritanomaly",
    name: "Tritanomaly",
    description: "Blue-weak cone sensitivity. Blue and yellow hues shift.",
    prevalence: "0.01% of population",
  },
  {
    condition: "tritanopia",
    name: "Tritanopia",
    description: "Complete lack of blue cones. Blue appears green, yellow appears violet.",
    prevalence: "0.008% of population",
  },
  {
    condition: "achromatopsia",
    name: "Achromatopsia",
    description: "Total color blindness / Monochromacy. Vision in shades of gray.",
    prevalence: "0.003% of population",
  },
];

export function simulateColorBlindness(rgb: RgbColor, condition: BlindnessCondition): RgbColor {
  if (condition === "normal") return { ...rgb };

  const m = CVD_MATRICES[condition];
  const r = rgb.r;
  const g = rgb.g;
  const b = rgb.b;

  const simR = Math.max(0, Math.min(255, Math.round(m[0][0] * r + m[0][1] * g + m[0][2] * b)));
  const simG = Math.max(0, Math.min(255, Math.round(m[1][0] * r + m[1][1] * g + m[1][2] * b)));
  const simB = Math.max(0, Math.min(255, Math.round(m[2][0] * r + m[2][1] * g + m[2][2] * b)));

  return { r: simR, g: simG, b: simB, a: rgb.a };
}

export function getAllColorBlindnessSimulations(rgb: RgbColor): BlindnessSimulation[] {
  return CVD_PROFILES.map((p) => {
    const simRgb = simulateColorBlindness(rgb, p.condition);
    return {
      condition: p.condition,
      name: p.name,
      description: p.description,
      prevalence: p.prevalence,
      simulatedRgb: simRgb,
      simulatedHex: rgbToHex(simRgb, false),
    };
  });
}

// ============================================================================
// 11. COLOR HARMONIES (OKLCH & HSL)
// ============================================================================

export type HarmonyType =
  | "complementary"
  | "analogous"
  | "triadic"
  | "tetradic"
  | "split-complementary"
  | "square"
  | "monochromatic";

export interface ColorHarmony {
  type: HarmonyType;
  title: string;
  description: string;
  colors: {
    hex: string;
    rgb: RgbColor;
    role: string;
    hueOffset?: number;
  }[];
}

export function generateHarmonies(baseRgb: RgbColor, useOklch = true): ColorHarmony[] {
  const oklch = rgbToOklch(baseRgb);
  const hsl = rgbToHsl(baseRgb);

  const makeColorFromHue = (hueOffset: number, role: string) => {
    if (useOklch) {
      const newHue = (oklch.h + hueOffset + 360) % 360;
      const rgb = oklchToRgb({ l: oklch.l, c: oklch.c, h: newHue, a: oklch.a });
      return { hex: rgbToHex(rgb, false), rgb, role, hueOffset };
    } else {
      const newHue = (hsl.h + hueOffset + 360) % 360;
      const rgb = hslToRgb({ h: newHue, s: hsl.s, l: hsl.l, a: hsl.a });
      return { hex: rgbToHex(rgb, false), rgb, role, hueOffset };
    }
  };

  const baseEntry = {
    hex: rgbToHex(baseRgb, false),
    rgb: baseRgb,
    role: "Base",
    hueOffset: 0,
  };

  // 1. Complementary (180 deg)
  const complementary: ColorHarmony = {
    type: "complementary",
    title: "Complementary",
    description: "Directly opposite on the color wheel. Delivers the highest visual contrast and punch.",
    colors: [baseEntry, makeColorFromHue(180, "Complement")],
  };

  // 2. Analogous (+/- 30 deg)
  const analogous: ColorHarmony = {
    type: "analogous",
    title: "Analogous",
    description: "Adjacent neighbors on the color wheel. Creates serene, natural, and cohesive designs.",
    colors: [
      makeColorFromHue(-30, "Analogous -30°"),
      baseEntry,
      makeColorFromHue(30, "Analogous +30°"),
    ],
  };

  // 3. Triadic (+120, +240 deg)
  const triadic: ColorHarmony = {
    type: "triadic",
    title: "Triadic",
    description: "Equilateral triangle (120° apart). Vibrant and balanced even when desaturated.",
    colors: [
      baseEntry,
      makeColorFromHue(120, "Triad +120°"),
      makeColorFromHue(240, "Triad +240°"),
    ],
  };

  // 4. Split-Complementary (+150, +210 deg)
  const splitComp: ColorHarmony = {
    type: "split-complementary",
    title: "Split-Complementary",
    description: "Base color plus the two colors adjacent to its complement. High contrast with less tension.",
    colors: [
      baseEntry,
      makeColorFromHue(150, "Split 150°"),
      makeColorFromHue(210, "Split 210°"),
    ],
  };

  // 5. Tetradic / Rectangular (+60, +180, +240 deg)
  const tetradic: ColorHarmony = {
    type: "tetradic",
    title: "Tetradic (Rectangle)",
    description: "Two complementary pairs forming a rectangle. Rich palette with endless variation.",
    colors: [
      baseEntry,
      makeColorFromHue(60, "Accent 60°"),
      makeColorFromHue(180, "Complement 180°"),
      makeColorFromHue(240, "Secondary 240°"),
    ],
  };

  // 6. Square (+90, +180, +270 deg)
  const square: ColorHarmony = {
    type: "square",
    title: "Square",
    description: "Four colors spaced evenly at 90° intervals around the wheel.",
    colors: [
      baseEntry,
      makeColorFromHue(90, "Square 90°"),
      makeColorFromHue(180, "Square 180°"),
      makeColorFromHue(270, "Square 270°"),
    ],
  };

  // 7. Monochromatic (Same hue, modulated lightness & chroma)
  const monoSteps = [-0.3, -0.15, 0, 0.15, 0.3];
  const monochromatic: ColorHarmony = {
    type: "monochromatic",
    title: "Monochromatic",
    description: "Single hue with varying lightness and chroma. Elegant, clean, and foolproof.",
    colors: monoSteps.map((offset) => {
      if (useOklch) {
        const newL = Math.max(0.1, Math.min(0.95, oklch.l + offset));
        const newC = Math.max(0.02, Math.min(0.3, oklch.c * (1 - Math.abs(offset))));
        const rgb = oklchToRgb({ l: newL, c: newC, h: oklch.h, a: oklch.a });
        return {
          hex: rgbToHex(rgb, false),
          rgb,
          role: offset === 0 ? "Base" : offset < 0 ? `Darker (${Math.round(offset * 100)}%)` : `Lighter (+${Math.round(offset * 100)}%)`,
        };
      } else {
        const newL = Math.max(10, Math.min(95, hsl.l + offset * 100));
        const rgb = hslToRgb({ h: hsl.h, s: hsl.s, l: newL, a: hsl.a });
        return {
          hex: rgbToHex(rgb, false),
          rgb,
          role: offset === 0 ? "Base" : offset < 0 ? `Darker` : `Lighter`,
        };
      }
    }),
  };

  return [complementary, analogous, triadic, splitComp, tetradic, square, monochromatic];
}

// ============================================================================
// 12. TAILWIND 11-STEP DESIGN TOKEN SHADE GENERATOR (50 - 950)
// ============================================================================

export function generateShadeScale(baseRgb: RgbColor): ShadeStep[] {
  const oklch = rgbToOklch(baseRgb);

  // Target lightness curve for standard 11-step design system tokens
  const shadeLightnessTargets: Record<number, number> = {
    50: 0.97,
    100: 0.93,
    200: 0.86,
    300: 0.77,
    400: 0.67,
    500: 0.58,
    600: 0.49,
    700: 0.40,
    800: 0.31,
    900: 0.23,
    950: 0.16,
  };

  // Find which step is closest to base color
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  let closestStep = 500;
  let minDiff = Infinity;
  for (const step of steps) {
    const diff = Math.abs(shadeLightnessTargets[step] - oklch.l);
    if (diff < minDiff) {
      minDiff = diff;
      closestStep = step;
    }
  }

  return steps.map((step) => {
    if (step === closestStep) {
      return {
        step,
        hex: rgbToHex(baseRgb, false),
        rgb: baseRgb,
        oklch,
        isBase: true,
      };
    }

    const targetL = shadeLightnessTargets[step];
    // Scale chroma so high lightness and low lightness don't clip or look muddy
    let targetC = oklch.c;
    if (step <= 100) {
      targetC = Math.min(oklch.c * 0.35, 0.05);
    } else if (step === 200) {
      targetC = Math.min(oklch.c * 0.65, 0.1);
    } else if (step >= 900) {
      targetC = Math.min(oklch.c * 0.7, 0.12);
    }

    const stepOklch: OklchColor = {
      l: targetL,
      c: targetC,
      h: oklch.h,
      a: 1,
    };
    const stepRgb = oklchToRgb(stepOklch);

    return {
      step,
      hex: rgbToHex(stepRgb, false),
      rgb: stepRgb,
      oklch: stepOklch,
      isBase: false,
    };
  });
}

// ============================================================================
// 13. CODE SNIPPET GENERATORS (Tailwind, CSS Variables, JSON Tokens)
// ============================================================================

export function exportToCssVariables(brandName = "brand", shades: ShadeStep[]): string {
  const lines = shades.map((s) => `  --color-${brandName}-${s.step}: ${s.hex};`);
  return `:root {\n${lines.join("\n")}\n}`;
}

export function exportToTailwindV4(brandName = "brand", shades: ShadeStep[]): string {
  const lines = shades.map(
    (s) => `  --color-${brandName}-${s.step}: oklch(${s.oklch.l} ${s.oklch.c} ${s.oklch.h});`
  );
  return `@theme {\n${lines.join("\n")}\n}`;
}

export function exportToTailwindV3(brandName = "brand", shades: ShadeStep[]): string {
  const entries = shades.map((s) => `      ${s.step}: '${s.hex}',`);
  return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        ${brandName}: {\n${entries.join("\n")}\n        },\n      },\n    },\n  },\n};`;
}

export function exportToJsonTokens(brandName = "brand", shades: ShadeStep[]): string {
  const tokens: Record<string, unknown> = {};
  shades.forEach((s) => {
    tokens[`${brandName}-${s.step}`] = {
      value: s.hex,
      type: "color",
      oklch: `oklch(${s.oklch.l} ${s.oklch.c} ${s.oklch.h})`,
    };
  });
  return JSON.stringify({ color: { [brandName]: tokens } }, null, 2);
}
