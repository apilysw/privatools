/**
 * Pure client-side Video & Audio processing engine.
 * Supports:
 * 1. Lossless MP4 Audio Stripping (ISOBMFF container demuxing - 0% quality loss)
 * 2. Video to Audio Extraction (Web Audio API -> 16-bit PCM WAV & WebM Audio)
 * 3. Video Transcoding, Downscaling & Bitrate Compression (Canvas + MediaRecorder)
 * 4. Video to Animated GIF Conversion (Client-side GIF89a LZW encoder)
 * 5. Audio Normalization, Mono Downmix & Trimming
 * 6. Synthetic in-memory test media generation
 */

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  aspectRatio: string;
  hasAudio: boolean;
  sizeBytes: number;
  mimeType: string;
}

import { Mp3Encoder } from "@breezystack/lamejs";

export interface ExtractedAudioResult {
  audioBuffer: AudioBuffer;
  channelData: Float32Array[];
  sampleRate: number;
  duration: number;
  numChannels: number;
  wavBlob: Blob;
  waveformPeaks: number[];
  sizeBytes: number;
}

export interface TranscodeOptions {
  resolution?: "original" | "1080p" | "720p" | "480p" | "360p";
  bitrateMbps?: number; // e.g. 1.0, 2.5, 5.0
  fps?: number; // 24, 30, 60
  includeAudio?: boolean;
  format?: "webm" | "mp4";
  startTimeSec?: number;
  endTimeSec?: number;
  onProgress?: (progress: number) => void;
}

export interface GifConvertOptions {
  width?: number; // e.g. 320, 480
  fps?: number; // 8, 10, 15
  startTimeSec?: number;
  endTimeSec?: number;
  onProgress?: (progress: number) => void;
}

export interface AudioConvertOptions {
  format: "mp3" | "wav" | "flac";
  bitrateKbps?: number; // 128, 192, 256, 320 for MP3
  sampleRate?: number; // 44100, 48000
  gain?: number;
  normalize?: boolean;
  mono?: boolean;
}

// ==========================================
// 1. LOSSLESS MP4 AUDIO STRIPPER (ISOBMFF)
// ==========================================

/**
 * Strips audio tracks from an MP4/MOV container losslessly without re-encoding video.
 * Modifies the 'moov' atom box by removing 'trak' boxes with handler_type === 'soun'.
 * Preserves 'mdat' (video frames) bit-for-bit with zero compression loss.
 */
export function stripAudioFromMp4Lossless(arrayBuffer: ArrayBuffer): Uint8Array {
  const data = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  let offset = 0;
  let moovOffset = -1;
  let moovSize = 0;

  // Scan top-level boxes to locate 'moov'
  while (offset + 8 <= data.length) {
    const size = view.getUint32(offset);
    const type = String.fromCharCode(
      data[offset + 4],
      data[offset + 5],
      data[offset + 6],
      data[offset + 7]
    );

    const actualSize = size === 1 ? Number(view.getBigUint64(offset + 8)) : size;
    if (actualSize <= 0 || offset + actualSize > data.length) {
      break;
    }

    if (type === "moov") {
      moovOffset = offset;
      moovSize = actualSize;
      break;
    }

    offset += actualSize;
  }

  if (moovOffset === -1) {
    throw new Error("Could not find 'moov' metadata box in MP4 container.");
  }

  // Parse child boxes inside 'moov'
  const moovPayloadStart = moovOffset + 8;
  const moovPayloadEnd = moovOffset + moovSize;
  let childOffset = moovPayloadStart;
  const keptChildChunks: Uint8Array[] = [];
  let videoTrackCount = 0;
  let audioTrackCount = 0;

  while (childOffset + 8 <= moovPayloadEnd) {
    const childSize = view.getUint32(childOffset);
    const childType = String.fromCharCode(
      data[childOffset + 4],
      data[childOffset + 5],
      data[childOffset + 6],
      data[childOffset + 7]
    );

    if (childSize <= 0 || childOffset + childSize > moovPayloadEnd) {
      break;
    }

    if (childType === "trak") {
      // Check track handler type in trak -> mdia -> hdlr
      const isAudio = isAudioTrack(data, childOffset, childSize);
      if (isAudio) {
        audioTrackCount++;
        // Skip this trak (strip audio!)
      } else {
        videoTrackCount++;
        keptChildChunks.push(data.subarray(childOffset, childOffset + childSize));
      }
    } else {
      // Keep all non-trak moov children (mvhd, udta, etc.)
      keptChildChunks.push(data.subarray(childOffset, childOffset + childSize));
    }

    childOffset += childSize;
  }

  if (audioTrackCount === 0) {
    // Already silent / no audio track
    return new Uint8Array(arrayBuffer);
  }

  if (videoTrackCount === 0) {
    throw new Error("Cannot strip audio: MP4 file contains no video track.");
  }

  // Calculate new moov size
  let newMoovPayloadSize = 0;
  for (const chunk of keptChildChunks) {
    newMoovPayloadSize += chunk.length;
  }
  const newMoovTotalSize = 8 + newMoovPayloadSize;

  // Build new moov box
  const newMoov = new Uint8Array(newMoovTotalSize);
  const newMoovView = new DataView(newMoov.buffer);
  newMoovView.setUint32(0, newMoovTotalSize);
  newMoov[4] = "m".charCodeAt(0);
  newMoov[5] = "o".charCodeAt(0);
  newMoov[6] = "o".charCodeAt(0);
  newMoov[7] = "v".charCodeAt(0);

  let writeOffset = 8;
  for (const chunk of keptChildChunks) {
    newMoov.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }

  // Assemble full output: prefix before moov + new moov + remainder after moov
  const prefix = data.subarray(0, moovOffset);
  const suffix = data.subarray(moovOffset + moovSize);
  const result = new Uint8Array(prefix.length + newMoov.length + suffix.length);

  result.set(prefix, 0);
  result.set(newMoov, prefix.length);
  result.set(suffix, prefix.length + newMoov.length);

  return result;
}

