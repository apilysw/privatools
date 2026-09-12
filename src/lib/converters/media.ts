// @ts-expect-error - exifr lite ESM bundle
import exifr from "exifr/dist/lite.esm.mjs";

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  dmsLat: string;
  dmsLon: string;
  googleMapsUrl: string;
  openStreetMapUrl: string;
}

export interface HardwareInfo {
  make?: string;
  model?: string;
  lensModel?: string;
  lensMake?: string;
  serialNumber?: string;
  bodySerialNumber?: string;
  software?: string;
  owner?: string;
}

export interface ExposureInfo {
  iso?: number;
  fNumber?: number;
  exposureTime?: number | string;
  focalLength?: number;
  flash?: string | number;
  whiteBalance?: string | number;
  meteringMode?: string | number;
}

export interface TimestampsInfo {
  dateTimeOriginal?: string;
  createDate?: string;
  modifyDate?: string;
  offsetTime?: string;
}

export interface PrivacyRiskReport {
  score: "High" | "Medium" | "Low" | "Clean";
  hasGps: boolean;
  hasHardwareId: boolean;
  hasTimestamps: boolean;
  risks: string[];
}

export interface ParsedMediaMetadata {
  gps?: GpsCoordinates;
  hardware: HardwareInfo;
  exposure: ExposureInfo;
  timestamps: TimestampsInfo;
  rawTags: Record<string, unknown>;
  tagCount: number;
}

export interface ScrubResult {
  blob: Blob;
  originalSize: number;
  scrubbedSize: number;
  savedBytes: number;
  format: string;
  durationMs: number;
}

// Convert decimal degrees to Degrees/Minutes/Seconds string
export function toDms(val: number, isLat: boolean): string {
  const ref = isLat ? (val >= 0 ? "N" : "S") : val >= 0 ? "E" : "W";
  const abs = Math.abs(val);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = (((abs - deg) * 60 - min) * 60).toFixed(2);
  return `${deg}° ${min}' ${sec}" ${ref}`;
}

/**
 * Parses and extracts all metadata from an image buffer using exifr.
 */
