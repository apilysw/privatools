import bwipjs from "bwip-js";

export type BarcodeCategory = "logistics" | "matrix" | "retail";

export interface SymbologyInfo {
  id: string;
  name: string;
  category: BarcodeCategory;
  description: string;
  placeholder: string;
  is2D?: boolean;
  defaultOptions: {
    scale: number;
    height?: number;
    includetext: boolean;
  };
}

export const SUPPORTED_SYMBOLOGIES: SymbologyInfo[] = [
  // Logistics & Warehousing
  {
    id: "code128",
    name: "Code 128",
    category: "logistics",
    description: "High-density alphanumeric barcode standard for warehouse bins, carton IDs, and shipping labels.",
    placeholder: "AISLE-04-BAY-12-SHELF-B",
    defaultOptions: { scale: 3, height: 12, includetext: true },
  },
  {
    id: "gs1-128",
    name: "GS1-128 / UCC-128",
    category: "logistics",
    description: "Global logistics standard formatting Application Identifiers (AI) like (00) SSCC pallets, (01) GTIN, (10) Batch, and (17) Expiry.",
    placeholder: "(00)300123451234567897",
    defaultOptions: { scale: 3, height: 14, includetext: true },
  },
  {
    id: "itf14",
    name: "ITF-14 (Bearer Bars)",
    category: "logistics",
    description: "Standard 14-digit GTIN-14 outer carton shipping code with protective bearer bars for corrugated packaging.",
    placeholder: "10012345678902",
    defaultOptions: { scale: 3, height: 15, includetext: true },
  },
  {
    id: "code39",
    name: "Code 39",
    category: "logistics",
    description: "Classic industrial and military (MIL-STD) alphanumeric barcode with wide scanning tolerances.",
    placeholder: "PART-8891-B",
    defaultOptions: { scale: 3, height: 12, includetext: true },
  },
  {
    id: "code93",
    name: "Code 93",
    category: "logistics",
    description: "High-density alphanumeric barcode offering compact dimensions and dual checksum security.",
    placeholder: "WH-PALLET-0912",
    defaultOptions: { scale: 3, height: 12, includetext: true },
  },

  // 2D & Matrix
  {
    id: "qrcode",
    name: "QR Code",
    category: "matrix",
    description: "Universal 2D matrix code supporting URLs, Wi-Fi provisioning, vCards, and rack location links.",
    placeholder: "https://privatools.com/dispatch?route=402",
    is2D: true,
    defaultOptions: { scale: 4, includetext: false },
  },
  {
    id: "datamatrix",
    name: "Data Matrix",
    category: "matrix",
    description: "High-density 2D code for Direct Part Marking (DPM), electronics, healthcare, and aerospace serialization.",
    placeholder: "PART-9942-LOT-88B-SN0412",
    is2D: true,
    defaultOptions: { scale: 4, includetext: false },
  },
  {
    id: "pdf417",
    name: "PDF417",
    category: "matrix",
    description: "Stacked 2D barcode for Bills of Lading (BOL), logistics manifests, government IDs, and hazardous transit placards.",
    placeholder: "MANIFEST|BOL-849201|WEIGHT-450KG|CARRIER-FEDEX",
    is2D: true,
    defaultOptions: { scale: 3, height: 10, includetext: false },
  },
  {
    id: "azteccode",
    name: "Aztec Code",
    category: "matrix",
    description: "High-efficiency 2D matrix with central bullseye finder, widely used in transit ticketing and compact tags.",
    placeholder: "TICKET-PASS-77192",
    is2D: true,
    defaultOptions: { scale: 4, includetext: false },
  },

  // Retail & Consumer
  {
    id: "ean13",
    name: "EAN-13",
    category: "retail",
    description: "Standard 13-digit International Article Number for consumer goods and retail point-of-sale worldwide.",
    placeholder: "5901234123457",
    defaultOptions: { scale: 3, height: 15, includetext: true },
  },
  {
    id: "ean8",
    name: "EAN-8",
    category: "retail",
    description: "Compact 8-digit retail barcode for small packages, confectionery, and cosmetic items.",
    placeholder: "96385074",
    defaultOptions: { scale: 3, height: 15, includetext: true },
  },
  {
    id: "upca",
    name: "UPC-A",
    category: "retail",
    description: "Standard 12-digit Universal Product Code used across North American retail products.",
    placeholder: "012345678905",
    defaultOptions: { scale: 3, height: 15, includetext: true },
  },
  {
    id: "upce",
    name: "UPC-E",
    category: "retail",
    description: "Zero-suppressed 8-digit UPC variation for compact consumer goods in North America.",
    placeholder: "01234565",
    defaultOptions: { scale: 3, height: 15, includetext: true },
  },
  {
    id: "rationalizedCodabar",
    name: "Codabar",
    category: "retail",
    description: "Traditional barcode used on air waybills, parcel express tracking, libraries, and medical specimens.",
    placeholder: "A123456789B",
    defaultOptions: { scale: 3, height: 12, includetext: true },
  },
];