/**
 * Inspects a 'trak' box to determine if its handler is 'soun' (Audio).
 */
function isAudioTrack(data: Uint8Array, trakOffset: number, trakSize: number): boolean {
  const trakEnd = trakOffset + trakSize;
  // Scan within trak for 'hdlr'
  for (let i = trakOffset; i + 12 <= trakEnd; i++) {
    if (
      data[i + 4] === "h".charCodeAt(0) &&
      data[i + 5] === "d".charCodeAt(0) &&
      data[i + 6] === "l".charCodeAt(0) &&
      data[i + 7] === "r".charCodeAt(0)
    ) {
      // Inside hdlr: offset 8 is version(1) + flags(3), offset 12 is pre_defined(4), offset 16 is handler_type(4)
      if (i + 20 <= trakEnd) {
        const handler = String.fromCharCode(
          data[i + 16],
          data[i + 17],
          data[i + 18],
          data[i + 19]
        );
        return handler === "soun";
      }
    }
  }
  return false;
}

// ==========================================
// 2. VIDEO TO AUDIO EXTRACTION (WAV ENCODER)
// ==========================================

/**
 * Extracts the audio track from any video file into raw Float32 PCM channels
 * and generates a high-fidelity 16-bit WAV file in local RAM.
 */
export async function extractAudioFromVideo(
  videoFile: File | Blob
): Promise<ExtractedAudioResult> {
  const arrayBuffer = await videoFile.arrayBuffer();

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  try {
    // decodeAudioData consumes the slice
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    const channelData: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channelData.push(audioBuffer.getChannelData(c));
    }

    // Encode to 16-bit uncompressed PCM WAV
    const wavBuffer = encodeWav(channelData, sampleRate);
    const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
    const waveformPeaks = extractWaveformPeaks(channelData[0], 120);

    return {
      audioBuffer,
      channelData,
      sampleRate,
      duration,
      numChannels,
      wavBlob,
      waveformPeaks,
      sizeBytes: wavBlob.size,
    };
  } finally {
    audioCtx.close();
  }
}

/**
 * Encodes audio channel data (Float32Array) into a standard 16-bit PCM WAV file.
 */
export function encodeWav(channelData: Float32Array[], sampleRate: number): ArrayBuffer {
  const numChannels = channelData.length;
  const numSamples = channelData[0].length;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF header
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");

  // fmt subchunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bitsPerSample

  // data subchunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Write interleaved 16-bit samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return buffer;
}

/**
 * Extracts waveform peak bars from audio channel data for UI visualization.
 */
export function extractWaveformPeaks(channelData: Float32Array, numBars: number): number[] {
  const step = Math.floor(channelData.length / numBars);
  const peaks: number[] = [];

  for (let i = 0; i < numBars; i++) {
    const start = i * step;
    const end = Math.min(start + step, channelData.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) max = abs;
    }
    peaks.push(max);
  }

  return peaks;
}

/**
 * Encodes Float32 audio samples into a standard MP3 binary buffer using LAME.
 */
export function encodeMp3(
  leftSamples: Float32Array,
  rightSamples: Float32Array | null,
  sampleRate: number,
  kbps: number = 192
): Uint8Array {
  const numChannels = rightSamples ? 2 : 1;
  const numSamples = leftSamples.length;

  const leftInt16 = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, leftSamples[i]));
    leftInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  let rightInt16: Int16Array | undefined = undefined;
  if (rightSamples) {
    rightInt16 = new Int16Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, rightSamples[i]));
      rightInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
  }

  const encoder = new Mp3Encoder(numChannels, sampleRate, kbps);
  const mp3Data: Uint8Array[] = [];
  const blockSize = 1152;

  for (let i = 0; i < numSamples; i += blockSize) {
    const leftChunk = leftInt16.subarray(i, i + blockSize);
    const rightChunk = rightInt16 ? rightInt16.subarray(i, i + blockSize) : undefined;
    const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const endBuf = encoder.flush();
  if (endBuf.length > 0) {
    mp3Data.push(endBuf);
  }

  let totalLen = 0;
  for (const chunk of mp3Data) totalLen += chunk.length;
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of mp3Data) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

// CRC-8 table for FLAC header (poly 0x07)
const flacCrc8Table = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  let temp = i;
  for (let j = 0; j < 8; j++) {
    temp = temp & 0x80 ? ((temp << 1) ^ 0x07) & 0xff : (temp << 1) & 0xff;
  }
  flacCrc8Table[i] = temp;
}
function flacCrc8(buf: Uint8Array): number {
  let c = 0;
  for (let i = 0; i < buf.length; i++) c = flacCrc8Table[c ^ buf[i]];
  return c;
}

