import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * Generates multi-resolution favicon.ico (16x16, 32x32, 48x48, 256x256)
 * from public/icons/icon.svg to ensure complete compatibility across all
 * browsers and operating systems while matching the site logo.
 */
export function generateFavicon() {
  const rootDir = process.cwd();
  const svgPath = path.join(rootDir, "public", "icons", "icon.svg");
  const tmpDir = path.join(rootDir, "node_modules", ".cache", "favicon-gen");

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const sizes = [16, 32, 48, 256];
  for (const size of sizes) {
    const pngPath = path.join(tmpDir, `icon_${size}.png`);
    execSync(`rsvg-convert -w ${size} -h ${size} "${svgPath}" -o "${pngPath}"`, { stdio: "pipe" });
  }

  // Generate 16, 32, 48 BMPs into an ICO via ImageMagick
  const stdIcoPath = path.join(tmpDir, "std.ico");
  execSync(
    `magick "${path.join(tmpDir, "icon_16.png")}" "${path.join(tmpDir, "icon_32.png")}" "${path.join(tmpDir, "icon_48.png")}" "${stdIcoPath}"`,
    { stdio: "pipe" }
  );

  const stdIco = fs.readFileSync(stdIcoPath);
  const png256 = fs.readFileSync(path.join(tmpDir, "icon_256.png"));

  const numExisting = stdIco.readUInt16LE(4);
  const newCount = numExisting + 1;

  const newHeader = Buffer.alloc(6);
  newHeader.writeUInt16LE(0, 0); // reserved
  newHeader.writeUInt16LE(1, 2); // ICO type
  newHeader.writeUInt16LE(newCount, 4);

  const entries: Buffer[] = [];
  const imageBuffers: Buffer[] = [];

  for (let i = 0; i < numExisting; i++) {
    const entry = Buffer.from(stdIco.subarray(6 + i * 16, 6 + (i + 1) * 16));
    const oldOffset = entry.readUInt32LE(12);
    const size = entry.readUInt32LE(8);
    const imgData = stdIco.subarray(oldOffset, oldOffset + size);

    // Shift offset by 16 bytes for the newly added entry in header directory
    entry.writeUInt32LE(oldOffset + 16, 12);
    entries.push(entry);
    imageBuffers.push(imgData);
  }

  // Append 256x256 PNG entry
  const lastEntry = entries[entries.length - 1];
  const nextOffset = lastEntry.readUInt32LE(12) + lastEntry.readUInt32LE(8);

  const entry256 = Buffer.alloc(16);
  entry256.writeUInt8(0, 0); // width 256 = 0
  entry256.writeUInt8(0, 1); // height 256 = 0
  entry256.writeUInt8(0, 2); // palette
  entry256.writeUInt8(0, 3); // reserved
  entry256.writeUInt16LE(1, 4); // planes
  entry256.writeUInt16LE(32, 6); // bpp
  entry256.writeUInt32LE(png256.length, 8); // size
  entry256.writeUInt32LE(nextOffset, 12); // offset
  entries.push(entry256);
  imageBuffers.push(png256);

  const finalIco = Buffer.concat([newHeader, ...entries, ...imageBuffers]);

  const targetAppFavicon = path.join(rootDir, "src", "app", "favicon.ico");
  const targetPublicFavicon = path.join(rootDir, "public", "favicon.ico");

  fs.writeFileSync(targetAppFavicon, finalIco);
  fs.writeFileSync(targetPublicFavicon, finalIco);

  console.log(`✅ Successfully generated multi-resolution favicon.ico (${(finalIco.length / 1024).toFixed(1)} KB)`);
  console.log(`   - src/app/favicon.ico updated`);
  console.log(`   - public/favicon.ico updated`);
}

if (require.main === module) {
  generateFavicon();
}