export interface BarcodePreset {
  id: string;
  name: string;
  category: string;
  symbology: string;
  text: string;
  description: string;
}

export const DISTRIBUTION_PRESETS: BarcodePreset[] = [
  {
    id: "sscc-pallet",
    name: "SSCC-18 Pallet Label",
    category: "Logistics",
    symbology: "gs1-128",
    text: "(00)300123451234567899",
    description: "Serial Shipping Container Code (SSCC) used worldwide on logistics pallet tags.",
  },
  {
    id: "itf14-carton",
    name: "ITF-14 Master Carton",
    category: "Logistics",
    symbology: "itf14",
    text: "10012345678902",
    description: "14-digit GTIN-14 outer corrugated master shipping case with protective bearer bars.",
  },
  {
    id: "bin-location",
    name: "Warehouse Bin Tag",
    category: "Warehouse",
    symbology: "code128",
    text: "AISLE-04-BAY-12-SHELF-B",
    description: "Rack, bay, and bin location barcode for warehouse pickers and automated sortation.",
  },
  {
    id: "gs1-lot-exp",
    name: "GS1 Product & Expiry",
    category: "Logistics",
    symbology: "gs1-128",
    text: "(01)00012345678905(10)LOT-2026A(17)261231",
    description: "GTIN, batch lot number, and expiration date combined in standard GS1 format.",
  },
  {
    id: "datamatrix-part",
    name: "Serialized Part Tag",
    category: "Manufacturing",
    symbology: "datamatrix",
    text: "PART-9942-LOT-88B-SN0412",
    description: "Direct Part Marking (DPM) high-density 2D matrix for components and serials.",
  },
  {
    id: "retail-ean13",
    name: "EAN-13 Retail Product",
    category: "Retail",
    symbology: "ean13",
    text: "5901234123457",
    description: "Standard global retail point-of-sale barcode for packaging.",
  },
  {
    id: "retail-upca",
    name: "UPC-A Retail Item",
    category: "Retail",
    symbology: "upca",
    text: "012345678905",
    description: "Standard 12-digit North American supermarket item barcode.",
  },
  {
    id: "wifi-scanner",
    name: "Scanner Wi-Fi Setup",
    category: "Config",
    symbology: "qrcode",
    text: "WIFI:T:WPA;S:Warehouse-LAN;P:WhsSecurePass99;;",
    description: "Zero-touch Wi-Fi configuration QR code for rugged warehouse handheld scanners.",
  },
  {
    id: "shipping-manifest",
    name: "Shipping Manifest (PDF417)",
    category: "Logistics",
    symbology: "pdf417",
    text: "MANIFEST|BOL-849201|WEIGHT-450KG|CARRIER-FEDEX",
    description: "Multi-line 2D stacked barcode for carrier bills of lading and dispatch manifests.",
  },
  {
    id: "air-waybill",
    name: "Air Waybill (Codabar)",
    category: "Logistics",
    symbology: "rationalizedCodabar",
    text: "A123456789B",
    description: "Traditional air express freight tracking number with A...B framing.",
  },
];

export interface BarcodeRenderOptions {
  symbology: string;
  text: string;
  scale?: number;
  height?: number;
  includetext?: boolean;
  rotate?: "N" | "R" | "L" | "I";
  barcolor?: string;
  backgroundcolor?: string;
  paddingwidth?: number;
  paddingheight?: number;
  eclevel?: "L" | "M" | "Q" | "H";
}