// CRC-16 table for FLAC frame (poly 0x8005)
const flacCrc16Table = new Uint16Array(256);
for (let i = 0; i < 256; i++) {
  let temp = i << 8;
  for (let j = 0; j < 8; j++) {
    temp = temp & 0x8000 ? ((temp << 1) ^ 0x8005) & 0xffff : (temp << 1) & 0xffff;
  }
  flacCrc16Table[i] = temp;
}
function flacCrc16(buf: Uint8Array): number {
  let c = 0;
  for (let i = 0; i < buf.length; i++) {
    c = ((c << 8) & 0xffff) ^ flacCrc16Table[((c >> 8) ^ buf[i]) & 0xff];
  }
  return c;
}

/**
 * Encodes Float32 audio samples into a standard FLAC (Free Lossless Audio Codec) binary buffer.
 */
export function encodeFlac(
  leftSamples: Float32Array,
  rightSamples: Float32Array | null,
  sampleRate: number
): Uint8Array {
  const numChannels = rightSamples ? 2 : 1;
  const numSamples = leftSamples.length;
  const blockSize = 4096;

  const leftInt16 = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, leftSamples[i]));
    leftInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  let rightInt16: Int16Array | null = null;
  if (rightSamples) {
    rightInt16 = new Int16Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, rightSamples[i]));
      rightInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
  }

  const bytes: number[] = [];
  function writeByte(b: number) { bytes.push(b & 0xff); }
  function writeBytes(arr: number[] | Uint8Array) { for (let i = 0; i < arr.length; i++) bytes.push(arr[i]); }
  function write16(w: number) { bytes.push((w >> 8) & 0xff, w & 0xff); }
  function write24(w: number) { bytes.push((w >> 16) & 0xff, (w >> 8) & 0xff, w & 0xff); }
  function write32(w: number) { bytes.push((w >> 24) & 0xff, (w >> 16) & 0xff, (w >> 8) & 0xff, w & 0xff); }

  // 1. "fLaC" signature
  writeByte(0x66); writeByte(0x4c); writeByte(0x61); writeByte(0x43);

  // 2. STREAMINFO metadata block (last=1, type=0, len=34)
  writeByte(0x80);
  write24(34);
  write16(blockSize); // min blocksize
  write16(blockSize); // max blocksize
  write24(0); // min framesize
  write24(0); // max framesize

  // 20 bits sampleRate, 3 bits (numChannels-1), 5 bits (bitsPerSample-1 = 15)
  const b14 = (sampleRate >> 12) & 0xff;
  const b15 = (sampleRate >> 4) & 0xff;
  const b16 = ((sampleRate & 0x0f) << 4) | ((numChannels - 1) << 1) | 0;
  const b17 = (15 << 4) | (Math.floor(numSamples / 0x100000000) & 0x0f);
  writeByte(b14); writeByte(b15); writeByte(b16); writeByte(b17);
  write32(numSamples & 0xffffffff);

  // 16 bytes MD5
  for (let i = 0; i < 16; i++) writeByte(0);

  // 3. Audio Frames
  const totalFrames = Math.ceil(numSamples / blockSize);
  for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
    const curStart = frameIdx * blockSize;
    const curBlockLen = Math.min(blockSize, numSamples - curStart);

    const headerBytes: number[] = [];
    headerBytes.push(0xff, 0xf8);
    headerBytes.push((0x07 << 4) | 0x00);
    headerBytes.push(((numChannels === 2 ? 1 : 0) << 4) | (4 << 1) | 0);

    if (frameIdx < 0x80) {
      headerBytes.push(frameIdx);
    } else if (frameIdx < 0x800) {
      headerBytes.push(0xc0 | (frameIdx >> 6), 0x80 | (frameIdx & 0x3f));
    } else {
      headerBytes.push(0xe0 | (frameIdx >> 12), 0x80 | ((frameIdx >> 6) & 0x3f), 0x80 | (frameIdx & 0x3f));
    }

    headerBytes.push(((curBlockLen - 1) >> 8) & 0xff, (curBlockLen - 1) & 0xff);

    const headerCrc = flacCrc8(new Uint8Array(headerBytes));
    headerBytes.push(headerCrc);

    const framePayload = [...headerBytes];
    for (let ch = 0; ch < numChannels; ch++) {
      const src = ch === 0 ? leftInt16 : rightInt16!;
      framePayload.push(0x04); // verbatim subframe
      for (let s = 0; s < curBlockLen; s++) {
        const val = src[curStart + s];
        framePayload.push((val >> 8) & 0xff, val & 0xff);
      }
    }

    const frameCrc = flacCrc16(new Uint8Array(framePayload));
    framePayload.push((frameCrc >> 8) & 0xff, frameCrc & 0xff);

    writeBytes(framePayload);
  }

  return new Uint8Array(bytes);
}

/**
 * Converts any audio file (MP3, WAV, FLAC, OGG, M4A, AAC) to MP3, WAV, or FLAC with optional effects.
 */
export async function convertAudioFile(
  file: File | Blob,
  options: AudioConvertOptions
): Promise<{ blob: Blob; sizeBytes: number; duration: number; format: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const numChannels = audioBuffer.numberOfChannels;
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(audioBuffer.getChannelData(ch));
  }

  const processed = processAudioData(channelData, audioBuffer.sampleRate, {
    gain: options.gain,
    normalize: options.normalize,
    mono: options.mono,
  });

  const outRate = options.sampleRate || audioBuffer.sampleRate;
  const left = processed.channelData[0];
  const right = processed.channelData.length > 1 ? processed.channelData[1] : null;

  let outBlob: Blob;
  if (options.format === "mp3") {
    const mp3Bytes = encodeMp3(left, right, outRate, options.bitrateKbps || 192);
    outBlob = new Blob([mp3Bytes as unknown as BlobPart], { type: "audio/mp3" });
  } else if (options.format === "flac") {
    const flacBytes = encodeFlac(left, right, outRate);
    outBlob = new Blob([flacBytes as unknown as BlobPart], { type: "audio/flac" });
  } else {
    const wavBuf = encodeWav(processed.channelData, outRate);
    outBlob = new Blob([wavBuf], { type: "audio/wav" });
  }

  audioCtx.close();

  return {
    blob: outBlob,
    sizeBytes: outBlob.size,
    duration: processed.newDuration,
    format: options.format,
  };
}

