import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

export interface PdfPageDetail {
  index: number; // 0-based
  pageNumber: number; // 1-based
  width: number;
  height: number;
  rotation: number;
}

export interface PdfDocumentDetails {
  pageCount: number;
  title?: string;
  author?: string;
  pages: PdfPageDetail[];
}

export async function getPdfDetails(
  pdfBytes: ArrayBuffer
): Promise<PdfDocumentDetails> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pageCount = doc.getPageCount();
  const pages: PdfPageDetail[] = [];

  for (let i = 0; i < pageCount; i++) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const rotation = page.getRotation().angle;

    pages.push({
      index: i,
      pageNumber: i + 1,
      width: Math.round(width),
      height: Math.round(height),
      rotation,
    });
  }

  return {
    pageCount,
    title: doc.getTitle(),
    author: doc.getAuthor(),
    pages,
  };
}

export async function mergePdfs(
  files: Array<{ name: string; bytes: ArrayBuffer }>
): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new Error("No PDF files provided for merging.");
  }

  const mergedDoc = await PDFDocument.create();

  for (const file of files) {
    const srcDoc = await PDFDocument.load(file.bytes, { ignoreEncryption: true });
    const pageIndices = srcDoc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((page) => mergedDoc.addPage(page));
  }

  return await mergedDoc.save();
}

export async function splitPdf(
  pdfBytes: ArrayBuffer,
  pageIndices: number[]
): Promise<Uint8Array> {
  if (pageIndices.length === 0) {
    throw new Error("Please select at least one page to extract.");
  }

  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  // Validate page indices
  const validIndices = pageIndices.filter((idx) => idx >= 0 && idx < totalPages);
  if (validIndices.length === 0) {
    throw new Error("None of the specified pages exist in the document.");
  }

  const targetDoc = await PDFDocument.create();
  const copiedPages = await targetDoc.copyPages(srcDoc, validIndices);
  copiedPages.forEach((page) => targetDoc.addPage(page));

  return await targetDoc.save();
}

export interface PageTransformConfig {
  pageIndex: number;
  rotationDelta: number; // 0, 90, 180, 270
  deleted: boolean;
}

export async function transformPdf(
  pdfBytes: ArrayBuffer,
  pageConfigs: PageTransformConfig[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const targetDoc = await PDFDocument.create();

  const configMap = new Map<number, PageTransformConfig>();
  pageConfigs.forEach((cfg) => configMap.set(cfg.pageIndex, cfg));

  const totalPages = srcDoc.getPageCount();
  const pagesToCopy: number[] = [];

  for (let i = 0; i < totalPages; i++) {
    const cfg = configMap.get(i);
    if (!cfg || !cfg.deleted) {
      pagesToCopy.push(i);
    }
  }

  if (pagesToCopy.length === 0) {
    throw new Error("Cannot save: All pages have been marked for deletion.");
  }

  const copiedPages = await targetDoc.copyPages(srcDoc, pagesToCopy);

  copiedPages.forEach((page, idx) => {
    const originalIndex = pagesToCopy[idx];
    const cfg = configMap.get(originalIndex);
    const rotationDelta = cfg?.rotationDelta || 0;
    const currentAngle = page.getRotation().angle;
    const newAngle = (currentAngle + rotationDelta) % 360;

    page.setRotation(degrees(newAngle));
    targetDoc.addPage(page);
  });

  return await targetDoc.save();
}

export function parsePageRangeString(
  rangeStr: string,
  totalPages: number
): number[] {
  const clean = rangeStr.trim();
  if (!clean) return [];

  const parts = clean.split(",");
  const indices = new Set<number>();

  for (const part of parts) {
    const item = part.trim();
    if (item.includes("-")) {
      const [startStr, endStr] = item.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          indices.add(i - 1); // 0-based
        }
      }
    } else {
      const pageNum = parseInt(item, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indices.add(pageNum - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

export async function generateSamplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontTitle = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontBody = await doc.embedFont(StandardFonts.Helvetica);

  // Page 1: Overview
  const page1 = doc.addPage([595, 842]); // A4
  page1.drawRectangle({
    x: 40,
    y: 720,
    width: 515,
    height: 80,
    color: rgb(0.06, 0.65, 0.45),
  });
  page1.drawText("Privatools Security Report — Page 1", {
    x: 60,
    y: 755,
    size: 20,
    font: fontTitle,
    color: rgb(1, 1, 1),
  });
  page1.drawText("Confidential Internal Audit Document", {
    x: 60,
    y: 735,
    size: 11,
    font: fontBody,
    color: rgb(0.9, 0.98, 0.95),
  });
  page1.drawText(
    "This is a sample multi-page PDF generated client-side inside your browser.\nAll cryptographic validations and binary modifications happen in RAM.",
    {
      x: 60,
      y: 650,
      size: 13,
      font: fontBody,
      lineHeight: 20,
      color: rgb(0.2, 0.2, 0.2),
    }
  );
  page1.drawText("Page 1 of 3", {
    x: 270,
    y: 40,
    size: 10,
    font: fontBody,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Page 2: Data Section
  const page2 = doc.addPage([595, 842]);
  page2.drawRectangle({
    x: 40,
    y: 720,
    width: 515,
    height: 80,
    color: rgb(0.15, 0.35, 0.8),
  });
  page2.drawText("Financial Disclosures — Page 2", {
    x: 60,
    y: 755,
    size: 20,
    font: fontTitle,
    color: rgb(1, 1, 1),
  });
  page2.drawText("Section B: Quarterly Audit Tables & Metrics", {
    x: 60,
    y: 735,
    size: 11,
    font: fontBody,
    color: rgb(0.9, 0.95, 1),
  });
  page2.drawText(
    "Use the PDF Privacy Lab to test:\n- Rotating this page 90 or 180 degrees\n- Extracting only Page 2\n- Merging this document with other files",
    {
      x: 60,
      y: 650,
      size: 13,
      font: fontBody,
      lineHeight: 22,
      color: rgb(0.2, 0.2, 0.2),
    }
  );
  page2.drawText("Page 2 of 3", {
    x: 270,
    y: 40,
    size: 10,
    font: fontBody,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Page 3: Approvals
  const page3 = doc.addPage([595, 842]);
  page3.drawRectangle({
    x: 40,
    y: 720,
    width: 515,
    height: 80,
    color: rgb(0.8, 0.3, 0.2),
  });
  page3.drawText("Sign-Off & Approvals — Page 3", {
    x: 60,
    y: 755,
    size: 20,
    font: fontTitle,
    color: rgb(1, 1, 1),
  });
  page3.drawText("Section C: Legal Authority Signatures", {
    x: 60,
    y: 735,
    size: 11,
    font: fontBody,
    color: rgb(1, 0.92, 0.92),
  });
  page3.drawText(
    "Notice: This page contains simulated signature fields.\nYou can test deleting this page or reordering it in the PDF Privacy Lab.",
    {
      x: 60,
      y: 650,
      size: 13,
      font: fontBody,
      lineHeight: 20,
      color: rgb(0.2, 0.2, 0.2),
    }
  );
  page3.drawText("Page 3 of 3", {
    x: 270,
    y: 40,
    size: 10,
    font: fontBody,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await doc.save();
}