export async function inspectImageMetadata(
  input: Blob | File | ArrayBuffer | Uint8Array
): Promise<{
  metadata: ParsedMediaMetadata;
  riskReport: PrivacyRiskReport;
}> {
  let raw: Record<string, unknown> = {};
  try {
    raw = (await exifr.parse(input as unknown as Blob, {
      tiff: true,
      xmp: true,
      icc: true,
      iptc: true,
      jfif: true,
      ihdr: true,
      gps: true,
      mergeOutput: true,
    })) || {};
  } catch {
    raw = {};
  }

  // Extract GPS
  let gps: GpsCoordinates | undefined;
  const lat = typeof raw.latitude === "number" ? raw.latitude : undefined;
  const lon = typeof raw.longitude === "number" ? raw.longitude : undefined;

  if (lat !== undefined && lon !== undefined) {
    const altitude =
      typeof raw.GPSAltitude === "number"
        ? raw.GPSAltitude
        : typeof raw.altitude === "number"
        ? raw.altitude
        : undefined;

    gps = {
      latitude: lat,
      longitude: lon,
      altitude,
      dmsLat: toDms(lat, true),
      dmsLon: toDms(lon, false),
      googleMapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
      openStreetMapUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`,
    };
  }

  // Extract Hardware
  const hardware: HardwareInfo = {
    make: (raw.Make as string) || undefined,
    model: (raw.Model as string) || undefined,
    lensModel: (raw.LensModel as string) || undefined,
    lensMake: (raw.LensMake as string) || undefined,
    serialNumber: (raw.SerialNumber as string) || (raw.BodySerialNumber as string) || (raw["42033"] as string) || undefined,
    software: (raw.Software as string) || undefined,
    owner: (raw.CameraOwnerName as string) || (raw.Artist as string) || undefined,
  };

  // Extract Exposure
  const exposure: ExposureInfo = {
    iso: typeof raw.ISO === "number" ? raw.ISO : undefined,
    fNumber: typeof raw.FNumber === "number" ? raw.FNumber : undefined,
    exposureTime:
      typeof raw.ExposureTime === "number"
        ? raw.ExposureTime < 1
          ? `1/${Math.round(1 / raw.ExposureTime)}s`
          : `${raw.ExposureTime}s`
        : undefined,
    focalLength: typeof raw.FocalLength === "number" ? raw.FocalLength : undefined,
    flash: raw.Flash !== undefined ? String(raw.Flash) : undefined,
    whiteBalance: raw.WhiteBalance !== undefined ? String(raw.WhiteBalance) : undefined,
    meteringMode: raw.MeteringMode !== undefined ? String(raw.MeteringMode) : undefined,
  };

  // Extract Timestamps
  const timestamps: TimestampsInfo = {
    dateTimeOriginal: raw.DateTimeOriginal ? String(raw.DateTimeOriginal) : undefined,
    createDate: raw.CreateDate ? String(raw.CreateDate) : undefined,
    modifyDate: raw.ModifyDate ? String(raw.ModifyDate) : undefined,
    offsetTime: raw.OffsetTime ? String(raw.OffsetTime) : undefined,
  };

  // Assess Privacy Risks
  const risks: string[] = [];
  const hasGps = Boolean(gps);
  const hasHardwareId = Boolean(hardware.serialNumber || hardware.model || hardware.make);
  const hasTimestamps = Boolean(timestamps.dateTimeOriginal || timestamps.modifyDate);

  if (hasGps) {
    risks.push(`Exposed precise physical location coordinates (${gps?.dmsLat}, ${gps?.dmsLon})`);
  }
  if (hardware.serialNumber) {
    risks.push(`Exposed unique hardware serial number (${hardware.serialNumber})`);
  }
  if (hardware.model) {
    risks.push(`Exposed capture device model (${hardware.make || ""} ${hardware.model})`);
  }
  if (hasTimestamps) {
    risks.push(`Exposed exact capture timestamp (${timestamps.dateTimeOriginal || timestamps.modifyDate})`);
  }
  if (hardware.owner) {
    risks.push(`Exposed author / camera owner identity (${hardware.owner})`);
  }

  let score: PrivacyRiskReport["score"] = "Clean";
  if (hasGps || hardware.serialNumber) {
    score = "High";
  } else if (hasHardwareId || hasTimestamps) {
    score = "Medium";
  } else if (Object.keys(raw).length > 0) {
    score = "Low";
  }

  return {
    metadata: {
      gps,
      hardware,
      exposure,
      timestamps,
      rawTags: raw,
      tagCount: Object.keys(raw).length,
    },
    riskReport: {
      score,
      hasGps,
      hasHardwareId,
      hasTimestamps,
      risks,
    },
  };
}

/**
 * Losslessly strips metadata from a JPEG file by removing APP1..APP15 and COM markers.
 */
export function stripJpegLossless(inputBuffer: ArrayBuffer | Uint8Array): Uint8Array {
  const bytes = new Uint8Array(inputBuffer);
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error("Invalid JPEG signature");
  }

  const chunks: Uint8Array[] = [bytes.subarray(0, 2)]; // Keep SOI (0xFF, 0xD8)
  let offset = 2;
  const len = bytes.length;

  while (offset + 1 < len) {
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }

    // Skip consecutive 0xFF padding
    while (offset < len && bytes[offset] === 0xff) {
      offset++;
    }
    if (offset >= len) break;

    const marker = bytes[offset++];
    const markerStart = offset - 2;

    // Standalone markers
    if (marker === 0xd9) {
      // EOI
      chunks.push(new Uint8Array([0xff, 0xd9]));
      break;
    }
    if (marker >= 0xd0 && marker <= 0xd7) {
      // RST
      chunks.push(new Uint8Array([0xff, marker]));
      continue;
    }
    if (marker === 0x00 || marker === 0xff) {
      continue;
    }

    if (offset + 2 > len) break;
    const markerLen = (bytes[offset] << 8) | bytes[offset + 1];
    const markerEnd = offset + markerLen;

    if (marker === 0xda) {
      // SOS (Start of Scan) - remainder of file is image data
      chunks.push(bytes.subarray(markerStart));
      break;
    }

    // Skip metadata markers: APP1..APP15 (0xE1..0xEF) and COM (0xFE)
    const isMetadata = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (!isMetadata) {
      chunks.push(bytes.subarray(markerStart, markerEnd));
    }
    offset = markerEnd;
  }

  const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const c of chunks) {
    result.set(c, pos);
    pos += c.length;
  }
  return result;
}

/**
 * Losslessly strips metadata from a PNG file by removing text and EXIF chunks.
 */
export function stripPngLossless(inputBuffer: ArrayBuffer | Uint8Array): Uint8Array {
  const bytes = new Uint8Array(inputBuffer);
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== signature[i]) throw new Error("Invalid PNG signature");
  }

  const chunks: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;
  const len = bytes.length;

  while (offset + 12 <= len) {
    const chunkLen =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3];
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );
    const totalChunkLen = 12 + chunkLen;

    // Metadata chunks to drop
    const dropChunks = ["tEXt", "zTXt", "iTXt", "eXIf", "tIME"];
    if (!dropChunks.includes(type)) {
      chunks.push(bytes.subarray(offset, offset + totalChunkLen));
    }

    offset += totalChunkLen;
    if (type === "IEND") break;
  }

  const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const c of chunks) {
    result.set(c, pos);
    pos += c.length;
  }
  return result;
}

/**
 * Strips metadata using Canvas API (guaranteed cross-format metadata strip).
 */
export async function stripViaCanvas(
  file: Blob | File,
  mimeType: string = "image/jpeg",
  quality: number = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Unable to create canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas blob conversion failed"));
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image into canvas"));
    };

    img.src = url;
  });
}

/**
 * Universal metadata scrubber function: attempts lossless binary stripping first,
 * falling back to canvas rasterization.
 */
export async function scrubImageFile(
  file: File | Blob,
  options: {
    forceCanvas?: boolean;
    targetFormat?: "image/jpeg" | "image/png" | "image/webp";
    quality?: number;
  } = {}
): Promise<ScrubResult> {
  const startTime = performance.now();
  const originalSize = file.size;
  const mimeType = file.type || "image/jpeg";

  let scrubbedBlob: Blob;
  let finalFormat = mimeType;

  if (
    !options.forceCanvas &&
    !options.targetFormat &&
    (mimeType === "image/jpeg" || mimeType === "image/jpg")
  ) {
    try {
      const buffer = await file.arrayBuffer();
      const strippedBytes = stripJpegLossless(buffer);
      scrubbedBlob = new Blob([strippedBytes as unknown as BlobPart], { type: "image/jpeg" });
      finalFormat = "image/jpeg (Lossless)";
    } catch {
      scrubbedBlob = await stripViaCanvas(file, "image/jpeg", 0.95);
      finalFormat = "image/jpeg (Canvas)";
    }
  } else if (
    !options.forceCanvas &&
    !options.targetFormat &&
    mimeType === "image/png"
  ) {
    try {
      const buffer = await file.arrayBuffer();
      const strippedBytes = stripPngLossless(buffer);
      scrubbedBlob = new Blob([strippedBytes as unknown as BlobPart], { type: "image/png" });
      finalFormat = "image/png (Lossless)";
    } catch {
      scrubbedBlob = await stripViaCanvas(file, "image/png");
      finalFormat = "image/png (Canvas)";
    }
  } else {
    const targetMime = options.targetFormat || mimeType;
    scrubbedBlob = await stripViaCanvas(
      file,
      targetMime,
      options.quality || 0.95
    );
    finalFormat = targetMime;
  }

  const durationMs = performance.now() - startTime;
  const scrubbedSize = scrubbedBlob.size;

  return {
    blob: scrubbedBlob,
    originalSize,
    scrubbedSize,
    savedBytes: Math.max(0, originalSize - scrubbedSize),
    format: finalFormat,
    durationMs,
  };
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
  view.setUint16(20, 1, true); // PCM
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
 * Extracts waveform peak bars from audio channel data.
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
 * Generates synthetic geotagged JPEG image buffer in memory.
 */
export function generateSampleGeotaggedJpeg(options: {
  make?: string;
  model?: string;
  lat?: number;
  lon?: number;
  altitude?: number;
  serial?: string;
  date?: string;
} = {}): Uint8Array {
  const bytes: number[] = [];
  function p8(b: number) { bytes.push(b & 0xff); }
  function p16(s: number) { bytes.push(s & 0xff, (s >> 8) & 0xff); }
  function p32(i: number) { bytes.push(i & 0xff, (i >> 8) & 0xff, (i >> 16) & 0xff, (i >> 24) & 0xff); }

  p8(0x49); p8(0x49); p16(42); p32(8); // Little-Endian TIFF Header

  const ifd0Tags = [
    { id: 0x010f, type: 2, value: options.make || "Apple" },
    { id: 0x0110, type: 2, value: options.model || "iPhone 16 Pro Max" },
    { id: 0x0131, type: 2, value: "iOS 18.2 Camera App" },
    { id: 0x0132, type: 2, value: options.date || "2026:09:11 14:32:05" },
    { id: 0xa431, type: 2, value: options.serial || "DN6ZL01Q0D82" },
    { id: 0x8825, type: 4, value: 0 }, // GPS IFD pointer
  ];

  p16(ifd0Tags.length);
  const ifd0Offset = 8;
  const ifd0Size = 2 + ifd0Tags.length * 12 + 4;
  let poolOffset = ifd0Offset + ifd0Size;
  const pool: number[] = [];
  const gpsOffset = poolOffset + 300;

  for (const tag of ifd0Tags) {
    p16(tag.id);
    p16(tag.type);
    if (tag.id === 0x8825) {
      p32(1);
      p32(gpsOffset);
    } else {
      const strVal = tag.value + "\0";
      p32(strVal.length);
      if (strVal.length <= 4) {
        for (let i = 0; i < 4; i++) p8(strVal.charCodeAt(i) || 0);
      } else {
        p32(poolOffset);
        poolOffset += strVal.length;
        for (let i = 0; i < strVal.length; i++) pool.push(strVal.charCodeAt(i));
      }
    }
  }
  p32(0);
  for (const b of pool) p8(b);

  while (bytes.length < gpsOffset) bytes.push(0);

  // GPS IFD
  const latVal = options.lat !== undefined ? options.lat : 37.8199; // Golden Gate Bridge
  const lonVal = options.lon !== undefined ? options.lon : -122.4783;
  const latRef = latVal >= 0 ? "N" : "S";
  const lonRef = lonVal >= 0 ? "E" : "W";
  const absLat = Math.abs(latVal);
  const absLon = Math.abs(lonVal);

  const latDeg = Math.floor(absLat);
  const latMin = Math.floor((absLat - latDeg) * 60);
  const latSec = Math.round(((absLat - latDeg) * 60 - latMin) * 60 * 100);

  const lonDeg = Math.floor(absLon);
  const lonMin = Math.floor((absLon - lonDeg) * 60);
  const lonSec = Math.round(((absLon - lonDeg) * 60 - lonMin) * 60 * 100);

  const gpsTags = [
    { id: 0x0001, type: 2, value: latRef },
    { id: 0x0002, type: 5, rationals: [[latDeg, 1], [latMin, 1], [latSec, 100]] },
    { id: 0x0003, type: 2, value: lonRef },
    { id: 0x0004, type: 5, rationals: [[lonDeg, 1], [lonMin, 1], [lonSec, 100]] },
    { id: 0x0006, type: 5, rationals: [[Math.round(options.altitude || 67), 1]] },
  ];

  p16(gpsTags.length);
  let gpsPoolOffset = gpsOffset + 2 + gpsTags.length * 12 + 4;
  const gpsPool: number[] = [];

  for (const tag of gpsTags) {
    p16(tag.id);
    p16(tag.type);
    if (tag.type === 2 && typeof tag.value === "string") {
      const s = tag.value + "\0";
      p32(s.length);
      for (let i = 0; i < 4; i++) p8(s.charCodeAt(i) || 0);
    } else if (tag.type === 5 && tag.rationals) {
      p32(tag.rationals.length);
      p32(gpsPoolOffset);
      gpsPoolOffset += tag.rationals.length * 8;
      for (const [num, den] of tag.rationals) {
        gpsPool.push(num & 0xff, (num >> 8) & 0xff, (num >> 16) & 0xff, (num >> 24) & 0xff);
        gpsPool.push(den & 0xff, (den >> 8) & 0xff, (den >> 16) & 0xff, (den >> 24) & 0xff);
      }
    }
  }
  p32(0);
  for (const b of gpsPool) p8(b);

  const tiffBuffer = new Uint8Array(bytes);
  const exifPrefix = new TextEncoder().encode("Exif\0\0");
  const app1Payload = new Uint8Array(exifPrefix.length + tiffBuffer.length);
  app1Payload.set(exifPrefix, 0);
  app1Payload.set(tiffBuffer, exifPrefix.length);

  const app1Length = app1Payload.length + 2;
  const app1 = new Uint8Array(2 + app1Length);
  app1[0] = 0xff;
  app1[1] = 0xe1;
  app1[2] = (app1Length >> 8) & 0xff;
  app1[3] = app1Length & 0xff;
  app1.set(app1Payload, 4);

  // Minimal 1x1 JPEG bytes base64
  const base641x1 =
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  const raw1x1 = Uint8Array.from(atob(base641x1), (c) => c.charCodeAt(0));

  const result = new Uint8Array(2 + app1.length + raw1x1.length - 2);
  result.set(raw1x1.subarray(0, 2), 0); // SOI
  result.set(app1, 2); // APP1 EXIF
  result.set(raw1x1.subarray(2), 2 + app1.length); // remainder of JPEG
  return result;
}

/**
 * Generates a synthetic multi-tone audio buffer (3 seconds, 44.1kHz).
 */
export function generateSampleAudioWav(durationSec: number = 3): ArrayBuffer {
  const sampleRate = 44100;
  const totalSamples = sampleRate * durationSec;
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  // Synthesize pleasant ambient chime chord (A4 440Hz, C#5 554Hz, E5 659Hz)
  const freqs = [440, 554.37, 659.25];
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-1.5 * (t % 1.0)); // decaying chime envelope
    let sampleVal = 0;
    for (const f of freqs) {
      sampleVal += Math.sin(2 * Math.PI * f * t) * 0.25;
    }
    left[i] = sampleVal * envelope;
    right[i] = sampleVal * envelope;
  }

  return encodeWav([left, right], sampleRate);
}