// ==========================================
// 3. AUDIO PROCESSING & TRANSCODING
// ==========================================

export interface AudioProcessOptions {
  toMono?: boolean;
  mono?: boolean;
  gain?: number; // 1.0 = normal, 1.5 = +50%, 0.5 = -50%
  normalize?: boolean;
  sampleRate?: number;
  startSec?: number;
  startTimeSec?: number;
  endSec?: number;
  endTimeSec?: number;
}

/**
 * Processes audio channel data: gain, normalization, mono mixdown, trimming, and WAV export.
 */
export function processAudioData(
  channelData: Float32Array[],
  sampleRate: number,
  options: AudioProcessOptions = {}
): {
  processedWav: Blob;
  newPeaks: number[];
  newDuration: number;
  channelData: Float32Array[];
  numChannels: number;
} {
  const numChannels = channelData.length;
  const origLen = channelData[0].length;

  const sSec = options.startTimeSec !== undefined ? options.startTimeSec : options.startSec || 0;
  const eSec = options.endTimeSec !== undefined ? options.endTimeSec : options.endSec;

  const startSample = Math.max(0, Math.floor(sSec * sampleRate));
  const endSample = Math.min(
    origLen,
    eSec !== undefined ? Math.floor(eSec * sampleRate) : origLen
  );
  const targetLen = Math.max(0, endSample - startSample);

  let outputChannels: Float32Array[] = [];
  const isMono = Boolean(options.toMono || options.mono);

  if (isMono && numChannels > 1) {
    const mono = new Float32Array(targetLen);
    for (let i = 0; i < targetLen; i++) {
      let sum = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        sum += channelData[ch][startSample + i];
      }
      mono[i] = sum / numChannels;
    }
    outputChannels = [mono];
  } else {
    for (let ch = 0; ch < numChannels; ch++) {
      const sliced = channelData[ch].subarray(startSample, endSample);
      outputChannels.push(new Float32Array(sliced));
    }
  }

  // Apply Gain & Normalization
  let maxPeak = 0;
  for (const ch of outputChannels) {
    for (let i = 0; i < ch.length; i++) {
      const abs = Math.abs(ch[i]);
      if (abs > maxPeak) maxPeak = abs;
    }
  }

  let multiplier = options.gain !== undefined ? options.gain : 1.0;
  if (options.normalize && maxPeak > 0) {
    multiplier = 0.98 / maxPeak; // Leave -0.2dB headroom
  }

  if (multiplier !== 1.0) {
    for (const ch of outputChannels) {
      for (let i = 0; i < ch.length; i++) {
        ch[i] = Math.max(-1, Math.min(1, ch[i] * multiplier));
      }
    }
  }

  const outRate = options.sampleRate || sampleRate;
  const wavBuffer = encodeWav(outputChannels, outRate);
  const processedWav = new Blob([wavBuffer], { type: "audio/wav" });
  const newPeaks = extractWaveformPeaks(outputChannels[0], 120);
  const newDuration = targetLen / outRate;

  return {
    processedWav,
    newPeaks,
    newDuration,
    channelData: outputChannels,
    numChannels: outputChannels.length,
  };
}

// ==========================================
// 4. VIDEO TRANSCODER, SCALER & RECORDER
// ==========================================

/**
 * Calculates scaled video dimensions adhering to preset bounding box while preserving aspect ratio.
 */
export function calculateScaledDimensions(
  origW: number,
  origH: number,
  preset: "original" | "1080p" | "720p" | "480p" | "360p"
): { width: number; height: number } {
  if (preset === "original") return { width: origW, height: origH };

  const bounds: Record<string, { maxW: number; maxH: number }> = {
    "1080p": { maxW: 1920, maxH: 1080 },
    "720p": { maxW: 1280, maxH: 720 },
    "480p": { maxW: 854, maxH: 480 },
    "360p": { maxW: 640, maxH: 360 },
  };

  const { maxW, maxH } = bounds[preset];
  if (origW <= maxW && origH <= maxH) {
    return { width: origW, height: origH };
  }

  const ratio = Math.min(maxW / origW, maxH / origH);
  let w = Math.round(origW * ratio);
  let h = Math.round(origH * ratio);
  // Dimensions must be even for video codecs
  if (w % 2 !== 0) w -= 1;
  if (h % 2 !== 0) h -= 1;

  return { width: w, height: h };
}

/**
 * Transcodes, downscales, or trims a video using HTML5 Canvas and MediaRecorder.
 */
