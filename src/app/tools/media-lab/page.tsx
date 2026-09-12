"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Camera,
  ShieldCheck,
  MapPin,
  FileSpreadsheet,
  Trash2,
  Download,
  Upload,
  Layers,
  AlertTriangle,
  CheckCircle2,
  FileImage,
  Music,
  Play,
  Pause,
  ExternalLink,
  Scissors,
  Check,
  Search,
  Crosshair,
  RefreshCw,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import {
  inspectImageMetadata,
  scrubImageFile,
  encodeWav,
  extractWaveformPeaks,
  generateSampleGeotaggedJpeg,
  generateSampleAudioWav,
  ParsedMediaMetadata,
  PrivacyRiskReport,
  ScrubResult,
} from "@/lib/converters/media";

type StudioTab = "single" | "batch" | "audio";

interface BatchItem {
  id: string;
  file: File | Blob;
  name: string;
  size: number;
  previewUrl: string;
  metadata?: ParsedMediaMetadata;
  riskReport?: PrivacyRiskReport;
  scrubbed?: ScrubResult;
  status: "analyzing" | "ready" | "cleaning" | "cleaned" | "error";
  error?: string;
}

export default function MediaLabPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>("single");
  const [activePreset, setActivePreset] = useState<string | null>("iphone-gps");

  // Single Image Mode State
  const [singleFile, setSingleFile] = useState<File | Blob | null>(null);
  const [singleFileName, setSingleFileName] = useState<string | null>(null);
  const [singlePreviewUrl, setSinglePreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ParsedMediaMetadata | null>(null);
  const [riskReport, setRiskReport] = useState<PrivacyRiskReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [scrubbedResult, setScrubbedResult] = useState<ScrubResult | null>(null);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<"summary" | "gps" | "hardware" | "raw">("summary");
  const [tagSearchQuery, setTagSearchQuery] = useState<string>("");

  // Batch Mode State
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isBatchScrubbing, setIsBatchScrubbing] = useState<boolean>(false);

  // Audio Mode State
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>("sample_chime.wav");
  const [audioWaveform, setAudioWaveform] = useState<number[]>([]);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(3);
  const [audioDuration, setAudioDuration] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const singleInputRef = useRef<HTMLInputElement | null>(null);
  const batchInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);



  // Clear Input Handler
  const handleClear = () => {
    if (singlePreviewUrl) URL.revokeObjectURL(singlePreviewUrl);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setSingleFile(null);
    setSingleFileName(null);
    setSinglePreviewUrl(null);
    setMetadata(null);
    setRiskReport(null);
    setScrubbedResult(null);
    setBatchItems([]);
    setAudioBuffer(null);
    setAudioWaveform([]);
    setActivePreset(null);
  };

  // Process Single Image
  const processSingleImage = async (file: File | Blob, name?: string) => {
    setIsAnalyzing(true);
    setScrubbedResult(null);
    if (singlePreviewUrl) {
      URL.revokeObjectURL(singlePreviewUrl);
    }

    const url = URL.createObjectURL(file);
    setSingleFile(file);
    setSingleFileName(name || (file instanceof File ? file.name : "image.jpg"));
    setSinglePreviewUrl(url);

    try {
      const { metadata: parsedMeta, riskReport: parsedRisk } =
        await inspectImageMetadata(file);
      setMetadata(parsedMeta);
      setRiskReport(parsedRisk);
    } catch {
      setMetadata(null);
      setRiskReport(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Scrub Single File
  const handleScrubSingle = async (
    targetFormat?: "image/jpeg" | "image/png" | "image/webp"
  ) => {
    if (!singleFile) return;
    setIsScrubbing(true);
    try {
      const res = await scrubImageFile(singleFile, { targetFormat });
      setScrubbedResult(res);
    } catch (err) {
      console.error("Scrubbing failed:", err);
    } finally {
      setIsScrubbing(false);
    }
  };

  // Handle Batch Files
  const handleBatchUpload = async (files: FileList | File[]) => {
    const items: BatchItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      items.push({
        id: `batch-${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        previewUrl,
        status: "analyzing",
      });
    }

    setBatchItems((prev) => [...prev, ...items]);
    setActiveTab("batch");
    setActivePreset(null);

    // Process each item metadata sequentially in RAM
    for (const item of items) {
      try {
        const { metadata: meta, riskReport: risk } = await inspectImageMetadata(
          item.file
        );
        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, metadata: meta, riskReport: risk, status: "ready" }
              : it
          )
        );
      } catch {
        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: "ready" } : it
          )
        );
      }
    }
  };

  // Scrub All Batch Items
  const handleScrubAllBatch = async () => {
    setIsBatchScrubbing(true);
    for (const item of batchItems) {
      if (item.status === "cleaned") continue;
      setBatchItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: "cleaning" } : it
        )
      );

      try {
        const scrubbed = await scrubImageFile(item.file);
        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, scrubbed, status: "cleaned" }
              : it
          )
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed";
        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: "error", error: msg }
              : it
          )
        );
      }
    }
    setIsBatchScrubbing(false);
  };

  // Process Audio File
  const processAudioFile = async (file: File | Blob, name: string) => {
    setAudioFileName(name);
    const arrayBuffer = await file.arrayBuffer();

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioContextClass();
    const decoded = await ctx.decodeAudioData(arrayBuffer);

    setAudioBuffer(decoded);
    setAudioDuration(decoded.duration);
    setTrimStart(0);
    setTrimEnd(Math.min(decoded.duration, 10));

    // Extract peaks for visual waveform
    const channel0 = decoded.getChannelData(0);
    const peaks = extractWaveformPeaks(channel0, 180);
    setAudioWaveform(peaks);

    // Create object url for playback
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const newUrl = URL.createObjectURL(file);
    setAudioUrl(newUrl);
    setIsPlaying(false);
    setPlaybackTime(0);
  };

  // Presets Loader
  const loadSampleGeotaggedPreset = async () => {
    setActivePreset("iphone-gps");
    const bytes = generateSampleGeotaggedJpeg({
      make: "Apple",
      model: "iPhone 16 Pro Max",
      lat: 37.8199,
      lon: -122.4783,
      altitude: 67.5,
      serial: "DN6ZL01Q0D82",
      date: "2026:09:11 14:32:05",
    });
    const blob = new Blob([bytes as unknown as BlobPart], { type: "image/jpeg" });
    processSingleImage(blob, "IMG_4821_GoldenGate.jpg");
  };

  const loadSampleDslrPreset = async () => {
    setActivePreset("dslr-serial");
    const bytes = generateSampleGeotaggedJpeg({
      make: "Canon",
      model: "EOS R5 Mark II",
      lat: 51.5074,
      lon: -0.1278,
      altitude: 18.0,
      serial: "042021003981",
      date: "2026:09:10 11:15:30",
    });
    const blob = new Blob([bytes as unknown as BlobPart], { type: "image/jpeg" });
    processSingleImage(blob, "RAW_2026_StudioMaster.jpg");
  };

  const loadSampleAudioPreset = async () => {
    setActivePreset("audio-synth");
    setActiveTab("audio");
    const wavBytes = generateSampleAudioWav(3);
    const blob = new Blob([wavBytes], { type: "audio/wav" });
    await processAudioFile(blob, "ambient_chime_sample.wav");
  };

  // Load Initial Geotagged Sample Preset
  useEffect(() => {
    let active = true;
    requestAnimationFrame(() => {
      if (active) loadSampleGeotaggedPreset();
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Export Trimmed Audio WAV
  const handleExportTrimmedAudio = () => {
    if (!audioBuffer) return;
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(trimStart * sampleRate);
    const endSample = Math.floor(trimEnd * sampleRate);

    const channels: Float32Array[] = [];
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const full = audioBuffer.getChannelData(c);
      channels.push(full.subarray(startSample, endSample));
    }

    const wavBuffer = encodeWav(channels, sampleRate);
    const blob = new Blob([wavBuffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trimmed_${audioFileName.replace(/\.[^/.]+$/, "")}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Draw Audio Waveform on Canvas
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || audioWaveform.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const barWidth = width / audioWaveform.length;
    const trimStartRatio = audioDuration > 0 ? trimStart / audioDuration : 0;
    const trimEndRatio = audioDuration > 0 ? trimEnd / audioDuration : 1;
    const playheadRatio = audioDuration > 0 ? playbackTime / audioDuration : 0;

    audioWaveform.forEach((peak, i) => {
      const ratio = i / audioWaveform.length;
      const isInsideTrim = ratio >= trimStartRatio && ratio <= trimEndRatio;
      const barHeight = Math.max(3, peak * (height * 0.85));
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      ctx.fillStyle = isInsideTrim ? "#10b981" : "#52525b";
      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
    });

    // Draw Playhead
    const playheadX = playheadRatio * width;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }, [audioWaveform, trimStart, trimEnd, audioDuration, playbackTime]);

  // Audio Playback Listener
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = trimStart;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Filtered raw tags list
  const filteredTags = useMemo(() => {
    if (!metadata?.rawTags) return [];
    const entries = Object.entries(metadata.rawTags);
    if (!tagSearchQuery.trim()) return entries;
    const q = tagSearchQuery.toLowerCase();
    return entries.filter(
      ([k, v]) =>
        k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q)
    );
  }, [metadata, tagSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <ToolHeader
          toolId="media-lab"
          title="Client-Side Media Privacy Lab & Metadata Scrubber"
          description="Audit and purge embedded EXIF, GPS coordinates, camera serials, and device fingerprints from photos. Clean images losslessly with zero recompression, inspect location pins, batch-scrub albums, and trim audio waveforms with 100% in-browser zero egress."
          badge="Zero Egress"
        />
      </div>

      {/* Sample Presets Card (matching cert-inspector, diff-viewer, qr-studio, regex-studio, markdown-lab) */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mr-1 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-zinc-400" />
            Sample Media:
          </span>
          <button
            onClick={loadSampleGeotaggedPreset}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              activePreset === "iphone-gps"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            Geotagged iPhone Photo (High Risk)
          </button>
          <button
            onClick={loadSampleDslrPreset}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              activePreset === "dslr-serial"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            Canon EOS R5 (DSLR & Lens Serial)
          </button>
          <button
            onClick={loadSampleAudioPreset}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              activePreset === "audio-synth"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            Synthesized Audio Chime (Waveform Trimmer)
          </button>
        </div>

        <button
          onClick={handleClear}
          className="shrink-0 whitespace-nowrap self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Input</span>
        </button>
      </div>

      {/* Primary Mode Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden">
        <button
          onClick={() => setActiveTab("single")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === "single"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <FileImage className="w-4 h-4" />
          <span>Photo Metadata & Single Scrubber</span>
        </button>

        <button
          onClick={() => setActiveTab("batch")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === "batch"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Batch Photo Scrubber</span>
          {batchItems.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
              {batchItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("audio")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === "audio"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Audio Waveform & Privacy Trimmer</span>
        </button>
      </div>

      {/* MODE 1: Single Photo Inspector & Scrubber */}
      {activeTab === "single" && (
        <div className="space-y-6">
          {/* Top Dropzone */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <input
              ref={singleInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/tiff,image/heic,image/avif"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  processSingleImage(f);
                  setActivePreset(null);
                }
              }}
              className="hidden"
            />
            <div
              onClick={() => singleInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-800/30"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Drop a photo here, or click to browse
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Supports JPEG, PNG, WebP, TIFF, and AVIF. All EXIF & GPS processing runs 100% in RAM.
              </p>
            </div>
          </div>

          {/* Main Inspector Grid */}
          {singleFile && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Image Preview & Risk Score */}
              <div className="lg:col-span-4 space-y-6">
                {/* Visual Preview */}
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 truncate" title={singleFileName || undefined}>
                      {singleFileName || "Original Image"}
                    </span>
                    <span className="text-xs font-mono text-zinc-400 shrink-0">
                      {(singleFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  {isAnalyzing ? (
                    <div className="relative rounded-xl overflow-hidden bg-zinc-950 aspect-video flex flex-col items-center justify-center border border-zinc-800 gap-2 text-xs text-zinc-400">
                      <span className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent" />
                      <span>Analyzing EXIF & GPS metadata...</span>
                    </div>
                  ) : singlePreviewUrl && (
                    <div className="relative rounded-xl overflow-hidden bg-zinc-950 aspect-video flex items-center justify-center border border-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={singlePreviewUrl}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}

                  {/* Privacy Risk Badge */}
                  {riskReport && (
                    <div
                      className={`p-4 rounded-xl border ${
                        riskReport.score === "High"
                          ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
                          : riskReport.score === "Medium"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {riskReport.score === "High" ? (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        ) : riskReport.score === "Medium" ? (
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        ) : (
                          <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        )}
                        <span className="font-bold text-sm">
                          Privacy Risk Level: {riskReport.score}
                        </span>
                      </div>

                      <ul className="space-y-1 text-xs">
                        {riskReport.risks.length > 0 ? (
                          riskReport.risks.map((r, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-red-500">•</span>
                              <span>{r}</span>
                            </li>
                          ))
                        ) : (
                          <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Check className="w-4 h-4" />
                            <span>No sensitive metadata or coordinates detected.</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Scrub Actions */}
                  <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
                      One-Click Scrubbing
                    </span>

                    <button
                      onClick={() => handleScrubSingle()}
                      disabled={isScrubbing}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isScrubbing ? "Scrubbing in RAM..." : "Lossless Strip All Metadata"}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleScrubSingle("image/webp")}
                        disabled={isScrubbing}
                        className="py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Clean as WebP</span>
                      </button>

                      <button
                        onClick={() => handleScrubSingle("image/png")}
                        disabled={isScrubbing}
                        className="py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Clean as PNG</span>
                      </button>
                    </div>
                  </div>

                  {/* Cleaned Result Card */}
                  {scrubbedResult && (
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs space-y-2">
                      <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Metadata Stripped!
                        </span>
                        <span>{scrubbedResult.durationMs.toFixed(1)} ms</span>
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-400 space-y-1">
                        <p>Format: <span className="font-mono text-zinc-800 dark:text-zinc-200">{scrubbedResult.format}</span></p>
                        <p>Cleaned Size: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{(scrubbedResult.scrubbedSize / 1024).toFixed(1)} KB</span></p>
                        {scrubbedResult.savedBytes > 0 && (
                          <p>Removed: <span className="font-mono text-zinc-500">{(scrubbedResult.savedBytes / 1024).toFixed(1)} KB metadata overhead</span></p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const url = URL.createObjectURL(scrubbedResult.blob);
                          const a = document.createElement("a");
                          a.href = url;
                          const fileName = singleFileName || (singleFile instanceof File ? singleFile.name : "image.jpg");
                          a.download = `scrubbed_${fileName}`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="w-full mt-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Clean File</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Categorized Metadata Deep-Dive */}
              <div className="lg:col-span-8 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                {/* Sub-Tabs */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveSubTab("summary")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        activeSubTab === "summary"
                          ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      Summary & Highlights
                    </button>
                    <button
                      onClick={() => setActiveSubTab("gps")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        activeSubTab === "gps"
                          ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>GPS & Location</span>
                      {metadata?.gps && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveSubTab("hardware")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        activeSubTab === "hardware"
                          ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Camera & Lens</span>
                    </button>
                    <button
                      onClick={() => setActiveSubTab("raw")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        activeSubTab === "raw"
                          ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>All Tags ({metadata?.tagCount || 0})</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Tab Contents */}
                <div className="p-6 h-[560px] overflow-y-auto space-y-6">
                  {/* SUB-TAB: Summary */}
                  {activeSubTab === "summary" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Location Summary */}
                        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span>Geolocation</span>
                          </div>
                          {metadata?.gps ? (
                            <div className="space-y-1 text-xs">
                              <p className="font-mono font-bold text-red-600 dark:text-red-400">
                                {metadata.gps.dmsLat}, {metadata.gps.dmsLon}
                              </p>
                              <p className="text-zinc-500 font-mono">
                                Dec: {metadata.gps.latitude.toFixed(6)}, {metadata.gps.longitude.toFixed(6)}
                              </p>
                              {metadata.gps.altitude !== undefined && (
                                <p className="text-zinc-500 font-mono">
                                  Altitude: {metadata.gps.altitude} m
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-400 italic">No GPS coordinates embedded</p>
                          )}
                        </div>

                        {/* Hardware Summary */}
                        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            <Camera className="w-4 h-4 text-purple-500" />
                            <span>Device Hardware</span>
                          </div>
                          {metadata?.hardware.make || metadata?.hardware.model ? (
                            <div className="space-y-1 text-xs">
                              <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                                {metadata.hardware.make} {metadata.hardware.model}
                              </p>
                              {metadata.hardware.serialNumber && (
                                <p className="text-red-500 font-mono text-[11px]">
                                  Serial: {metadata.hardware.serialNumber}
                                </p>
                              )}
                              {metadata.hardware.software && (
                                <p className="text-zinc-500 text-[11px]">
                                  OS: {metadata.hardware.software}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-400 italic">No hardware tags found</p>
                          )}
                        </div>
                      </div>

                      {/* Exposure & Dates Overview */}
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                        <div className="p-3 bg-zinc-50/80 dark:bg-zinc-800/60 font-semibold text-zinc-600 dark:text-zinc-300">
                          Shooting & Capture Details
                        </div>
                        <div className="p-3 flex justify-between">
                          <span className="text-zinc-500">Date Captured:</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">
                            {metadata?.timestamps.dateTimeOriginal || metadata?.timestamps.modifyDate || "Not specified"}
                          </span>
                        </div>
                        <div className="p-3 flex justify-between">
                          <span className="text-zinc-500">Aperture:</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">
                            {metadata?.exposure.fNumber ? `f/${metadata.exposure.fNumber}` : "N/A"}
                          </span>
                        </div>
                        <div className="p-3 flex justify-between">
                          <span className="text-zinc-500">Shutter Speed:</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">
                            {metadata?.exposure.exposureTime || "N/A"}
                          </span>
                        </div>
                        <div className="p-3 flex justify-between">
                          <span className="text-zinc-500">ISO Sensitivity:</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">
                            {metadata?.exposure.iso || "N/A"}
                          </span>
                        </div>
                        <div className="p-3 flex justify-between">
                          <span className="text-zinc-500">Focal Length:</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">
                            {metadata?.exposure.focalLength ? `${metadata.exposure.focalLength} mm` : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: GPS & Location */}
                  {activeSubTab === "gps" && (
                    <div className="space-y-6">
                      {metadata?.gps ? (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-xs space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Crosshair className="w-4 h-4" />
                                Exact Coordinates Detected
                              </span>
                              <div className="flex items-center gap-2">
                                <a
                                  href={metadata.gps.openStreetMapUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:text-emerald-500 border border-zinc-300 dark:border-zinc-700 text-[11px]"
                                >
                                  OpenStreetMap
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                <a
                                  href={metadata.gps.googleMapsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:text-emerald-500 border border-zinc-300 dark:border-zinc-700 text-[11px]"
                                >
                                  Google Maps
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <div>
                                <span className="text-zinc-500 block text-[11px]">Latitude (DMS):</span>
                                <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                  {metadata.gps.dmsLat}
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[11px]">Longitude (DMS):</span>
                                <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                  {metadata.gps.dmsLon}
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[11px]">Decimal Latitude:</span>
                                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                                  {metadata.gps.latitude.toFixed(7)}
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[11px]">Decimal Longitude:</span>
                                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                                  {metadata.gps.longitude.toFixed(7)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Interactive Pin Radar Placeholder */}
                          <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400 overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
                            <div className="relative z-10 space-y-2">
                              <MapPin className="w-10 h-10 mx-auto text-red-500 animate-bounce" />
                              <h5 className="font-bold text-sm text-zinc-100">
                                Location Pin Locked
                              </h5>
                              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                                Latitude {metadata.gps.latitude.toFixed(4)}, Longitude {metadata.gps.longitude.toFixed(4)}.
                                Clicking the map links above opens the exact pinpoint in an external tab without uploading your photo.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-400 p-6">
                          <MapPin className="w-10 h-10 mb-2 opacity-30" />
                          <p className="text-sm font-medium">No Geotagged Location Found</p>
                          <p className="text-xs text-zinc-500 max-w-xs mt-1">
                            This image does not contain GPS latitude or longitude tags.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: Camera & Lens */}
                  {activeSubTab === "hardware" && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 text-left border-b border-zinc-200 dark:border-zinc-800">
                              <th className="p-3 font-semibold">Hardware Property</th>
                              <th className="p-3 font-semibold">Detected Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                            <tr>
                              <td className="p-3 text-zinc-500">Camera Manufacturer</td>
                              <td className="p-3 font-bold text-zinc-800 dark:text-zinc-200">
                                {metadata?.hardware.make || "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 text-zinc-500">Camera Model</td>
                              <td className="p-3 font-bold text-zinc-800 dark:text-zinc-200">
                                {metadata?.hardware.model || "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 text-zinc-500">Device Serial Number</td>
                              <td className="p-3 text-red-500 font-bold">
                                {metadata?.hardware.serialNumber || "None"}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 text-zinc-500">Lens Model</td>
                              <td className="p-3 text-zinc-800 dark:text-zinc-200">
                                {metadata?.hardware.lensModel || "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 text-zinc-500">Operating System / Software</td>
                              <td className="p-3 text-zinc-800 dark:text-zinc-200">
                                {metadata?.hardware.software || "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 text-zinc-500">Author / Owner Identity</td>
                              <td className="p-3 text-zinc-800 dark:text-zinc-200">
                                {metadata?.hardware.owner || "N/A"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: All Raw Tags */}
                  {activeSubTab === "raw" && (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Search metadata keys and values..."
                          value={tagSearchQuery}
                          onChange={(e) => setTagSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 focus:outline-none"
                        />
                      </div>

                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs max-h-[450px] overflow-y-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 text-left border-b border-zinc-200 dark:border-zinc-800">
                              <th className="p-3 font-semibold">Tag Name</th>
                              <th className="p-3 font-semibold">Raw Extracted Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-[11px]">
                            {filteredTags.length > 0 ? (
                              filteredTags.map(([k, v]) => (
                                <tr key={k} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                  <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold break-all">
                                    {k}
                                  </td>
                                  <td className="p-2.5 text-zinc-800 dark:text-zinc-200 break-all">
                                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={2} className="p-6 text-center text-zinc-400">
                                  No matching tags found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: Batch Photo Scrubber */}
      {activeTab === "batch" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <input
              ref={batchInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) handleBatchUpload(e.target.files);
              }}
              className="hidden"
            />
            <div
              onClick={() => batchInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-800/30"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Drop multiple photos to batch scrub metadata
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Select 5, 10, or 50 images. All files are cleansed losslessly in RAM with zero server communication.
              </p>
            </div>
          </div>

          {batchItems.length > 0 && (
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Batch Queue ({batchItems.length} photos)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {batchItems.filter((i) => i.status === "cleaned").length} of {batchItems.length} cleaned
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleScrubAllBatch}
                    disabled={isBatchScrubbing}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isBatchScrubbing ? "Scrubbing Queue..." : "Scrub All Photos"}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 text-left border-b border-zinc-200 dark:border-zinc-800">
                      <th className="p-3 font-semibold">File</th>
                      <th className="p-3 font-semibold">Original Size</th>
                      <th className="p-3 font-semibold">Detected Privacy Risks</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {batchItems.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="p-3 flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.previewUrl}
                            alt=""
                            className="w-8 h-8 rounded object-cover border border-zinc-700 shrink-0"
                          />
                          <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-xs">
                            {item.name}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-zinc-500">
                          {(item.size / 1024).toFixed(1)} KB
                        </td>
                        <td className="p-3">
                          {item.riskReport?.hasGps && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 mr-1.5">
                              <MapPin className="w-3 h-3" /> GPS
                            </span>
                          )}
                          {item.riskReport?.hasHardwareId && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 mr-1.5">
                              Device ID
                            </span>
                          )}
                          {item.riskReport?.hasTimestamps && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              Timestamp
                            </span>
                          )}
                          {item.riskReport && !item.riskReport.hasGps && !item.riskReport.hasHardwareId && !item.riskReport.hasTimestamps && (
                            <span className="text-zinc-400 text-[11px] italic">Clean / No Risks</span>
                          )}
                        </td>
                        <td className="p-3">
                          {item.status === "cleaned" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Cleaned
                            </span>
                          ) : item.status === "cleaning" ? (
                            <span className="text-zinc-400 animate-pulse">Scrubbing...</span>
                          ) : (
                            <span className="text-zinc-500">Ready</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {item.scrubbed && (
                            <button
                              onClick={() => {
                                const url = URL.createObjectURL(item.scrubbed!.blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `scrubbed_${item.name}`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white transition-colors text-xs font-medium"
                            >
                              Download
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: Audio Waveform & Privacy Trimmer */}
      {activeTab === "audio" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) processAudioFile(f, f.name);
              }}
              className="hidden"
            />
            <div
              onClick={() => audioInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-800/30"
            >
              <Music className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Drop audio recording or voice memo to trim in memory
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Supports MP3, WAV, OGG, M4A, AAC. Renders local waveform and exports trimmed lossless WAV without server processing.
              </p>
            </div>
          </div>

          {audioBuffer && (
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    {audioFileName}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono mt-0.5">
                    <span>Duration: {audioDuration.toFixed(2)}s</span>
                    <span>•</span>
                    <span>Sample Rate: {audioBuffer.sampleRate} Hz</span>
                    <span>•</span>
                    <span>Channels: {audioBuffer.numberOfChannels === 2 ? "Stereo" : "Mono"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlayPause}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlaying ? "Pause" : "Play Selection"}</span>
                  </button>
                </div>
              </div>

              {/* Native Audio Element */}
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onTimeUpdate={() => {
                    if (audioRef.current) {
                      setPlaybackTime(audioRef.current.currentTime);
                      if (audioRef.current.currentTime >= trimEnd) {
                        audioRef.current.pause();
                        setIsPlaying(false);
                      }
                    }
                  }}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              )}

              {/* Interactive Waveform Canvas */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-4 relative overflow-hidden">
                <canvas
                  ref={waveformCanvasRef}
                  width={900}
                  height={140}
                  className="w-full h-36 block"
                />
              </div>

              {/* Trimming Handles & Numeric Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">Start Time:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {trimStart.toFixed(2)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={audioDuration}
                    step={0.05}
                    value={trimStart}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (v < trimEnd) setTrimStart(v);
                    }}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">End Time:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {trimEnd.toFixed(2)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={audioDuration}
                    step={0.05}
                    value={trimEnd}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (v > trimStart) setTrimEnd(v);
                    }}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleExportTrimmedAudio}
                    className="w-full py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Scissors className="w-4 h-4" />
                    <span>Export Trimmed WAV ({(trimEnd - trimStart).toFixed(2)}s)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
