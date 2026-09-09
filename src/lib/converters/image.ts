export type ImageFormat = "image/webp" | "image/png" | "image/jpeg";

export interface ImageConvertOptions {
  format: ImageFormat;
  quality: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
}

export interface ConvertedImageResult {
  blob: Blob;
  url: string;
  originalBytes: number;
  convertedBytes: number;
  width: number;
  height: number;
  durationMs: number;
  savingsPercentage: number;
}

export async function convertImageClientSide(
  file: File,
  options: ImageConvertOptions
): Promise<ConvertedImageResult> {
  const startTime = performance.now();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Failed to decode image."));
      img.onload = () => {
        let { width, height } = img;

        // Maintain aspect ratio scaling if max dimensions provided
        if (options.maxWidth && width > options.maxWidth) {
          const ratio = options.maxWidth / width;
          width = options.maxWidth;
          height = Math.round(height * ratio);
        }

        if (options.maxHeight && height > options.maxHeight) {
          const ratio = options.maxHeight / height;
          height = options.maxHeight;
          width = Math.round(width * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Unable to create 2D canvas context."));
          return;
        }

        // Fill background with white if converting to JPEG (which lacks transparency)
        if (options.format === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas conversion to Blob failed."));
              return;
            }

            const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
            const url = URL.createObjectURL(blob);
            const originalBytes = file.size;
            const convertedBytes = blob.size;
            const savingsPercentage = Math.round(
              ((originalBytes - convertedBytes) / originalBytes) * 100
            );

            resolve({
              blob,
              url,
              originalBytes,
              convertedBytes,
              width,
              height,
              durationMs,
              savingsPercentage,
            });
          },
          options.format,
          options.quality
        );
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