export async function transcodeVideo(
  videoBlob: Blob,
  options: TranscodeOptions = {}
): Promise<{ blob: Blob; width: number; height: number; duration: number; format: string }> {
  return new Promise(async (resolve, reject) => {
    let resolved = false;
    let animFrameId: number = 0;
    let videoUrl = "";

    const cleanup = () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (audioCtx) {
        try {
          audioCtx.close();
        } catch {}
      }
    };

    const fail = (err: Error) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      reject(err);
    };

    videoUrl = URL.createObjectURL(videoBlob);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true; // Always muted so browser never blocks video.play()!
    video.playsInline = true;
    video.src = videoUrl;

    // Attach offscreen to DOM temporarily so browser doesn't throttle decoding
    video.style.position = "fixed";
    video.style.top = "-99999px";
    video.style.left = "-99999px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    document.body.appendChild(video);

    let audioCtx: AudioContext | null = null;
    let audioSourceNode: AudioBufferSourceNode | null = null;

    video.onloadedmetadata = async () => {
      const origW = video.videoWidth || 640;
      const origH = video.videoHeight || 360;
      let origDur = video.duration;
      if (!isFinite(origDur) || isNaN(origDur) || origDur <= 0) {
        origDur = await resolveAccurateVideoDuration(videoBlob, video);
      }

      const { width, height } = calculateScaledDimensions(
        origW,
        origH,
        options.resolution || "original"
      );

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        if (document.body.contains(video)) document.body.removeChild(video);
        fail(new Error("Could not initialize 2D Canvas rendering context."));
        return;
      }

      const fps = options.fps || 30;
      const canvasStream = canvas.captureStream(fps);
      let combinedStream = canvasStream;

      // Extract and mix audio if requested
      if (options.includeAudio) {
        try {
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtx = new AudioContextClass();
          const arrayBuffer = await videoBlob.arrayBuffer();
          const decoded = await audioCtx.decodeAudioData(arrayBuffer);

          audioSourceNode = audioCtx.createBufferSource();
          audioSourceNode.buffer = decoded;
          const dest = audioCtx.createMediaStreamDestination();
          audioSourceNode.connect(dest);

          const audioTrack = dest.stream.getAudioTracks()[0];
          if (audioTrack) {
            combinedStream = new MediaStream([
              canvasStream.getVideoTracks()[0],
              audioTrack,
            ]);
          }
        } catch (audioErr) {
          console.warn("Audio extraction for transcode failed, proceeding video-only:", audioErr);
        }
      }

      // Format & Codec selection
      const requestedFormat = options.format || "webm";
      let selectedMime = "video/webm";

      if (requestedFormat === "mp4") {
        const mp4Types = [
          "video/mp4;codecs=avc1,mp4a.40.2",
          "video/mp4;codecs=avc1",
          "video/mp4",
        ];
        for (const t of mp4Types) {
          if (MediaRecorder.isTypeSupported(t)) {
            selectedMime = t;
            break;
          }
        }
      } else {
        const webmTypes = [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
        ];
        for (const t of webmTypes) {
          if (MediaRecorder.isTypeSupported(t)) {
            selectedMime = t;
            break;
          }
        }
      }

      const bitrate = (options.bitrateMbps || 2.5) * 1_000_000;
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(combinedStream, {
          mimeType: selectedMime,
          videoBitsPerSecond: bitrate,
        });
      } catch {
        recorder = new MediaRecorder(combinedStream);
        selectedMime = recorder.mimeType || "video/webm";
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const startSec = Math.max(0, options.startTimeSec || 0);
      const endSec = Math.min(
        origDur,
        options.endTimeSec !== undefined ? options.endTimeSec : origDur
      );
      const totalProcessDur = Math.max(0.1, endSec - startSec);

      let isFinished = false;
      const finish = () => {
        if (isFinished) return;
        isFinished = true;
        if (recorder.state === "recording") {
          recorder.stop();
        }
      };

      recorder.onstop = () => {
        if (resolved) return;
        resolved = true;
        if (document.body.contains(video)) {
          document.body.removeChild(video);
        }
        cleanup();

        const formatExt = selectedMime.includes("mp4") ? "mp4" : "webm";
        const outBlob = new Blob(chunks, { type: selectedMime });
        resolve({
          blob: outBlob,
          width,
          height,
          duration: totalProcessDur,
          format: formatExt,
        });
      };

      const drawLoop = () => {
        if (isFinished || video.paused || video.ended || video.currentTime >= endSec) {
          finish();
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);

        if (options.onProgress) {
          const cur = video.currentTime - startSec;
          const prog = Math.min(99, Math.max(0, Math.round((cur / totalProcessDur) * 100)));
          options.onProgress(prog);
        }

        animFrameId = requestAnimationFrame(drawLoop);
      };

      const startPlayback = async () => {
        try {
          recorder.start(100);
          if (audioSourceNode) {
            audioSourceNode.start(0, startSec);
          }
          await video.play();
          drawLoop();
        } catch (playErr) {
          if (document.body.contains(video)) document.body.removeChild(video);
          fail(
            playErr instanceof Error
              ? playErr
              : new Error("Failed to play video during transcoding.")
          );
        }
      };

      // Watchdog timeout: video duration + 8 seconds max
      const maxTimeoutMs = (totalProcessDur + 8) * 1000;
      const timeoutTimer = setTimeout(() => {
        if (!isFinished) {
          finish();
        }
      }, maxTimeoutMs);

      video.ontimeupdate = () => {
        if (video.currentTime >= endSec) {
          clearTimeout(timeoutTimer);
          finish();
        }
      };

      video.onended = () => {
        clearTimeout(timeoutTimer);
        finish();
      };

      // Crucial fix: If already at startSec, start immediately!
      if (Math.abs(video.currentTime - startSec) < 0.05) {
        startPlayback();
      } else {
        video.currentTime = startSec;
        video.onseeked = () => {
          video.onseeked = null;
          startPlayback();
        };
      }
    };

    video.onerror = () => {
      if (document.body.contains(video)) document.body.removeChild(video);
      fail(new Error("Failed to load video file for processing."));
    };
  });
}

