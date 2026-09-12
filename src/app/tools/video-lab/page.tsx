"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Video,
  Volume2,
  VolumeX,
  Music,
  Scissors,
  Film,
  Download,
  Upload,
  Trash2,
  Play,
  Pause,
  Sliders,
  FileVideo,
  FileAudio,
  AlertCircle,
  RefreshCw,
  Gauge,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Repeat,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import {
  stripAudioFromMp4Lossless,
  extractAudioFromVideo,
  encodeMp3,
  encodeFlac,
  processAudioData,
  transcodeVideo,
  convertVideoToGif,
  convertAudioFile,
  generateSampleVideo,
  generateSampleAudioFile,
  inspectVideoMetadata,
  VideoMetadata,
  ExtractedAudioResult,
  TranscodeOptions,
  GifConvertOptions,
  AudioConvertOptions,
} from "@/lib/converters/video";

type StudioTab = "strip" | "extract" | "audio-convert" | "transcode" | "trim";

interface VideoLabPreset {
  id: string;
  name: string;
  type: "video" | "audio";
  description: string;
  subType?: "chime" | "tone";
}

const PRESETS: VideoLabPreset[] = [
  {
    id: "sample-clip",
    name: "Sample Animated Clip (HD 60fps + Audio)",
    type: "video",
    description: "3-second animated WebM clip with rotating HUD and audio chime chord.",
  },
  {
    id: "ambient-chime",
    name: "Ambient Stereo Chime (Audio)",
    type: "audio",
    subType: "chime",
    description: "Synthesized 3-second harmonic chime (A4/C#5/E5) at 44.1kHz stereo.",
  },
  {
    id: "voice-tone",
    name: "Voice Frequency Tone (440Hz / 880Hz)",
    type: "audio",
    subType: "tone",
    description: "Stereo calibration tones (440Hz Left, 880Hz Right) for frequency testing.",
  },
];

