"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  QrCode,
  Layers,
  Scan,
  Camera,
  Upload,
  Download,
  Copy,
  Check,
  Printer,
  RotateCw,
  ShieldCheck,
  Trash2,
  ExternalLink,
  AlertCircle,
  Wifi,
  Package,
  Boxes,
  Barcode as BarcodeIcon,
  Tag,
  Eye,
  Settings2,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import {
  SUPPORTED_SYMBOLOGIES,
  DISTRIBUTION_PRESETS,
  generateBarcodeSVG,
  svgToPngDataUrl,
  svgToPngBlob,
  parseGS1Payload,
  parseWiFiQR,
  GS1ParsedField,
  WiFiConfig,
  BarcodePreset,
} from "@/lib/converters/barcode";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/library";

type ActiveTab = "single" | "batch" | "scan";

export default function QRStudioPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("single");
  const [activePreset, setActivePreset] = useState<string | null>("sscc-pallet");

  // Single Barcode State
  const [symbology, setSymbology] = useState<string>("gs1-128");
  const [inputText, setInputText] = useState<string>("(00)300123451234567899");
  const [scale, setScale] = useState<number>(3);
  const [height, setHeight] = useState<number>(14);
  const [includeText, setIncludeText] = useState<boolean>(true);
  const [rotate, setRotate] = useState<"N" | "R" | "L" | "I">("N");
  const [barColor, setBarColor] = useState<string>("#000000");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [ecLevel, setEcLevel] = useState<"L" | "M" | "Q" | "H">("M");

  // Single Generation Output
  const [svgOutput, setSvgOutput] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied-svg" | "copied-png">("idle");

  // Batch Generation State
  const [batchInput, setBatchInput] = useState<string>(
    "AISLE-01-BAY-04-A\nAISLE-01-BAY-04-B\nAISLE-01-BAY-05-A\nAISLE-01-BAY-05-B\nAISLE-02-BAY-01-A\nAISLE-02-BAY-01-B"
  );
  const [batchSymbology, setBatchSymbology] = useState<string>("code128");
  const [batchColumns, setBatchColumns] = useState<number>(2);
  const [batchShowText, setBatchShowText] = useState<boolean>(true);

  // Scanner & Decoder State
  const [scanMethod, setScanMethod] = useState<"upload" | "camera">("upload");
  const [scanResult, setScanResult] = useState<{
    text: string;
    format: string;
    gs1: GS1ParsedField[];
    wifi: WiFiConfig | null;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameras, setCameras] = useState<Array<{ deviceId: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [copiedDecoded, setCopiedDecoded] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Active symbology details
  const activeSymbologyInfo = useMemo(() => {
    return (
      SUPPORTED_SYMBOLOGIES.find((s) => s.id === symbology) || SUPPORTED_SYMBOLOGIES[0]
    );
  }, [symbology]);

  // Generate single barcode whenever inputs change
  useEffect(() => {
    if (!inputText.trim()) {
      setSvgOutput(null);
      setRenderError(null);
      return;
    }

    const res = generateBarcodeSVG({
      symbology,
      text: inputText,
      scale,
      height,
      includetext: includeText,
      rotate,
      barcolor: barColor,
      backgroundcolor: bgColor === "transparent" ? undefined : bgColor,
      eclevel: activeSymbologyInfo.is2D ? ecLevel : undefined,
    });

    if (res.error) {
      setRenderError(res.error);
      setSvgOutput(null);
    } else {
      setRenderError(null);
      setSvgOutput(res.svg);
    }
  }, [symbology, inputText, scale, height, includeText, rotate, barColor, bgColor, ecLevel, activeSymbologyInfo]);

  // Handle Preset selection
  const handleSelectPreset = (preset: BarcodePreset) => {
    setActivePreset(preset.id);
    setSymbology(preset.symbology);
    setInputText(preset.text);
    const symbInfo = SUPPORTED_SYMBOLOGIES.find((s) => s.id === preset.symbology);
    if (symbInfo) {
      setScale(symbInfo.defaultOptions.scale);
      if (symbInfo.defaultOptions.height) setHeight(symbInfo.defaultOptions.height);
      setIncludeText(symbInfo.defaultOptions.includetext);
    }
  };

  // Handle Clear
  const handleClear = () => {
    setInputText("");
    setActivePreset(null);
    setSvgOutput(null);
    setRenderError(null);
  };

  // Export SVG file
  const handleDownloadSVG = () => {
    if (!svgOutput) return;
    const blob = new Blob([svgOutput], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcode-${symbology}-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export 300 DPI PNG file
  const handleDownloadPNG = async () => {
    if (!svgOutput) return;
    try {
      const dataUrl = await svgToPngDataUrl(svgOutput, 4); // 4x scale for print density
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `barcode-${symbology}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to export PNG:", err);
    }
  };

  // Copy SVG to clipboard
  const handleCopySVG = async () => {
    if (!svgOutput) return;
    try {
      await navigator.clipboard.writeText(svgOutput);
      setCopyStatus("copied-svg");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to copy SVG:", err);
    }
  };

  // Copy PNG image to clipboard
  const handleCopyPNG = async () => {
    if (!svgOutput) return;
    try {
      const blob = await svgToPngBlob(svgOutput, 3);
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({ "image/png": blob }),
        ]);
        setCopyStatus("copied-png");
        setTimeout(() => setCopyStatus("idle"), 2000);
      } else {
        await handleCopySVG();
      }
    } catch (err) {
      console.error("Clipboard PNG copy failed:", err);
      await handleCopySVG();
    }
  };

  // Print Barcode Label
  const handlePrint = () => {
    window.print();
  };

  // Batch Generation Items
  const batchItems = useMemo(() => {
    return batchInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [batchInput]);

  const batchResults = useMemo(() => {
    return batchItems.map((text) => {
      const res = generateBarcodeSVG({
        symbology: batchSymbology,
        text,
        scale: 2,
        height: 10,
        includetext: batchShowText,
        barcolor: "#000000",
        paddingwidth: 6,
        paddingheight: 6,
      });
      return { text, svg: res.svg, error: res.error };
    });
  }, [batchItems, batchSymbology, batchShowText]);

  // Scanner: Initialize and decode image file
  const decodeImageFile = useCallback(async (file: File) => {
    setScanError(null);
    try {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }
      const reader = codeReaderRef.current;
      const imageUrl = URL.createObjectURL(file);
      const result = await reader.decodeFromImageUrl(imageUrl);
      URL.revokeObjectURL(imageUrl);

      const rawText = result.getText();
      const rawFormat = BarcodeFormat[result.getBarcodeFormat()] || "UNKNOWN";
      const gs1 = parseGS1Payload(rawText);
      const wifi = parseWiFiQR(rawText);

      setScanResult({
        text: rawText,
        format: rawFormat,
        gs1,
        wifi,
      });
    } catch (err) {
      console.warn("Decoding failed:", err);
      setScanError(
        "No recognizable barcode or QR code found in this image. Ensure the barcode is sharp, well-lit, and not heavily cropped."
      );
      setScanResult(null);
    }
  }, []);

  // Handle Drag & Drop / File Input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      decodeImageFile(file);
    }
  };

  // Handle Clipboard Paste of Images (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== "scan") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            decodeImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeTab, decodeImageFile]);

  // Handle Camera Scanning
  const startCamera = async () => {
    setScanError(null);
    try {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }
      const reader = codeReaderRef.current;
      const videoInputDevices = await reader.listVideoInputDevices();

      if (!videoInputDevices || videoInputDevices.length === 0) {
        setScanError("No video camera devices found on this system.");
        return;
      }

      setCameras(
        videoInputDevices.map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }))
      );

      const deviceIdToUse = selectedCameraId || videoInputDevices[0].deviceId;
      setSelectedCameraId(deviceIdToUse);
      setIsScanning(true);

      reader.decodeFromVideoDevice(
        deviceIdToUse,
        videoRef.current,
        (result, err) => {
          if (result) {
            const rawText = result.getText();
            const rawFormat = BarcodeFormat[result.getBarcodeFormat()] || "UNKNOWN";
            const gs1 = parseGS1Payload(rawText);
            const wifi = parseWiFiQR(rawText);

            setScanResult({
              text: rawText,
              format: rawFormat,
              gs1,
              wifi,
            });

            // Stop camera on successful scan
            reader.reset();
            setIsScanning(false);
          }
          if (err && !(err.name === "NotFoundException")) {
            // normal scanning non-match frame
          }
        }
      );
    } catch (err) {
      console.error("Camera access failed:", err);
      setScanError("Camera access was denied or could not be initialized.");
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
  };

  // Cleanup scanner on unmount or tab switch
  useEffect(() => {
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "scan") {
      stopCamera();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <ToolHeader
        title="Offline QR Code & Barcode Studio"
        description="Generate, customize, batch print, and decode 1D/2D barcodes for warehousing, distribution, retail, and logistics. 100% in-browser with zero data egress."
        badge="Zero Egress"
      />

      {/* Distribution Presets Block (matches cert-inspector & diff-viewer) */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mr-1 flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5 text-zinc-400" />
            Sample Barcodes:
          </span>
          {DISTRIBUTION_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveTab("single");
                handleSelectPreset(p);
              }}
              title={p.description}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                activePreset === p.id && activeTab === "single"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleClear}
          className="shrink-0 whitespace-nowrap self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Input</span>
        </button>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 print:hidden">
        <button
          onClick={() => setActiveTab("single")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "single"
              ? "bg-emerald-500 text-white shadow-sm font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <BarcodeIcon className="w-4 h-4" />
          <span>Single Studio</span>
        </button>

        <button
          onClick={() => setActiveTab("batch")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "batch"
              ? "bg-emerald-500 text-white shadow-sm font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Batch Label Generator</span>
        </button>

        <button
          onClick={() => setActiveTab("scan")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "scan"
              ? "bg-emerald-500 text-white shadow-sm font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Scan className="w-4 h-4" />
          <span>Scan & Decode</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SINGLE STUDIO */}
      {/* ========================================================================= */}
      {activeTab === "single" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-6 space-y-5">
            {/* Symbology Selector */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Barcode Symbology
                </label>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {activeSymbologyInfo.category.toUpperCase()}
                </span>
              </div>

              <select
                value={symbology}
                onChange={(e) => {
                  setSymbology(e.target.value);
                  setActivePreset(null);
                  const info = SUPPORTED_SYMBOLOGIES.find((s) => s.id === e.target.value);
                  if (info) {
                    setScale(info.defaultOptions.scale);
                    if (info.defaultOptions.height) setHeight(info.defaultOptions.height);
                    setIncludeText(info.defaultOptions.includetext);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <optgroup label="Warehousing & Logistics (1D)">
                  {SUPPORTED_SYMBOLOGIES.filter((s) => s.category === "logistics").map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="2D Matrix & High-Density">
                  {SUPPORTED_SYMBOLOGIES.filter((s) => s.category === "matrix").map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Retail & Point of Sale (POS)">
                  {SUPPORTED_SYMBOLOGIES.filter((s) => s.category === "retail").map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              </select>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {activeSymbologyInfo.description}
              </p>
            </div>

            {/* Payload Input */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Barcode Data / Payload
                </label>
                <span className="text-xs text-zinc-400 font-mono">
                  {inputText.length} chars
                </span>
              </div>

              {symbology === "qrcode" || symbology === "pdf417" ? (
                <textarea
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setActivePreset(null);
                  }}
                  rows={3}
                  placeholder={activeSymbologyInfo.placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              ) : (
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setActivePreset(null);
                  }}
                  placeholder={activeSymbologyInfo.placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              )}

              {/* Context Hint for GS1-128 */}
              {symbology === "gs1-128" && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60 space-y-1">
                  <div className="font-semibold text-zinc-700 dark:text-zinc-300">
                    GS1 Application Identifiers (AI) Format:
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-zinc-500">
                    <span>(00) SSCC Pallet (18 dig)</span>
                    <span>(01) GTIN Trade Item (14 dig)</span>
                    <span>(10) Batch / Lot Number</span>
                    <span>(17) Expiration Date (YYMMDD)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Design & Dimensions Controls */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Layout & Dimensions</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Scale Multiplier */}
                <div>
                  <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                    <span>Scale / Width:</span>
                    <span className="font-semibold">{scale}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Height (for 1D codes) */}
                {!activeSymbologyInfo.is2D && (
                  <div>
                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                      <span>Bar Height:</span>
                      <span className="font-semibold">{height}mm</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                )}

                {/* QR Error Correction */}
                {symbology === "qrcode" && (
                  <div>
                    <span className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                      Error Correction:
                    </span>
                    <select
                      value={ecLevel}
                      onChange={(e) => setEcLevel(e.target.value as "L" | "M" | "Q" | "H")}
                      className="w-full px-2 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="L">L (7% recovery)</option>
                      <option value="M">M (15% recovery)</option>
                      <option value="Q">Q (25% recovery)</option>
                      <option value="H">H (30% recovery - best for logos/wear)</option>
                    </select>
                  </div>
                )}

                {/* Orientation / Rotation */}
                <div>
                  <span className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                    Orientation:
                  </span>
                  <select
                    value={rotate}
                    onChange={(e) => setRotate(e.target.value as "N" | "R" | "L" | "I")}
                    className="w-full px-2 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="N">Normal (0°)</option>
                    <option value="R">Clockwise (90°)</option>
                    <option value="I">Inverted (180°)</option>
                    <option value="L">Counter-Clockwise (270°)</option>
                  </select>
                </div>
              </div>

              {/* Toggles & Color Selection */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
                {!activeSymbologyInfo.is2D && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={includeText}
                      onChange={(e) => setIncludeText(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>Human-Readable Text Line</span>
                  </label>
                )}

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Bars:</span>
                    <input
                      type="color"
                      value={barColor}
                      onChange={(e) => setBarColor(e.target.value)}
                      className="w-6 h-6 rounded border-0 p-0 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Bg:</span>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-6 h-6 rounded border-0 p-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Preview & Export Column */}
          <div className="lg:col-span-6 space-y-5">
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col items-center justify-center min-h-[380px] relative">
              <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <Eye className="w-3.5 h-3.5" />
                <span>Live Barcode Preview</span>
              </div>

              {/* Error Message */}
              {renderError ? (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 max-w-md text-center space-y-2 my-auto">
                  <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
                  <div className="text-xs font-semibold text-red-700 dark:text-red-400">
                    Encoding Validation Error
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-300 font-mono leading-relaxed">
                    {renderError}
                  </p>
                </div>
              ) : svgOutput ? (
                <div className="my-auto p-6 rounded-xl bg-white border border-zinc-100 shadow-inner flex items-center justify-center overflow-auto max-w-full">
                  <div
                    dangerouslySetInnerHTML={{ __html: svgOutput }}
                    className="flex items-center justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                  />
                </div>
              ) : (
                <div className="text-center text-zinc-400 space-y-2 my-auto">
                  <BarcodeIcon className="w-12 h-12 stroke-[1.2] mx-auto text-zinc-300 dark:text-zinc-600" />
                  <p className="text-xs">Enter text or select a preset to generate a barcode.</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {svgOutput && !renderError && (
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Export & Print Actions
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={handleDownloadSVG}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors text-xs font-medium"
                  >
                    <Download className="w-4 h-4 text-emerald-500" />
                    <span>Download SVG</span>
                  </button>

                  <button
                    onClick={handleDownloadPNG}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors text-xs font-medium"
                  >
                    <Download className="w-4 h-4 text-blue-500" />
                    <span>High-Res PNG</span>
                  </button>

                  <button
                    onClick={handleCopyPNG}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors text-xs font-medium"
                  >
                    {copyStatus === "copied-png" ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-zinc-500" />
                    )}
                    <span>{copyStatus === "copied-png" ? "Copied!" : "Copy Image"}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors text-xs font-medium"
                  >
                    <Printer className="w-4 h-4 text-purple-500" />
                    <span>Print Label</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BATCH LABEL GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === "batch" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  Multi-Code Batch Label Generator
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Generate and print warehouse rack tags, bin cards, or serial number sheets in bulk.
                </p>
              </div>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
              >
                <Printer className="w-4 h-4" />
                <span>Print Label Sheet ({batchItems.length} Labels)</span>
              </button>
            </div>

            {/* Batch Configuration Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Symbology:
                </label>
                <select
                  value={batchSymbology}
                  onChange={(e) => setBatchSymbology(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="code128">Code 128 (Bin & Asset Tags)</option>
                  <option value="gs1-128">GS1-128 (Logistics & SSCC)</option>
                  <option value="itf14">ITF-14 (Master Cartons)</option>
                  <option value="qrcode">QR Code (2D Links & Wi-Fi)</option>
                  <option value="datamatrix">Data Matrix (Parts & Serials)</option>
                  <option value="ean13">EAN-13 (Retail Packaging)</option>
                  <option value="code39">Code 39 (Alphanumeric)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Print Columns per Row:
                </label>
                <select
                  value={batchColumns}
                  onChange={(e) => setBatchColumns(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  <option value={1}>1 Column (Full Width Pallet Tags)</option>
                  <option value={2}>2 Columns (Avery 2-up Shelf Cards)</option>
                  <option value={3}>3 Columns (Compact Bin Tags)</option>
                  <option value={4}>4 Columns (Small Part & Specimen Tags)</option>
                </select>
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={batchShowText}
                    onChange={(e) => setBatchShowText(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span>Show Text Under Barcode</span>
                </label>
              </div>
            </div>

            {/* Textarea for list of items */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Enter or Paste Items (One Per Line):
                </label>
                <span className="text-xs text-zinc-400 font-mono">
                  {batchItems.length} items detected
                </span>
              </div>
              <textarea
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Generated Label Sheet Grid */}
          <div
            className={`grid gap-4 ${
              batchColumns === 1
                ? "grid-cols-1"
                : batchColumns === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : batchColumns === 3
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            }`}
          >
            {batchResults.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col items-center justify-between text-center page-break-inside-avoid print:border-zinc-400 print:shadow-none"
              >
                <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 truncate max-w-full">
                  #{idx + 1}: {item.text}
                </div>

                {item.error ? (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl text-red-600 text-[11px]">
                    {item.error}
                  </div>
                ) : item.svg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: item.svg }}
                    className="my-auto py-2 [&>svg]:max-w-full [&>svg]:h-auto flex items-center justify-center"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SCAN & DECODE */}
      {/* ========================================================================= */}
      {activeTab === "scan" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Scanner Input Options */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Input Method
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setScanMethod("upload");
                      stopCamera();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      scanMethod === "upload"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    Image Drop & Paste
                  </button>
                  <button
                    onClick={() => {
                      setScanMethod("camera");
                      startCamera();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      scanMethod === "camera"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    Live Camera
                  </button>
                </div>
              </div>

              {/* Upload & Dropzone Area */}
              {scanMethod === "upload" && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) decodeImageFile(file);
                  }}
                  className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-colors space-y-3 bg-zinc-50 dark:bg-zinc-800/40"
                >
                  <Upload className="w-8 h-8 mx-auto text-zinc-400" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Drop shipping label photo or click to browse
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Supports PNG, JPG, WebP, SVG. You can also paste screenshots directly with <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-[10px] font-mono">Ctrl+V</kbd>.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Camera Scanner View */}
              {scanMethod === "camera" && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                    />
                    {/* Viewfinder reticle */}
                    <div className="absolute inset-0 border-2 border-emerald-500/40 pointer-events-none m-8 rounded-xl flex items-center justify-center">
                      <div className="w-12 h-12 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0" />
                      <div className="w-12 h-12 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0" />
                      <div className="w-12 h-12 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0" />
                      <div className="w-12 h-12 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {cameras.length > 1 && (
                      <select
                        value={selectedCameraId}
                        onChange={(e) => {
                          setSelectedCameraId(e.target.value);
                          stopCamera();
                          setTimeout(startCamera, 100);
                        }}
                        className="px-3 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      >
                        {cameras.map((c) => (
                          <option key={c.deviceId} value={c.deviceId}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {isScanning ? (
                      <button
                        onClick={stopCamera}
                        className="px-3 py-1.5 text-xs font-medium rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 transition-colors ml-auto"
                      >
                        Stop Camera
                      </button>
                    ) : (
                      <button
                        onClick={startCamera}
                        className="px-3 py-1.5 text-xs font-medium rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors ml-auto"
                      >
                        Resume Camera
                      </button>
                    )}
                  </div>
                </div>
              )}

              {scanError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{scanError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Decoded Inspection Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Decoded Barcode Details
                </span>
                {scanResult && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {scanResult.format}
                  </span>
                )}
              </div>

              {scanResult ? (
                <div className="space-y-4">
                  {/* Raw Payload Card */}
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Raw Decoded Payload:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(scanResult.text);
                          setCopiedDecoded(true);
                          setTimeout(() => setCopiedDecoded(false), 2000);
                        }}
                        className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline text-xs"
                      >
                        {copiedDecoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDecoded ? "Copied" : "Copy Payload"}</span>
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap break-all">
                      {scanResult.text}
                    </pre>
                  </div>

                  {/* GS1 Application Identifier Breakdown */}
                  {scanResult.gs1.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Parsed GS1 Logistics Identifiers:</span>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                              <th className="p-2.5">AI</th>
                              <th className="p-2.5">Identifier</th>
                              <th className="p-2.5">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {scanResult.gs1.map((f, i) => (
                              <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                  ({f.ai})
                                </td>
                                <td className="p-2.5 font-medium text-zinc-800 dark:text-zinc-200">
                                  <div>{f.name}</div>
                                  <div className="text-[10px] text-zinc-400">{f.description}</div>
                                </td>
                                <td className="p-2.5 font-mono text-zinc-900 dark:text-zinc-100">
                                  <div>{f.value}</div>
                                  {f.humanized && (
                                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                      {f.humanized}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Wi-Fi Config Breakdown */}
                  {scanResult.wifi && (
                    <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
                      <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5" />
                        <span>Wi-Fi Network Credentials</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-zinc-400 block text-[11px]">Network SSID:</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                            {scanResult.wifi.ssid}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block text-[11px]">Security:</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                            {scanResult.wifi.security}
                          </span>
                        </div>
                        {scanResult.wifi.password && (
                          <div className="col-span-2">
                            <span className="text-zinc-400 block text-[11px]">Password:</span>
                            <span className="font-mono text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 inline-block">
                              {scanResult.wifi.password}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-zinc-400 space-y-2">
                  <Scan className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600 stroke-[1.2]" />
                  <p className="text-xs">
                    Drop a barcode photo or start the camera to inspect decoded contents.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Privacy Guarantee Callout */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3 print:hidden">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Zero Data Egress Guarantee:
          </span>{" "}
          All barcode vector rendering and camera decoding run strictly within your local browser memory using client-side JavaScript. Neither barcode payloads, scanned camera frames, nor warehouse serials are ever transmitted to any external server.
        </div>
      </div>
    </div>
  );
}