// ==========================================
// 5. VIDEO TO ANIMATED GIF GENERATOR (GIF89a)
// ==========================================

/**
 * Pure client-side animated GIF encoder with LZW compression and color quantization.
 */
export async function convertVideoToGif(
  videoBlob: Blob,
  options: GifConvertOptions = {}
): Promise<{ blob: Blob; sizeBytes: number; frameCount: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const videoUrl = URL.createObjectURL(videoBlob);
    video.src = videoUrl;

    video.onloadedmetadata = async () => {
      let origDur = video.duration;
      if (!isFinite(origDur) || isNaN(origDur) || origDur <= 0) {
        origDur = await resolveAccurateVideoDuration(videoBlob, video);
      }
      const startSec = Math.max(0, options.startTimeSec || 0);
      const endSec = Math.min(origDur, options.endTimeSec !== undefined ? options.endTimeSec : origDur);
      const targetWidth = options.width || 400;
      const targetFps = options.fps || 10;
      const frameInterval = 1 / targetFps;
      const totalFrames = Math.max(1, Math.floor((endSec - startSec) * targetFps));

      const ratio = targetWidth / video.videoWidth;
      const targetHeight = Math.round(video.videoHeight * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        URL.revokeObjectURL(videoUrl);
        reject(new Error("Failed to create canvas 2D context for GIF."));
        return;
      }

      const framesData: ImageData[] = [];
      let currentSeek = startSec;

      const onFrameReady = () => {
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        framesData.push(ctx.getImageData(0, 0, targetWidth, targetHeight));

        if (options.onProgress) {
          const prog = Math.round((framesData.length / totalFrames) * 50);
          options.onProgress(prog);
        }

        currentSeek += frameInterval;
        captureNextFrame();
      };

      const captureNextFrame = () => {
        if (currentSeek > endSec || framesData.length >= totalFrames) {
          // All frames captured; encode GIF!
          URL.revokeObjectURL(videoUrl);
          try {
            const gifBuffer = encodeGifFrames(
              framesData,
              targetWidth,
              targetHeight,
              Math.round(100 / targetFps),
              (p) => {
                if (options.onProgress) {
                  options.onProgress(50 + Math.round(p * 0.5));
                }
              }
            );
            const gifBlob = new Blob([gifBuffer as unknown as BlobPart], { type: "image/gif" });
            resolve({
              blob: gifBlob,
              sizeBytes: gifBlob.size,
              frameCount: framesData.length,
            });
          } catch (err) {
            reject(err);
          }
          return;
        }

        if (Math.abs(video.currentTime - currentSeek) < 0.001) {
          onFrameReady();
        } else {
          video.currentTime = currentSeek;
        }
      };

      video.onseeked = () => {
        onFrameReady();
      };

      captureNextFrame();
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error("Failed to load video file for GIF export."));
    };
  });
}

/**
 * Encodes multiple ImageData frames into a standard GIF89a binary buffer.
 */
function encodeGifFrames(
  frames: ImageData[],
  width: number,
  height: number,
  delayCentisecs: number,
  onProgress?: (percent: number) => void
): Uint8Array {
  const bytes: number[] = [];
  function writeByte(b: number) { bytes.push(b & 0xff); }
  function writeWord(w: number) { bytes.push(w & 0xff, (w >> 8) & 0xff); }
  function writeString(s: string) {
    for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i));
  }

  // 1. GIF Header & Logical Screen Descriptor
  writeString("GIF89a");
  writeWord(width);
  writeWord(height);
  // GCT Flag (0), Color Resolution (7 = 8-bit), Sort (0), Global Color Table Size (0)
  writeByte(0x70);
  writeByte(0); // Background color index
  writeByte(0); // Pixel aspect ratio

  // 2. Netscape Application Extension for Looping
  writeByte(0x21); // Extension Introducer
  writeByte(0xff); // Application Extension Label
  writeByte(11); // Block Size
  writeString("NETSCAPE2.0");
  writeByte(3); // Sub-block Length
  writeByte(1); // Sub-block ID
  writeWord(0); // Loop count (0 = infinite)
  writeByte(0); // Block Terminator

  // 3. Process Each Frame
  for (let fIdx = 0; fIdx < frames.length; fIdx++) {
    const frame = frames[fIdx];
    const { palette, indexedPixels } = quantizeFrameTo256Colors(frame.data);

    // Graphic Control Extension (Frame Delay)
    writeByte(0x21); // Extension Introducer
    writeByte(0xf9); // Graphic Control Label
    writeByte(4); // Block Size
    writeByte(0x04); // Packed: Disposal = Do not dispose (1 << 2)
    writeWord(delayCentisecs); // Delay time in 1/100ths of a second
    writeByte(0); // Transparent color index
    writeByte(0); // Block Terminator

    // Image Descriptor
    writeByte(0x2c); // Image Separator
    writeWord(0); // Left position
    writeWord(0); // Top position
    writeWord(width);
    writeWord(height);
    // Local Color Table Flag (1), Interlace (0), Sort (0), LCT Size (7 = 256 colors)
    writeByte(0x87);

    // Write Local Color Table (256 * 3 = 768 bytes)
    for (let i = 0; i < 256; i++) {
      const color = palette[i] || [0, 0, 0];
      writeByte(color[0]);
      writeByte(color[1]);
      writeByte(color[2]);
    }

    // LZW Minimum Code Size (8 for 256 colors)
    const lzwMinCodeSize = 8;
    writeByte(lzwMinCodeSize);

    // LZW Compression
    const compressed = lzwCompress(indexedPixels, lzwMinCodeSize);
    let cOffset = 0;
    while (cOffset < compressed.length) {
      const chunkSize = Math.min(255, compressed.length - cOffset);
      writeByte(chunkSize);
      for (let c = 0; c < chunkSize; c++) {
        writeByte(compressed[cOffset + c]);
      }
      cOffset += chunkSize;
    }
    writeByte(0); // Block Terminator

    if (onProgress) {
      onProgress(Math.round(((fIdx + 1) / frames.length) * 100));
    }
  }

  // GIF Trailer
  writeByte(0x3b);

  return new Uint8Array(bytes);
}