export interface BarcodeRenderResult {
  svg: string | null;
  error: string | null;
}

/**
 * Generate scalable SVG string for the specified barcode and options.
 */
export function generateBarcodeSVG(opts: BarcodeRenderOptions): BarcodeRenderResult {
  if (!opts.text || opts.text.trim().length === 0) {
    return { svg: null, error: "Please enter text or data to encode." };
  }

  try {
    const is2D = ["qrcode", "datamatrix", "pdf417", "azteccode"].includes(opts.symbology);

    // Normalize colors (bwip-js expects RRGGBB hex without the leading #)
    const cleanHex = (c?: string) => (c ? c.replace("#", "") : undefined);

    const bwipOptions: Parameters<typeof bwipjs.toSVG>[0] = {
      bcid: opts.symbology,
      text: opts.text,
      scale: opts.scale ?? 3,
      includetext: is2D ? false : (opts.includetext ?? true),
      rotate: opts.rotate ?? "N",
      barcolor: cleanHex(opts.barcolor) || "000000",
      paddingwidth: opts.paddingwidth ?? 10,
      paddingheight: opts.paddingheight ?? 10,
    };

    if (!is2D) {
      bwipOptions.height = opts.height ?? 12;
    }

    if (opts.backgroundcolor && opts.backgroundcolor !== "transparent") {
      bwipOptions.backgroundcolor = cleanHex(opts.backgroundcolor);
    }

    if (opts.symbology === "qrcode" && opts.eclevel) {
      bwipOptions.eclevel = opts.eclevel;
    }

    if (opts.symbology === "gs1-128") {
      // Enable parsing for human-readable parenthesized AIs like (01) or (00)
      bwipOptions.parse = true;
      bwipOptions.parsefnc = true;
    }

    const svg = bwipjs.toSVG(bwipOptions);
    return { svg, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      svg: null,
      error: sanitizeBarcodeErrorMessage(opts.symbology, message),
    };
  }
}

/**
 * Provide helpful context-aware error hints for common barcode constraints.
 */
function sanitizeBarcodeErrorMessage(symbology: string, raw: string): string {
  if (symbology === "ean13") {
    return `EAN-13 requires exactly 12 or 13 numeric digits with valid modulo-10 check digit. (${raw})`;
  }
  if (symbology === "upca") {
    return `UPC-A requires exactly 11 or 12 numeric digits with valid check digit. (${raw})`;
  }
  if (symbology === "itf14") {
    return `ITF-14 requires exactly 13 or 14 numeric digits with valid check digit. (${raw})`;
  }
  if (symbology === "ean8") {
    return `EAN-8 requires exactly 7 or 8 numeric digits. (${raw})`;
  }
  if (symbology === "upce") {
    return `UPC-E requires 6, 7, or 8 digits. (${raw})`;
  }
  return raw;
}

/**
 * Convert SVG string to a high-resolution PNG data URL for downloading or copying.
 */
export async function svgToPngDataUrl(
  svgString: string,
  scaleMultiplier: number = 3
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Parse dimensions from SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElem = doc.querySelector("svg");
    if (!svgElem) {
      return reject(new Error("Invalid SVG string"));
    }

    const viewBox = svgElem.getAttribute("viewBox");
    let width = 300;
    let height = 150;

    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        width = parts[2];
        height = parts[3];
      }
    } else {
      width = parseFloat(svgElem.getAttribute("width") || "300");
      height = parseFloat(svgElem.getAttribute("height") || "150");
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scaleMultiplier);
    canvas.height = Math.round(height * scaleMultiplier);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return reject(new Error("Failed to acquire 2D canvas context"));
    }

    const img = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.imageSmoothingEnabled = false; // Sharp barcode edges
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to render SVG onto canvas: " + String(e)));
    };

    img.src = url;
  });
}

/**
 * Convert SVG string to PNG Blob (useful for clipboard copy).
 */
export async function svgToPngBlob(
  svgString: string,
  scaleMultiplier: number = 3
): Promise<Blob> {
  const dataUrl = await svgToPngDataUrl(svgString, scaleMultiplier);
  const res = await fetch(dataUrl);
  return await res.blob();
}