function formatBytes(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatTime(seconds: number): string {
  if (typeof seconds !== "number" || isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
    return "00:00.0";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${ms}`;
}

export default function VideoLabPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>("strip");
  const [activePreset, setActivePreset] = useState<string | null>("sample-clip");

  // Current Loaded File
  const [inputFile, setInputFile] = useState<File | Blob | null>(null);
  const [fileName, setFileName] = useState<string>("sample_clip.webm");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState<boolean>(true);
  const [videoMeta, setVideoMeta] = useState<VideoMetadata | null>(null);
  const [isProcessingPreset, setIsProcessingPreset] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ==========================================
  // TAB 1: STRIP AUDIO STATE
  // ==========================================
  const [isStripping, setIsStripping] = useState<boolean>(false);
  const [strippedBlob, setStrippedBlob] = useState<Blob | null>(null);
  const [strippedUrl, setStrippedUrl] = useState<string | null>(null);
  const [stripMethod, setStripMethod] = useState<"lossless" | "transcode" | null>(null);
  const [stripProgress, setStripProgress] = useState<number>(0);
  const [strippedSavingsPercent, setStrippedSavingsPercent] = useState<number>(0);

  // ==========================================
  // TAB 2: EXTRACT AUDIO STATE
  // ==========================================
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedAudio, setExtractedAudio] = useState<ExtractedAudioResult | null>(null);
  const [extractedWavUrl, setExtractedWavUrl] = useState<string | null>(null);
  const [extractedMp3Url, setExtractedMp3Url] = useState<string | null>(null);
  const [extractedFlacUrl, setExtractedFlacUrl] = useState<string | null>(null);
  const [extractMp3Bitrate, setExtractMp3Bitrate] = useState<number>(192);
  const [isEncodingMp3, setIsEncodingMp3] = useState<boolean>(false);
  const [isEncodingFlac, setIsEncodingFlac] = useState<boolean>(false);
  const [audioGain, setAudioGain] = useState<number>(1.0);
  const [audioNormalize, setAudioNormalize] = useState<boolean>(false);
  const [audioMono, setAudioMono] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioPlayTime, setAudioPlayTime] = useState<number>(0);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ==========================================
  // TAB 3: AUDIO FORMAT CONVERTER STATE
  // ==========================================
  const [audioConvertTarget, setAudioConvertTarget] = useState<"mp3" | "wav" | "flac">("mp3");
  const [audioConvertBitrate, setAudioConvertBitrate] = useState<number>(192);
  const [isConvertingAudio, setIsConvertingAudio] = useState<boolean>(false);
  const [convertedAudioBlob, setConvertedAudioBlob] = useState<Blob | null>(null);
  const [convertedAudioUrl, setConvertedAudioUrl] = useState<string | null>(null);
  const [convertedAudioFormat, setConvertedAudioFormat] = useState<string>("mp3");

  // ==========================================
  // TAB 4: TRANSCODE & RESIZE & GIF STATE
  // ==========================================
  const [transcodeMode, setTranscodeMode] = useState<"video" | "gif">("video");
  const [targetVideoFormat, setTargetVideoFormat] = useState<"webm" | "mp4">("webm");
  const [resolutionPreset, setResolutionPreset] = useState<"original" | "1080p" | "720p" | "480p" | "360p">("720p");
  const [bitrateMbps, setBitrateMbps] = useState<number>(2.5);
  const [transcodeFps, setTranscodeFps] = useState<number>(30);
  const [transcodeIncludeAudio, setTranscodeIncludeAudio] = useState<boolean>(true);
  const [isTranscoding, setIsTranscoding] = useState<boolean>(false);
  const [transcodeProgress, setTranscodeProgress] = useState<number>(0);
  const [transcodedBlob, setTranscodedBlob] = useState<Blob | null>(null);
  const [transcodedUrl, setTranscodedUrl] = useState<string | null>(null);

  // GIF Specifics
  const [gifWidth, setGifWidth] = useState<number>(360);
  const [gifFps, setGifFps] = useState<number>(10);
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [isConvertingGif, setIsConvertingGif] = useState<boolean>(false);
  const [gifProgress, setGifProgress] = useState<number>(0);

  // ==========================================
  // TAB 5: TRIM & CUT STATE
  // ==========================================
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(3);
  const [clipDuration, setClipDuration] = useState<number>(3);
  const [isTrimming, setIsTrimming] = useState<boolean>(false);
  const [trimProgress, setTrimProgress] = useState<number>(0);
  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);
  const [trimmedUrl, setTrimmedUrl] = useState<string | null>(null);
  const trimVideoRef = useRef<HTMLVideoElement | null>(null);

  // Clean up Object URLs
  const revokeAllUrls = useCallback(() => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    if (strippedUrl) URL.revokeObjectURL(strippedUrl);
    if (extractedWavUrl) URL.revokeObjectURL(extractedWavUrl);
    if (extractedMp3Url) URL.revokeObjectURL(extractedMp3Url);
    if (extractedFlacUrl) URL.revokeObjectURL(extractedFlacUrl);
    if (convertedAudioUrl) URL.revokeObjectURL(convertedAudioUrl);
    if (transcodedUrl) URL.revokeObjectURL(transcodedUrl);
    if (gifUrl) URL.revokeObjectURL(gifUrl);
    if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
  }, [
    fileUrl,
    strippedUrl,
    extractedWavUrl,
    extractedMp3Url,
    extractedFlacUrl,
    convertedAudioUrl,
    transcodedUrl,
    gifUrl,
    trimmedUrl,
  ]);

  // Process and load input file
  const handleLoadFile = async (file: File | Blob, name: string) => {
    setErrorMessage(null);
    revokeAllUrls();

    const isVid =
      file.type.startsWith("video/") ||
      name.endsWith(".mp4") ||
      name.endsWith(".webm") ||
      name.endsWith(".mov") ||
      name.endsWith(".mkv");

    const newUrl = URL.createObjectURL(file);

    setInputFile(file);
    setFileName(name);
    setFileUrl(newUrl);
    setIsVideo(isVid);

    // Reset downstream outputs
    setStrippedBlob(null);
    setStrippedUrl(null);
    setExtractedAudio(null);
    setExtractedWavUrl(null);
    setExtractedMp3Url(null);
    setExtractedFlacUrl(null);
    setConvertedAudioBlob(null);
    setConvertedAudioUrl(null);
    setTranscodedBlob(null);
    setTranscodedUrl(null);
    setGifBlob(null);
    setGifUrl(null);
    setTrimmedBlob(null);
    setTrimmedUrl(null);

    if (isVid) {
      try {
        const meta = await inspectVideoMetadata(file);
        const dur =
          isFinite(meta.duration) && !isNaN(meta.duration) && meta.duration > 0
            ? Number(meta.duration.toFixed(2))
            : 3;
        setVideoMeta(meta);
        setClipDuration(dur);
        setTrimStart(0);
        setTrimEnd(dur);
      } catch {
        setVideoMeta(null);
        setClipDuration(3);
        setTrimStart(0);
        setTrimEnd(3);
      }
    } else {
      setVideoMeta(null);
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        const buf = await ctx.decodeAudioData(await file.slice(0).arrayBuffer());
        const dur =
          isFinite(buf.duration) && !isNaN(buf.duration) && buf.duration > 0
            ? Number(buf.duration.toFixed(2))
            : 3;
        ctx.close();
        setClipDuration(dur);
        setTrimStart(0);
        setTrimEnd(dur);
      } catch {
        setClipDuration(3);
        setTrimStart(0);
        setTrimEnd(3);
      }
    }
  };

  // Preset Handler
  const handleLoadPreset = async (preset: VideoLabPreset) => {
    setActivePreset(preset.id);
    setIsProcessingPreset(true);
    setErrorMessage(null);

    try {
      if (preset.type === "video") {
        const sampleVid = await generateSampleVideo();
        await handleLoadFile(sampleVid, "privatools_sample_clip.webm");
      } else {
        const sampleAud = generateSampleAudioFile(preset.subType || "chime");
        await handleLoadFile(sampleAud, sampleAud.name);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate sample preset.");
    } finally {
      setIsProcessingPreset(false);
    }
  };

  // Load Initial Preset
  useEffect(() => {
    let active = true;
    requestAnimationFrame(() => {
      if (active) handleLoadPreset(PRESETS[0]);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear Input
  const handleClear = () => {
    revokeAllUrls();
    setInputFile(null);
    setFileName("");
    setFileUrl(null);
    setVideoMeta(null);
    setErrorMessage(null);
    setActivePreset(null);
    setStrippedBlob(null);
    setStrippedUrl(null);
    setExtractedAudio(null);
    setExtractedWavUrl(null);
    setExtractedMp3Url(null);
    setExtractedFlacUrl(null);
    setConvertedAudioBlob(null);
    setConvertedAudioUrl(null);
    setTranscodedBlob(null);
    setTranscodedUrl(null);
    setGifBlob(null);
    setGifUrl(null);
    setTrimmedBlob(null);
    setTrimmedUrl(null);
    setTrimStart(0);
    setTrimEnd(3);
    setClipDuration(3);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Drag and Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleLoadFile(file, file.name);
    }
  };

  // ==========================================
  // 1. STRIP AUDIO ACTION
  // ==========================================
  const handleStripAudio = async () => {
    if (!inputFile || !fileUrl) return;
    setIsStripping(true);
    setStripProgress(0);
    setErrorMessage(null);

    try {
      const isMp4 = fileName.toLowerCase().endsWith(".mp4") || inputFile.type === "video/mp4";
      if (isMp4) {
        try {
          // Instant ISOBMFF Lossless Demuxing
          const buffer = await inputFile.arrayBuffer();
          const silentBytes = stripAudioFromMp4Lossless(buffer);
          const outBlob = new Blob([silentBytes as unknown as BlobPart], { type: "video/mp4" });
          const outUrl = URL.createObjectURL(outBlob);

          setStrippedBlob(outBlob);
          setStrippedUrl(outUrl);
          setStripMethod("lossless");
          const savings = Math.max(0, Math.round(((inputFile.size - outBlob.size) / inputFile.size) * 100));
          setStrippedSavingsPercent(savings);
          setIsStripping(false);
          return;
        } catch (losslessErr) {
          console.warn("Lossless MP4 stripping fell back to transcode:", losslessErr);
        }
      }

      // Transcode Fallback for WebM, MOV, MKV, or complex MP4
      setStripMethod("transcode");
      const res = await transcodeVideo(inputFile, {
        resolution: "original",
        includeAudio: false,
        bitrateMbps: 3.5,
        onProgress: (p) => setStripProgress(p),
      });
      const outUrl = URL.createObjectURL(res.blob);
      setStrippedBlob(res.blob);
      setStrippedUrl(outUrl);
      const savings = Math.max(0, Math.round(((inputFile.size - res.blob.size) / inputFile.size) * 100));
      setStrippedSavingsPercent(savings);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to strip audio from video container.");
    } finally {
      setIsStripping(false);
    }
  };

  // ==========================================
  // 2. EXTRACT AUDIO ACTION
  // ==========================================
  const handleExtractAudio = async () => {
    if (!inputFile) return;
    setIsExtracting(true);
    setErrorMessage(null);

    try {
      const result = await extractAudioFromVideo(inputFile);
      setExtractedAudio(result);
      const url = URL.createObjectURL(result.wavBlob);
      setExtractedWavUrl(url);

      // Pre-encode MP3 in background
      try {
        const left = result.channelData[0];
        const right = result.channelData.length > 1 ? result.channelData[1] : null;
        const mp3Bytes = encodeMp3(left, right, result.sampleRate, extractMp3Bitrate);
        const mp3Blob = new Blob([mp3Bytes as unknown as BlobPart], { type: "audio/mp3" });
        setExtractedMp3Url(URL.createObjectURL(mp3Blob));
      } catch (mp3Err) {
        console.warn("Auto MP3 encode failed", mp3Err);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to decode audio track. Make sure the file contains an audio stream."
      );
    } finally {
      setIsExtracting(false);
    }
  };

  // Encode Extracted Audio to MP3 with chosen bitrate
  const handleExportExtractedMp3 = () => {
    if (!extractedAudio) return;
    setIsEncodingMp3(true);
    try {
      const left = extractedAudio.channelData[0];
      const right = extractedAudio.channelData.length > 1 ? extractedAudio.channelData[1] : null;
      const mp3Bytes = encodeMp3(left, right, extractedAudio.sampleRate, extractMp3Bitrate);
      const mp3Blob = new Blob([mp3Bytes as unknown as BlobPart], { type: "audio/mp3" });
      if (extractedMp3Url) URL.revokeObjectURL(extractedMp3Url);
      const url = URL.createObjectURL(mp3Blob);
      setExtractedMp3Url(url);

      // Trigger instant download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.[^/.]+$/, "")}_${extractMp3Bitrate}kbps.mp3`;
      a.click();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "MP3 encoding failed.");
    } finally {
      setIsEncodingMp3(false);
    }
  };

  // Encode Extracted Audio to FLAC
  const handleExportExtractedFlac = () => {
    if (!extractedAudio) return;
    setIsEncodingFlac(true);
    try {
      const left = extractedAudio.channelData[0];
      const right = extractedAudio.channelData.length > 1 ? extractedAudio.channelData[1] : null;
      const flacBytes = encodeFlac(left, right, extractedAudio.sampleRate);
      const flacBlob = new Blob([flacBytes as unknown as BlobPart], { type: "audio/flac" });
      if (extractedFlacUrl) URL.revokeObjectURL(extractedFlacUrl);
      const url = URL.createObjectURL(flacBlob);
      setExtractedFlacUrl(url);

      // Trigger instant download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.[^/.]+$/, "")}_lossless.flac`;
      a.click();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "FLAC encoding failed.");
    } finally {
      setIsEncodingFlac(false);
    }
  };

  // Re-process audio with normalization, gain, mono
  const handleApplyAudioFX = () => {
    if (!extractedAudio) return;
    try {
      const processed = processAudioData(extractedAudio.channelData, extractedAudio.sampleRate, {
        gain: audioGain,
        normalize: audioNormalize,
        mono: audioMono,
      });

      if (extractedWavUrl) URL.revokeObjectURL(extractedWavUrl);
      const newUrl = URL.createObjectURL(processed.processedWav);

      setExtractedAudio({
        ...extractedAudio,
        channelData: processed.channelData,
        numChannels: processed.numChannels,
        wavBlob: processed.processedWav,
        waveformPeaks: processed.newPeaks,
        duration: processed.newDuration,
        sizeBytes: processed.processedWav.size,
      });
      setExtractedWavUrl(newUrl);

      // Invalidate existing MP3/FLAC URLs so they re-encode on click with effects applied
      if (extractedMp3Url) URL.revokeObjectURL(extractedMp3Url);
      if (extractedFlacUrl) URL.revokeObjectURL(extractedFlacUrl);
      setExtractedMp3Url(null);
      setExtractedFlacUrl(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Audio processing failed.");
    }
  };

  // Waveform Visualizer Drawing
  useEffect(() => {
    if (!extractedAudio || !waveformCanvasRef.current) return;
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const peaks = extractedAudio.waveformPeaks;
    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / peaks.length;

    ctx.clearRect(0, 0, width, height);

    peaks.forEach((peak, i) => {
      const barHeight = Math.max(4, peak * (height - 8));
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      const progressRatio =
        isFinite(extractedAudio.duration) && extractedAudio.duration > 0
          ? audioPlayTime / extractedAudio.duration
          : 0;
      const barRatio = i / peaks.length;

      if (barRatio <= progressRatio) {
        ctx.fillStyle = "#10b981"; // Emerald active
      } else {
        ctx.fillStyle = "#64748b"; // Slate inactive
      }

      ctx.beginPath();
      ctx.roundRect(x + 1, y, Math.max(2, barWidth - 2), barHeight, 2);
      ctx.fill();
    });
  }, [extractedAudio, audioPlayTime]);

  // Audio Playback handler
  const handleToggleAudioPlay = () => {
    if (!audioElemRef.current) return;
    if (isPlayingAudio) {
      audioElemRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElemRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // ==========================================
  // 3. AUDIO FORMAT CONVERTER ACTION
  // ==========================================
  const handleConvertAudio = async () => {
    if (!inputFile) return;
    setIsConvertingAudio(true);
    setErrorMessage(null);

    try {
      const opts: AudioConvertOptions = {
        format: audioConvertTarget,
        bitrateKbps: audioConvertBitrate,
        gain: audioGain,
        normalize: audioNormalize,
        mono: audioMono,
      };

      const result = await convertAudioFile(inputFile, opts);
      if (convertedAudioUrl) URL.revokeObjectURL(convertedAudioUrl);
      const url = URL.createObjectURL(result.blob);
      setConvertedAudioBlob(result.blob);
      setConvertedAudioUrl(url);
      setConvertedAudioFormat(result.format);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to convert audio file. Ensure the file contains a valid audio stream."
      );
    } finally {
      setIsConvertingAudio(false);
    }
  };

  // ==========================================
  // 4. TRANSCODE & GIF ACTIONS
  // ==========================================
  const handleTranscodeVideo = async () => {
    if (!inputFile) return;
    setIsTranscoding(true);
    setTranscodeProgress(0);
    setErrorMessage(null);

    try {
      const opts: TranscodeOptions = {
        resolution: resolutionPreset,
        bitrateMbps,
        fps: transcodeFps,
        includeAudio: transcodeIncludeAudio,
        format: targetVideoFormat,
        onProgress: (p) => setTranscodeProgress(p),
      };

      const result = await transcodeVideo(inputFile, opts);
      if (transcodedUrl) URL.revokeObjectURL(transcodedUrl);
      const url = URL.createObjectURL(result.blob);
      setTranscodedBlob(result.blob);
      setTranscodedUrl(url);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Transcoding failed.");
    } finally {
      setIsTranscoding(false);
    }
  };

  const handleConvertGif = async () => {
    if (!inputFile) return;
    setIsConvertingGif(true);
    setGifProgress(0);
    setErrorMessage(null);

    try {
      const opts: GifConvertOptions = {
        width: gifWidth,
        fps: gifFps,
        startTimeSec: trimStart,
        endTimeSec: trimEnd,
        onProgress: (p) => setGifProgress(p),
      };

      const result = await convertVideoToGif(inputFile, opts);
      if (gifUrl) URL.revokeObjectURL(gifUrl);
      const url = URL.createObjectURL(result.blob);
      setGifBlob(result.blob);
      setGifUrl(url);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "GIF conversion failed.");
    } finally {
      setIsConvertingGif(false);
    }
  };

  // ==========================================
  // 5. TRIM ACTION
  // ==========================================
  const handleTrimMedia = async () => {
    if (!inputFile) return;
    setIsTrimming(true);
    setTrimProgress(0);
    setErrorMessage(null);

    const effectiveStart = isFinite(trimStart) && trimStart >= 0 ? trimStart : 0;
    const maxDur = isFinite(clipDuration) && clipDuration > 0 ? clipDuration : 3;
    const effectiveEnd =
      isFinite(trimEnd) && trimEnd > effectiveStart ? Math.min(trimEnd, maxDur) : maxDur;

    try {
      if (isVideo) {
        const result = await transcodeVideo(inputFile, {
          startTimeSec: effectiveStart,
          endTimeSec: effectiveEnd,
          resolution: "original",
          includeAudio: true,
          onProgress: (p) => setTrimProgress(p),
        });
        if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
        const url = URL.createObjectURL(result.blob);
        setTrimmedBlob(result.blob);
        setTrimmedUrl(url);
      } else {
        // Audio trimming
        const audioRes = await extractAudioFromVideo(inputFile);
        const processed = processAudioData(audioRes.channelData, audioRes.sampleRate, {
          startTimeSec: effectiveStart,
          endTimeSec: effectiveEnd,
        });
        if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
        const url = URL.createObjectURL(processed.processedWav);
        setTrimmedBlob(processed.processedWav);
        setTrimmedUrl(url);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Trimming failed.");
    } finally {
      setIsTrimming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <ToolHeader
          toolId="video-lab"
          title="Video & Audio Transcoder Studio"
          description="Zero-egress client-side media lab. Lossless MP4 audio stripper, video-to-WAV/MP3/FLAC audio extractor with waveform visualizer, audio format converter, resolution & bitrate transcoder, animated GIF generator, and visual timeline trimmer."
          badge="Zero Egress"
        />
      </div>

      {/* Top Presets Bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mr-1 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-zinc-400" />
            Sample Presets:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleLoadPreset(p)}
              disabled={isProcessingPreset}
              title={p.description}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                activePreset === p.id
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {p.name}
            </button>
          ))}
          {isProcessingPreset && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
              Generating media...
            </span>
          )}
        </div>

        <button
          onClick={handleClear}
          className="shrink-0 whitespace-nowrap self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Input</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Media Processing Notice</p>
            <p className="text-xs opacity-90 mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-200/50 dark:hover:bg-red-900/50"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload & Dropzone Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`relative p-6 rounded-2xl border-2 border-dashed transition-all text-center ${
          inputFile
            ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/10"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*,.mp4,.webm,.mov,.mkv,.wav,.mp3,.flac,.ogg,.m4a"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setActivePreset(null);
              handleLoadFile(e.target.files[0], e.target.files[0].name);
            }
          }}
          className="hidden"
          id="media-file-upload"
        />

        {inputFile ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                {isVideo ? <FileVideo className="w-6 h-6" /> : <FileAudio className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{fileName}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-1">
                  <span>Size: {formatBytes(inputFile.size)}</span>
                  <span>•</span>
                  <span>Type: {inputFile.type || (isVideo ? "video/mp4" : "audio/wav")}</span>
                  {videoMeta && (
                    <>
                      <span>•</span>
                      <span>
                        Res: {videoMeta.width}x{videoMeta.height} ({videoMeta.aspectRatio})
                      </span>
                      <span>•</span>
                      <span>Duration: {formatTime(videoMeta.duration)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor="media-file-upload"
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Replace File</span>
              </label>
            </div>
          </div>
        ) : (
          <label htmlFor="media-file-upload" className="cursor-pointer flex flex-col items-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Drag and drop any video or audio file here, or click to browse
            </p>
            <p className="text-xs text-zinc-500 mt-1">Supports MP4, WebM, MOV, MKV, WAV, MP3, FLAC, OGG, M4A</p>
          </label>
        )}
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden overflow-x-auto">
        <button
          onClick={() => setActiveTab("strip")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === "strip"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span>Strip Audio (Mute)</span>
        </button>

        <button
          onClick={() => setActiveTab("extract")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === "extract"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Extract Audio Track</span>
        </button>

        <button
          onClick={() => setActiveTab("audio-convert")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === "audio-convert"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Audio Format Converter</span>
        </button>

        <button
          onClick={() => setActiveTab("transcode")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === "transcode"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Video Transcoder & GIF</span>
        </button>

        <button
          onClick={() => setActiveTab("trim")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === "trim"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Media Trimmer</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STRIP AUDIO (MUTE VIDEO) */}
      {/* ========================================================================= */}
      {activeTab === "strip" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Video Player */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                  Original Media (With Audio)
                </h3>
                {inputFile && <span className="text-xs text-zinc-500">{formatBytes(inputFile.size)}</span>}
              </div>

              {fileUrl && isVideo ? (
                <div className="relative aspect-video rounded-xl bg-black overflow-hidden flex items-center justify-center">
                  <video src={fileUrl} controls className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 flex flex-col items-center justify-center text-zinc-400">
                  <Video className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">No video loaded</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">How Stripping Works:</p>
                <p>
                  • <strong>MP4 Containers:</strong> ISOBMFF box demuxing unlinks the audio track in &lt;50ms with{" "}
                  <strong>zero video re-encoding</strong> (100% loss-free).
                </p>
                <p>
                  • <strong>WebM / MOV / MKV:</strong> Re-encodes cleanly into a silent stream without audio tracks.
                </p>
              </div>

              <button
                onClick={handleStripAudio}
                disabled={!inputFile || isStripping || !isVideo}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {isStripping ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Stripping Audio ({stripProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Strip Audio Now</span>
                  </>
                )}
              </button>

              {isStripping && stripProgress > 0 && (
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 transition-all duration-150"
                    style={{ width: `${stripProgress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Muted Result Player */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <VolumeX className="w-4 h-4 text-emerald-500" />
                  Muted Output Video
                </h3>
                {strippedBlob && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {formatBytes(strippedBlob.size)} (Saved {strippedSavingsPercent}%)
                  </span>
                )}
              </div>

              {strippedUrl ? (
                <div className="relative aspect-video rounded-xl bg-black overflow-hidden flex items-center justify-center">
                  <video src={strippedUrl} controls className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 flex flex-col items-center justify-center text-zinc-400 text-center p-4">
                  <VolumeX className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">Click &apos;Strip Audio Now&apos; to produce silent video</p>
                </div>
              )}

              {strippedBlob && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      Audio Successfully Stripped ({stripMethod === "lossless" ? "Lossless ISOBMFF" : "Clean Transcode"})
                    </span>
                  </div>
                  <p>
                    Original: {formatBytes(inputFile?.size || 0)} → Muted: {formatBytes(strippedBlob.size)}
                  </p>
                </div>
              )}

              <a
                href={strippedUrl || "#"}
                download={`muted_${fileName.replace(/\.[^/.]+$/, "")}.${strippedBlob?.type === "video/mp4" ? "mp4" : "webm"}`}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  strippedUrl
                    ? "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 shadow-sm"
                    : "pointer-events-none opacity-40 bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Silent Video</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXTRACT AUDIO TRACK */}
      {/* ========================================================================= */}
      {activeTab === "extract" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Music className="w-5 h-5 text-emerald-500" />
                  Video-to-Audio Studio (WAV, MP3 & FLAC)
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Decodes audio streams in local RAM with zero network latency. Export master WAV, compressed MP3, or lossless FLAC.
                </p>
              </div>

              <button
                onClick={handleExtractAudio}
                disabled={!inputFile || isExtracting}
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Decoding Audio Stream...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract Audio Track</span>
                  </>
                )}
              </button>
            </div>

            {/* Waveform and Scrubber Card */}
            {extractedAudio ? (
              <div className="space-y-4">
                {/* Audio Element */}
                {extractedWavUrl && (
                  <audio
                    ref={audioElemRef}
                    src={extractedWavUrl}
                    onTimeUpdate={(e) => setAudioPlayTime((e.target as HTMLAudioElement).currentTime)}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                )}

                <div className="p-4 rounded-xl bg-zinc-950 text-zinc-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-emerald-400">{formatTime(audioPlayTime)}</span>
                    <span className="text-zinc-400 font-mono">
                      {extractedAudio.sampleRate} Hz • {extractedAudio.numChannels === 1 ? "Mono" : "Stereo"} •{" "}
                      {formatTime(extractedAudio.duration)}
                    </span>
                  </div>

                  {/* Waveform Canvas */}
                  <canvas ref={waveformCanvasRef} width={700} height={80} className="w-full h-20 rounded-lg bg-zinc-900" />

                  {/* Scrubber Controls */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={handleToggleAudioPlay}
                      className="p-2 rounded-xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors"
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>

                    <div className="text-xs text-zinc-400 font-mono">PCM Master Size: {formatBytes(extractedAudio.sizeBytes)}</div>
                  </div>
                </div>

                {/* Audio Enhancement Controls */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    Audio Post-Processing Controls
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Gain Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                        <span>Volume Gain:</span>
                        <span className="font-mono">{audioGain.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="3.0"
                        step="0.1"
                        value={audioGain}
                        onChange={(e) => setAudioGain(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    {/* Normalize Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={audioNormalize}
                        onChange={(e) => setAudioNormalize(e.target.checked)}
                        className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Peak Normalization (0dB)</span>
                    </label>

                    {/* Mono Downmix Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={audioMono}
                        onChange={(e) => setAudioMono(e.target.checked)}
                        className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Downmix to Single Mono Track</span>
                    </label>
                  </div>

                  <button
                    onClick={handleApplyAudioFX}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    Apply Audio Enhancements
                  </button>
                </div>

                {/* Multiple Format Download Actions */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Export Audio Track
                  </h4>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* WAV Master */}
                    <a
                      href={extractedWavUrl || "#"}
                      download={`${fileName.replace(/\.[^/.]+$/, "")}_extracted.wav`}
                      className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download 16-Bit WAV Master</span>
                    </a>

                    {/* MP3 with Bitrate Selector */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={extractMp3Bitrate}
                        onChange={(e) => setExtractMp3Bitrate(parseInt(e.target.value))}
                        className="px-2.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                      >
                        <option value={128}>128 kbps (Compact)</option>
                        <option value={192}>192 kbps (Standard)</option>
                        <option value={256}>256 kbps (High)</option>
                        <option value={320}>320 kbps (Extreme)</option>
                      </select>

                      <button
                        onClick={handleExportExtractedMp3}
                        disabled={isEncodingMp3}
                        className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 flex items-center gap-2 transition-colors shadow-sm"
                      >
                        {isEncodingMp3 ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>Download MP3</span>
                      </button>
                    </div>

                    {/* FLAC Lossless */}
                    <button
                      onClick={handleExportExtractedFlac}
                      disabled={isEncodingFlac}
                      className="py-2.5 px-4 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center gap-2 transition-colors"
                    >
                      {isEncodingFlac ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>Download Lossless FLAC</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-44 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 text-center p-4">
                <Music className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">Click &apos;Extract Audio Track&apos; to decode sound into uncompressed PCM WAV, MP3, or FLAC</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDIO FORMAT CONVERTER */}
      {/* ========================================================================= */}
      {activeTab === "audio-convert" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-emerald-500" />
                  Audio Format Transcoder Studio
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Convert between any audio formats (MP3 ↔ FLAC ↔ WAV ↔ OGG ↔ M4A) directly in browser memory.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Target Format */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Target Audio Format</label>
                <select
                  value={audioConvertTarget}
                  onChange={(e) => setAudioConvertTarget(e.target.value as "mp3" | "wav" | "flac")}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                >
                  <option value="mp3">MP3 (MPEG Audio Layer III)</option>
                  <option value="flac">FLAC (Free Lossless Audio Codec)</option>
                  <option value="wav">WAV (16-bit PCM Master)</option>
                </select>
              </div>

              {/* MP3 Bitrate if MP3 selected */}
              {audioConvertTarget === "mp3" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">MP3 Bitrate</label>
                  <select
                    value={audioConvertBitrate}
                    onChange={(e) => setAudioConvertBitrate(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  >
                    <option value={128}>128 kbps (Compact)</option>
                    <option value={192}>192 kbps (Standard)</option>
                    <option value={256}>256 kbps (High Fidelity)</option>
                    <option value={320}>320 kbps (Maximum Quality)</option>
                  </select>
                </div>
              )}

              {/* Audio Normalization */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300 pb-2">
                  <input
                    type="checkbox"
                    checked={audioNormalize}
                    onChange={(e) => setAudioNormalize(e.target.checked)}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Peak Normalize to 0dB</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleConvertAudio}
              disabled={!inputFile || isConvertingAudio}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {isConvertingAudio ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Converting Audio Stream...</span>
                </>
              ) : (
                <>
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Convert Audio to {audioConvertTarget.toUpperCase()}</span>
                </>
              )}
            </button>

            {/* Converted Audio Preview */}
            {convertedAudioUrl && convertedAudioBlob && (
              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Converted {convertedAudioFormat.toUpperCase()} Ready ({formatBytes(convertedAudioBlob.size)})
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Original: {formatBytes(inputFile?.size || 0)} → {convertedAudioFormat.toUpperCase()}: {formatBytes(convertedAudioBlob.size)}
                    </p>
                  </div>

                  <a
                    href={convertedAudioUrl}
                    download={`${fileName.replace(/\.[^/.]+$/, "")}_converted.${convertedAudioFormat}`}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {convertedAudioFormat.toUpperCase()}</span>
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 flex items-center justify-center">
                  <audio src={convertedAudioUrl} controls className="w-full max-w-lg" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TRANSCODE & RESIZE & GIF */}
      {/* ========================================================================= */}
      {activeTab === "transcode" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
            {/* Mode Switcher: Video vs GIF */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTranscodeMode("video")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    transcodeMode === "video"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  Video Transcoder & Format Converter
                </button>
                <button
                  onClick={() => setTranscodeMode("gif")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    transcodeMode === "gif"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  Animated GIF Converter
                </button>
              </div>
            </div>

            {/* Video Transcoder Panel */}
            {transcodeMode === "video" ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Target Video Format */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Target Video Format</label>
                    <select
                      value={targetVideoFormat}
                      onChange={(e) => setTargetVideoFormat(e.target.value as "webm" | "mp4")}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="webm">WebM (VP9 / VP8 Video + Opus Audio)</option>
                      <option value="mp4">MP4 (H.264 Video + AAC Audio)</option>
                    </select>
                  </div>

                  {/* Resolution Preset */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Target Resolution</label>
                    <select
                      value={resolutionPreset}
                      onChange={(e) =>
                        setResolutionPreset(
                          e.target.value as "original" | "1080p" | "720p" | "480p" | "360p"
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="original">Original Dimensions</option>
                      <option value="1080p">1080p FHD (1920x1080)</option>
                      <option value="720p">720p HD (1280x720)</option>
                      <option value="480p">480p SD (854x480)</option>
                      <option value="360p">360p Mobile (640x360)</option>
                    </select>
                  </div>

                  {/* Bitrate */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                      <span>Target Bitrate:</span>
                      <span className="font-mono">{bitrateMbps} Mbps</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="8.0"
                      step="0.5"
                      value={bitrateMbps}
                      onChange={(e) => setBitrateMbps(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  {/* Frame Rate */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Framerate (FPS)</label>
                    <select
                      value={transcodeFps}
                      onChange={(e) => setTranscodeFps(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                      <option value={24}>24 FPS (Cinematic)</option>
                      <option value={30}>30 FPS (Standard)</option>
                      <option value={60}>60 FPS (Smooth)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={transcodeIncludeAudio}
                      onChange={(e) => setTranscodeIncludeAudio(e.target.checked)}
                      className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Include Decoded Audio Track in Output</span>
                  </label>

                  <button
                    onClick={handleTranscodeVideo}
                    disabled={!inputFile || isTranscoding || !isVideo}
                    className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    {isTranscoding ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Transcoding ({transcodeProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Gauge className="w-3.5 h-3.5" />
                        <span>Start Video Transcode</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Progress Bar */}
                {isTranscoding && (
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 transition-all duration-150"
                      style={{ width: `${transcodeProgress}%` }}
                    />
                  </div>
                )}

                {/* Output Preview */}
                {transcodedUrl && transcodedBlob && (
                  <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Transcoded Video Ready ({formatBytes(transcodedBlob.size)})
                      </h4>
                      <a
                        href={transcodedUrl}
                        download={`transcoded_${fileName.replace(/\.[^/.]+$/, "")}.${targetVideoFormat}`}
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download {targetVideoFormat.toUpperCase()}</span>
                      </a>
                    </div>

                    <div className="max-w-md mx-auto aspect-video rounded-xl bg-black overflow-hidden">
                      <video src={transcodedUrl} controls className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* GIF Converter Panel */
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">GIF Width (pixels)</label>
                    <select
                      value={gifWidth}
                      onChange={(e) => setGifWidth(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                      <option value={240}>240 px (Small / Avatar)</option>
                      <option value={360}>360 px (Medium / Blog)</option>
                      <option value={480}>480 px (Large / Crisp)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">GIF Framerate (FPS)</label>
                    <select
                      value={gifFps}
                      onChange={(e) => setGifFps(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                      <option value={8}>8 FPS (Compact File)</option>
                      <option value={10}>10 FPS (Standard)</option>
                      <option value={15}>15 FPS (Smooth Motion)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-500">
                  Tip: GIF animation will render the active trim range ({trimStart.toFixed(1)}s to {trimEnd.toFixed(1)}s ={" "}
                  {(trimEnd - trimStart).toFixed(1)}s total).
                </div>

                <button
                  onClick={handleConvertGif}
                  disabled={!inputFile || isConvertingGif || !isVideo}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  {isConvertingGif ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Encoding Animated GIF ({gifProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Film className="w-3.5 h-3.5" />
                      <span>Convert to Animated GIF</span>
                    </>
                  )}
                </button>

                {isConvertingGif && (
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 transition-all duration-150" style={{ width: `${gifProgress}%` }} />
                  </div>
                )}

                {gifUrl && gifBlob && (
                  <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        GIF Ready ({formatBytes(gifBlob.size)})
                      </h4>
                      <a
                        href={gifUrl}
                        download={`${fileName.replace(/\.[^/.]+$/, "")}.gif`}
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download GIF</span>
                      </a>
                    </div>

                    <div className="flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={gifUrl} alt="Converted GIF Preview" className="rounded-xl border border-zinc-200 dark:border-zinc-700 max-h-64 object-contain shadow-sm" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MEDIA TRIMMER & CUTTER */}
      {/* ========================================================================= */}
      {activeTab === "trim" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-emerald-500" />
                  Timeline Trimmer & Segment Cutter
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Slice start and end points with millisecond accuracy. Loops precisely inside the preview window.
                </p>
              </div>

              <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Duration: {isFinite(trimEnd - trimStart) ? (trimEnd - trimStart).toFixed(2) : "0.00"}s
              </div>
            </div>

            {/* Video / Audio Preview */}
            {fileUrl && (
              <div className="max-w-md mx-auto aspect-video rounded-xl bg-black overflow-hidden flex items-center justify-center">
                <video
                  ref={trimVideoRef}
                  src={fileUrl}
                  controls
                  onLoadedMetadata={(e) => {
                    const vid = e.target as HTMLVideoElement;
                    const dur = vid.duration;
                    if (dur && isFinite(dur) && !isNaN(dur) && dur > 0) {
                      const roundedDur = Number(dur.toFixed(2));
                      setClipDuration(roundedDur);
                      setTrimEnd((prev) =>
                        !isFinite(prev) || prev <= 0 || prev > roundedDur ? roundedDur : prev
                      );
                    }
                  }}
                  onTimeUpdate={(e) => {
                    const cur = (e.target as HTMLVideoElement).currentTime;
                    if (isFinite(cur)) {
                      const currentEnd =
                        isFinite(trimEnd) && trimEnd > 0
                          ? trimEnd
                          : isFinite(clipDuration)
                          ? clipDuration
                          : 3;
                      const currentStart = isFinite(trimStart) ? trimStart : 0;
                      if (cur >= currentEnd) {
                        (e.target as HTMLVideoElement).currentTime = currentStart;
                      }
                    }
                  }}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Trimming Markers */}
            <div className="space-y-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Marker */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>In-Point (Start):</span>
                    <span className="font-mono">
                      {formatTime(trimStart)} / {formatTime(clipDuration)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={isFinite(clipDuration) && clipDuration > 0 ? clipDuration : 3}
                    step="0.05"
                    value={isFinite(trimStart) ? trimStart : 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isFinite(val) || isNaN(val)) return;
                      const maxDur = isFinite(clipDuration) && clipDuration > 0 ? clipDuration : 3;
                      const currentEnd = isFinite(trimEnd) ? trimEnd : maxDur;
                      if (val <= currentEnd) {
                        setTrimStart(val);
                        if (trimVideoRef.current) trimVideoRef.current.currentTime = val;
                      } else {
                        setTrimStart(val);
                        setTrimEnd(Math.min(maxDur, val));
                        if (trimVideoRef.current) trimVideoRef.current.currentTime = val;
                      }
                    }}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() =>
                        setTrimStart((prev) =>
                          Math.max(0, Number(((isFinite(prev) ? prev : 0) - 0.1).toFixed(2)))
                        )
                      }
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    >
                      -0.1s
                    </button>
                    <button
                      onClick={() =>
                        setTrimStart((prev) => {
                          const currentEnd = isFinite(trimEnd)
                            ? trimEnd
                            : isFinite(clipDuration)
                            ? clipDuration
                            : 3;
                          return Math.min(
                            currentEnd,
                            Number(((isFinite(prev) ? prev : 0) + 0.1).toFixed(2))
                          );
                        })
                      }
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    >
                      +0.1s
                    </button>
                    <button
                      onClick={() => {
                        setTrimStart(0);
                        if (trimVideoRef.current) trimVideoRef.current.currentTime = 0;
                      }}
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    >
                      Set to 0.0s
                    </button>
                    <button
                      onClick={() => {
                        if (trimVideoRef.current) {
                          const curTime = trimVideoRef.current.currentTime;
                          const currentEnd = isFinite(trimEnd)
                            ? trimEnd
                            : isFinite(clipDuration)
                            ? clipDuration
                            : 3;
                          if (isFinite(curTime) && curTime <= currentEnd) {
                            const cur = Number(curTime.toFixed(2));
                            setTrimStart(cur);
                          }
                        }
                      }}
                      className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium"
                    >
                      Set to Playhead
                    </button>
                  </div>
                </div>

                {/* End Marker */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Out-Point (End):</span>
                    <span className="font-mono">
                      {formatTime(trimEnd)} / {formatTime(clipDuration)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={isFinite(clipDuration) && clipDuration > 0 ? clipDuration : 3}
                    step="0.05"
                    value={isFinite(trimEnd) ? trimEnd : isFinite(clipDuration) ? clipDuration : 3}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isFinite(val) || isNaN(val)) return;
                      const currentStart = isFinite(trimStart) ? trimStart : 0;
                      if (val >= currentStart) {
                        setTrimEnd(val);
                      } else {
                        setTrimEnd(val);
                        setTrimStart(Math.max(0, val));
                      }
                    }}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() =>
                        setTrimEnd((prev) => {
                          const currentStart = isFinite(trimStart) ? trimStart : 0;
                          const cur = isFinite(prev)
                            ? prev
                            : isFinite(clipDuration)
                            ? clipDuration
                            : 3;
                          return Math.max(currentStart, Number((cur - 0.1).toFixed(2)));
                        })
                      }
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    >
                      -0.1s
                    </button>
                    <button
                      onClick={() =>
                        setTrimEnd((prev) => {
                          const maxDur =
                            isFinite(clipDuration) && clipDuration > 0 ? clipDuration : 3;
                          const cur = isFinite(prev) ? prev : maxDur;
                          return Math.min(maxDur, Number((cur + 0.1).toFixed(2)));
                        })
                      }
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    >
                      +0.1s
                    </button>
                    <button
                      onClick={() => {
                        const maxDur =
                          isFinite(clipDuration) && clipDuration > 0 ? clipDuration : 3;
                        setTrimEnd(maxDur);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    >
                      Set to End ({formatTime(isFinite(clipDuration) && clipDuration > 0 ? clipDuration : 3)})
                    </button>
                    <button
                      onClick={() => {
                        if (trimVideoRef.current) {
                          const curTime = trimVideoRef.current.currentTime;
                          const currentStart = isFinite(trimStart) ? trimStart : 0;
                          if (isFinite(curTime) && curTime >= currentStart) {
                            const cur = Number(curTime.toFixed(2));
                            setTrimEnd(cur);
                          }
                        }
                      }}
                      className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium"
                    >
                      Set to Playhead
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (trimVideoRef.current) {
                      trimVideoRef.current.currentTime = isFinite(trimStart) ? trimStart : 0;
                      trimVideoRef.current.play();
                    }
                  }}
                  className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Preview Loop [{formatTime(trimStart)} - {formatTime(trimEnd)}]</span>
                </button>

                <button
                  onClick={handleTrimMedia}
                  disabled={!inputFile || isTrimming}
                  className="py-2 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors shadow-sm"
                >
                  {isTrimming ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Exporting Trim ({trimProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Export Trimmed Clip</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Trim Progress */}
            {isTrimming && (
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 transition-all duration-150" style={{ width: `${trimProgress}%` }} />
              </div>
            )}

            {/* Trim Result */}
            {trimmedUrl && trimmedBlob && (
              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Trimmed Output Ready ({formatBytes(trimmedBlob.size)})
                  </h4>
                  <a
                    href={trimmedUrl}
                    download={`trimmed_${fileName.replace(/\.[^/.]+$/, "")}.${isVideo ? "webm" : "wav"}`}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Trimmed File</span>
                  </a>
                </div>

                {isVideo && (
                  <div className="max-w-md mx-auto aspect-video rounded-xl bg-black overflow-hidden">
                    <video src={trimmedUrl} controls className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zero-Egress Privacy Assurance Footer */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong>100% Zero-Egress Local Processing:</strong> All video frames, audio samples, and pixel matrices are
            processed inside browser memory via Web Audio & Canvas APIs. No bytes leave your device.
          </span>
        </div>
      </div>
    </div>
  );
}