/**
 * Fast color quantization mapping RGBA pixels to a 256-color palette.
 */
function quantizeFrameTo256Colors(
  rgbaData: Uint8ClampedArray
): { palette: number[][]; indexedPixels: Uint8Array } {
  // Use a 6x6x6 color cube (216 colors) + 40 grayscale levels = 256 colors
  const palette: number[][] = [];

  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        palette.push([
          Math.round((r / 5) * 255),
          Math.round((g / 5) * 255),
          Math.round((b / 5) * 255),
        ]);
      }
    }
  }
  // 40 grayscale steps
  for (let i = 0; i < 40; i++) {
    const v = Math.round((i / 39) * 255);
    palette.push([v, v, v]);
  }

  const numPixels = rgbaData.length / 4;
  const indexedPixels = new Uint8Array(numPixels);

  for (let i = 0; i < numPixels; i++) {
    const r = rgbaData[i * 4];
    const g = rgbaData[i * 4 + 1];
    const b = rgbaData[i * 4 + 2];

    const rIdx = Math.min(5, Math.floor((r / 256) * 6));
    const gIdx = Math.min(5, Math.floor((g / 256) * 6));
    const bIdx = Math.min(5, Math.floor((b / 256) * 6));
    indexedPixels[i] = rIdx * 36 + gIdx * 6 + bIdx;
  }

  return { palette, indexedPixels };
}

/**
 * Standard LZW encoder for GIF image data.
 */
function lzwCompress(pixels: Uint8Array, minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize; // 256
  const endCode = clearCode + 1; // 257

  let codeSize = minCodeSize + 1; // 9
  let nextCode = endCode + 1; // 258

  const dictionary = new Map<string, number>();
  function initDict() {
    dictionary.clear();
    for (let i = 0; i < clearCode; i++) {
      dictionary.set(String(i), i);
    }
  }
  initDict();

  const outBytes: number[] = [];
  let bitBuf = 0;
  let bitCount = 0;

  function writeBits(val: number, bits: number) {
    bitBuf |= (val & ((1 << bits) - 1)) << bitCount;
    bitCount += bits;
    while (bitCount >= 8) {
      outBytes.push(bitBuf & 0xff);
      bitBuf >>= 8;
      bitCount -= 8;
    }
  }

  writeBits(clearCode, codeSize);

  let curPrefix = "";

  for (let i = 0; i < pixels.length; i++) {
    const k = String(pixels[i]);
    const phrase = curPrefix === "" ? k : `${curPrefix},${k}`;

    if (dictionary.has(phrase)) {
      curPrefix = phrase;
    } else {
      writeBits(dictionary.get(curPrefix)!, codeSize);
      dictionary.set(phrase, nextCode++);

      if (nextCode > (1 << codeSize) && codeSize < 12) {
        codeSize++;
      } else if (nextCode >= 4096) {
        writeBits(clearCode, codeSize);
        initDict();
        codeSize = minCodeSize + 1;
        nextCode = endCode + 1;
      }

      curPrefix = k;
    }
  }

  if (curPrefix !== "") {
    writeBits(dictionary.get(curPrefix)!, codeSize);
  }

  writeBits(endCode, codeSize);

  if (bitCount > 0) {
    outBytes.push(bitBuf & 0xff);
  }

  return outBytes;
}

// ==========================================
// 6. SYNTHETIC SAMPLE MEDIA GENERATORS
// ==========================================

/**
 * Generates an in-memory 3-second animated WebM video with audio chime
 * for instant client-side testing without uploading files.
 */
export async function generateSampleVideo(): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d")!;

  const fps = 30;
  const durationSec = 3;
  const totalFrames = fps * durationSec;

  const canvasStream = canvas.captureStream(fps);

  // Synthesize audio tone
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const dest = audioCtx.createMediaStreamDestination();

  // Gentle synth chord
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc1.type = "sine";
  osc1.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(554.37, audioCtx.currentTime); // C#5

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + durationSec);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(dest);

  osc1.start();
  osc2.start();

  const combinedStream = new MediaStream([
    canvasStream.getVideoTracks()[0],
    dest.stream.getAudioTracks()[0],
  ]);

  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
    ? "video/webm;codecs=vp8,opus"
    : "video/webm";

  const recorder = new MediaRecorder(combinedStream, { mimeType: mime });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    recorder.onstop = () => {
      osc1.stop();
      osc2.stop();
      audioCtx.close();
      const blob = new Blob(chunks, { type: "video/webm" });
      const file = new File([blob], "privatools_sample_video.webm", {
        type: "video/webm",
      });
      resolve(file);
    };

    recorder.start(100);

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const angle = progress * Math.PI * 4;

      // Draw background
      const grad = ctx.createLinearGradient(0, 0, 640, 360);
      grad.addColorStop(0, "#0f172a");
      grad.addColorStop(1, "#1e293b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 360);

      // Draw rotating neon geometry
      ctx.save();
      ctx.translate(320, 180);
      ctx.rotate(angle);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 4;
      ctx.strokeRect(-60, -60, 120, 120);
      ctx.restore();

      // Draw pulsating circle
      const radius = 30 + Math.sin(progress * Math.PI * 6) * 15;
      ctx.beginPath();
      ctx.arc(320, 180, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(16, 185, 129, 0.4)";
      ctx.fill();

      // Text HUD
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.fillText("PRIVATOOLS LOCAL MEDIA LAB", 320, 70);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px monospace";
      const remSec = (durationSec - progress * durationSec).toFixed(1);
      ctx.fillText(`60FPS HD • Audio Enabled • T-${remSec}s`, 320, 310);

      if (frame >= totalFrames) {
        clearInterval(interval);
        recorder.stop();
      }
    }, 1000 / fps);
  });
}