/**
 * GS1 Application Identifier (AI) Dictionary and Parser
 */
export interface GS1ParsedField {
  ai: string;
  name: string;
  value: string;
  humanized?: string;
  description: string;
}

const GS1_AI_DICTIONARY: Record<string, { name: string; desc: string }> = {
  "00": { name: "SSCC", desc: "Serial Shipping Container Code (Pallet ID)" },
  "01": { name: "GTIN", desc: "Global Trade Item Number" },
  "02": { name: "Contained GTIN", desc: "GTIN of Contained Trade Items" },
  "10": { name: "Batch / Lot", desc: "Batch or Lot Number" },
  "11": { name: "Prod Date", desc: "Production Date (YYMMDD)" },
  "12": { name: "Due Date", desc: "Due Date for Payment / Fulfillment (YYMMDD)" },
  "13": { name: "Pack Date", desc: "Packaging Date (YYMMDD)" },
  "15": { name: "Best Before", desc: "Best Before Date (YYMMDD)" },
  "17": { name: "Expiration", desc: "Expiration Date (YYMMDD)" },
  "20": { name: "Variant", desc: "Internal Product Variant" },
  "21": { name: "Serial Number", desc: "Unique Serial Number" },
  "30": { name: "Count", desc: "Variable Count of Items" },
  "37": { name: "Quantity", desc: "Number of Units Contained" },
  "400": { name: "Customer PO", desc: "Customer Purchase Order Number" },
  "410": { name: "Ship To GLN", desc: "Ship to / Deliver to Global Location Number" },
  "414": { name: "Physical GLN", desc: "Identification of a Physical Location GLN" },
  "420": { name: "Postal Code", desc: "Ship-to / Deliver-to Postal Code" },
  "8005": { name: "Price Per Unit", desc: "Price per Unit of Measure" },
};

/**
 * Parse date in YYMMDD format into human readable string
 */
function parseGS1Date(yymmdd: string): string {
  if (yymmdd.length !== 6 || !/^\d{6}$/.test(yymmdd)) return yymmdd;
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  const dd = parseInt(yymmdd.slice(4, 6), 10);
  const fullYear = yy >= 50 ? 1900 + yy : 2000 + yy;
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const monthStr = monthNames[mm - 1] || `${mm}`;
  return `${monthStr} ${dd === 0 ? "end of month" : dd}, ${fullYear}`;
}

/**
 * Parse GS1 formatted string (with parenthesized AIs or standard format)
 */
export function parseGS1Payload(text: string): GS1ParsedField[] {
  const results: GS1ParsedField[] = [];
  const parenthesizedRegex = /\((\d{2,4})\)([^()]+)/g;
  let match: RegExpExecArray | null;

  while ((match = parenthesizedRegex.exec(text)) !== null) {
    const ai = match[1];
    const value = match[2].trim();
    const info = GS1_AI_DICTIONARY[ai] || {
      name: `AI (${ai})`,
      desc: "Custom or Industry Application Identifier",
    };

    let humanized: string | undefined = undefined;
    if (["11", "12", "13", "15", "17"].includes(ai) && value.length === 6) {
      humanized = parseGS1Date(value);
    }

    results.push({
      ai,
      name: info.name,
      value,
      humanized,
      description: info.desc,
    });
  }

  return results;
}

/**
 * Wi-Fi QR Code Config Parser
 */
export interface WiFiConfig {
  ssid: string;
  security: string;
  password?: string;
  hidden?: boolean;
}

export function parseWiFiQR(text: string): WiFiConfig | null {
  if (!text.startsWith("WIFI:")) return null;
  const content = text.slice(5);
  const fields = content.split(";");
  const config: Partial<WiFiConfig> = {};

  for (const field of fields) {
    if (!field.trim()) continue;
    const [key, ...valParts] = field.split(":");
    const val = valParts.join(":");
    if (key === "S") config.ssid = val;
    else if (key === "T") config.security = val;
    else if (key === "P") config.password = val;
    else if (key === "H") config.hidden = val === "true";
  }

  if (!config.ssid) return null;
  return {
    ssid: config.ssid,
    security: config.security || "WPA",
    password: config.password,
    hidden: config.hidden ?? false,
  };
}