/**
 * Resolves a finite, positive duration (in seconds) for a video file or element.
 * Browsers often report `Infinity` or `0` for streaming/MediaRecorder WebM blobs.
 */
export async function resolveAccurateVideoDuration(
  fileOrBlob: Blob,
  videoElement?: HTMLVideoElement
): Promise<number> {
  // 1. If videoElement already has a valid, finite duration > 0:
  if (
    videoElement &&
    isFinite(videoElement.duration) &&
    !isNaN(videoElement.duration) &&
    videoElement.duration > 0
  ) {
    return Number(videoElement.duration.toFixed(2));
  }

  // 2. Probe audio track if present (very fast and accurate for MediaRecorder clips)
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      const buf = await ctx.decodeAudioData(await fileOrBlob.slice(0).arrayBuffer());
      if (buf.duration && isFinite(buf.duration) && buf.duration > 0) {
        ctx.close();
        return Number(buf.duration.toFixed(2));
      }
      ctx.close();
    }
  } catch {
    // Audio decoding failed or silent video
  }

  // 3. Fallback: seek to large number if video element provided
  if (videoElement) {
    try {
      const seekDur = await new Promise<number>((resolve) => {
        const timeout = setTimeout(() => resolve(3), 500);
        videoElement.onseeked = () => {
          clearTimeout(timeout);
          const dur =
            isFinite(videoElement.duration) && videoElement.duration > 0
              ? videoElement.duration
              : isFinite(videoElement.currentTime) && videoElement.currentTime > 0
              ? videoElement.currentTime
              : 3;
          resolve(Number(dur.toFixed(2)));
        };
        videoElement.currentTime = 1e101;
      });
      return seekDur;
    } catch {
      return 3;
    }
  }

  return 3;
}

/**
 * Inspects video dimensions, duration, aspect ratio, and audio presence.
 */
export async function inspectVideoMetadata(file: File | Blob): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    let isCleanedUp = false;
    const cleanup = () => {
      if (!isCleanedUp) {
        isCleanedUp = true;
        URL.revokeObjectURL(url);
      }
    };

    video.onloadedmetadata = async () => {
      let dur = video.duration;
      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const g = gcd(w, h) || 1;
      const aspect = w > 0 && h > 0 ? `${Math.round(w / g)}:${Math.round(h / g)}` : "N/A";

      let hasAudio = true;
      if ("webkitAudioDecodedByteCount" in video) {
        hasAudio = (video as unknown as { webkitAudioDecodedByteCount: number }).webkitAudioDecodedByteCount > 0;
      }

      if (!dur || !isFinite(dur) || isNaN(dur) || dur <= 0) {
        dur = await resolveAccurateVideoDuration(file, video);
      }

      if (!isFinite(dur) || isNaN(dur) || dur <= 0) {
        dur = 3;
      }

      cleanup();
      resolve({
        duration: Number(dur.toFixed(2)),
        width: w,
        height: h,
        aspectRatio: aspect,
        hasAudio,
        sizeBytes: file.size,
        mimeType: file.type || "video/mp4",
      });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Unable to parse video metadata. The format may not be supported directly by this browser."));
    };
  });
}

/**
 * Generates a synthetic audio WAV file (ambient chime or voice frequency tone)
 * for testing audio extraction, normalization, and trimming.
 */
export function generateSampleAudioFile(type: "chime" | "tone" = "chime", durationSec: number = 3): File {
  const sampleRate = 44100;
  const totalSamples = sampleRate * durationSec;
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  if (type === "chime") {
    // Ambient chime chord (A4 440Hz, C#5 554.37Hz, E5 659.25Hz)
    const freqs = [440, 554.37, 659.25];
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-1.2 * (t % 1.0));
      let sampleVal = 0;
      for (const f of freqs) {
        sampleVal += Math.sin(2 * Math.PI * f * t) * 0.25;
      }
      left[i] = sampleVal * envelope;
      right[i] = sampleVal * envelope;
    }
  } else {
    // Voice Frequency Tone (440Hz Left, 880Hz Right)
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      left[i] = Math.sin(2 * Math.PI * 440 * t) * 0.3;
      right[i] = Math.sin(2 * Math.PI * 880 * t) * 0.3;
    }
  }

  const wavBuf = encodeWav([left, right], sampleRate);
  const blob = new Blob([wavBuf], { type: "audio/wav" });
  const filename =
    type === "chime"
      ? "privatools_ambient_chime.wav"
      : "privatools_voice_tone_440_880hz.wav";
  return new File([blob], filename, { type: "audio/wav" });
}

