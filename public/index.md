# Privatools — 100% Client-Side Zero-Knowledge Privacy Utilities

> Private in-browser data converters, image processors, cryptographic engines, and developer utilities.
> Canonical URL: [https://privatools.dev/](https://privatools.dev/)
> Markdown Alternate: [https://privatools.dev/index.md](https://privatools.dev/index.md)
> Machine-Readable LLM Index: [https://privatools.dev/llms.md](https://privatools.dev/llms.md)

## Platform Philosophy & Guarantees
Privatools is a suite of confidential, client-side web utilities engineered to process sensitive enterprise data, personal files, and developer credentials strictly inside your browser sandbox. No file is ever transmitted to any remote server or third-party service.

- **Zero Data Uploads:** 0 bytes uploaded to any remote server. All parsing, transcoding, hashing, and cryptography execute in browser RAM.
- **In-Browser Hardware Acceleration:** WebAssembly (SQLite via sql.js), Web Crypto API (SHA-256, HMAC, PBKDF2), HTML5 Canvas, and Web Workers.
- **Offline Capable:** Full Progressive Web App (PWA) with Cache-First asset caching for 100% offline availability.
- **Compliance:** GDPR, HIPAA, and SOC 2 friendly. Sensitive records remain safely on the user's physical machine.

## Tool Directory
### Security & Dev
- [X.509 Certificate Inspector & Exporter](https://privatools.dev/tools/cert-inspector/) — Inspect SSL/TLS certificates and convert between PEM, DER, and Public Key formats. (Formats: PEM, DER, CRT, CER, Public Key, JSON)
- [EDI X12 & UN/EDIFACT Viewer & Converter](https://privatools.dev/tools/edi-viewer/) — Inspect ANSI X12 and EDIFACT documents and convert between EDI, JSON, and XML. (Formats: X12, EDIFACT, JSON, XML, EDI)
- [JWT & OAuth Token Debugger](https://privatools.dev/tools/jwt-inspector/) — Decode, verify Web Crypto signatures, and inspect OAuth tokens client-side. (Formats: JWT, JWS, OAuth, OIDC, JSON)
- [Cryptographic Checksum & File Hash Studio](https://privatools.dev/tools/hash-studio/) — Compute and verify SHA-256, SHA-512, MD5, CRC32, HMACs, and PBKDF2 keys. (Formats: SHA-256, SHA-512, MD5, CRC-32, HMAC, PBKDF2)
- [Client-Side Regex Workbench & Tester](https://privatools.dev/tools/regex-studio/) — Test regular expressions with real-time match highlighting, group extraction, and substitution. (Formats: Regex, RegExp, PCRE, ECMAScript, Pattern)
- [Network & Subnet CIDR Studio](https://privatools.dev/tools/subnet-calculator/) — IPv4 & IPv6 CIDR subnet calculator, VLSM planner, IP collision detector, and bitmask visualizer. (Formats: IPv4, IPv6, CIDR, VLSM, Binary, Hex)
- [Provably Fair & Random Studio](https://privatools.dev/tools/random-studio/) — Provably fair commit-reveal, polyhedral dice, Gaussian normal distribution, and Diceware. (Formats: CSPRNG, HMAC-SHA256, EFF Diceware, UUID v7, Dice Notation, JSON, CSV)

### Media & Images
- [Client-Side Image Lab](https://privatools.dev/tools/image-converter/) — Transcode WebP, PNG, JPEG with quality compression and zero uploads. (Formats: WebP, PNG, JPEG)
- [Offline QR Code & Barcode Studio](https://privatools.dev/tools/qr-studio/) — Generate, batch print, and decode 1D/2D barcodes and QR codes client-side. (Formats: QR, Code 128, GS1-128, ITF-14, Data Matrix, PDF417, EAN-13, UPC-A)
- [Media Privacy Lab & Metadata Scrubber](https://privatools.dev/tools/media-lab/) — Inspect & strip EXIF/GPS metadata from photos losslessly and trim audio waveforms. (Formats: EXIF, JPEG, PNG, WebP, TIFF, WAV, MP3)
- [Video & Audio Transcoder Studio](https://privatools.dev/tools/video-lab/) — Strip audio losslessly, extract and convert MP3/FLAC/WAV/OGG/AAC, transcode video, and export animated GIFs. (Formats: MP4, WebM, MOV, MP3, FLAC, WAV, OGG, AAC, GIF, Audio, Video)
- [CSS & Modern Color Palette Studio](https://privatools.dev/tools/color-studio/) — Bi-directional HEX/RGB/HSL/OKLCH conversions, WCAG & APCA contrast checker, color blindness simulator, and harmonies. (Formats: HEX, RGB, HSL, OKLCH, HWB, LAB, CMYK, Tailwind, CSS)

### Data & Config
- [Structured Data Converter](https://privatools.dev/tools/data-converter/) — Convert between JSON, YAML, CSV, and XML instantly with live preview. (Formats: JSON, YAML, CSV, XML)
- [Client-Side PDF Privacy Lab](https://privatools.dev/tools/pdf-lab/) — Merge, split, extract, rotate, and organize PDF documents with zero server uploads. (Formats: PDF, Merge, Split, Rotate, Extract)
- [SQLite Database Explorer & Exporter](https://privatools.dev/tools/sqlite-lab/) — Open, query, browse tables, and export SQLite databases via in-browser WebAssembly. (Formats: SQLite, DB, SQL, CSV, JSON)
- [Code & Text Diff / Patch Studio](https://privatools.dev/tools/diff-viewer/) — Compare code and text side-by-side with word-level highlighting and patch export. (Formats: Diff, Patch, Code, JSON, Text)

### Text & Encodings
- [Text & Encoding Studio](https://privatools.dev/tools/text-converter/) — Encode/decode Base64, Hex, URL encoding, HTML entities, and Markdown. (Formats: Base64, Hex, URL, HTML, Markdown)
- [Markdown & Technical Documentation Studio](https://privatools.dev/tools/markdown-lab/) — Author, preview, and format Markdown documents with frontmatter, tables, and HTML/PDF export. (Formats: Markdown, GFM, Frontmatter, HTML, PDF, CSV)
- [Date, Time, Epoch & Cron Precision Studio](https://privatools.dev/tools/date-time-calculator/) — High-precision Unix epoch converter (s/ms/µs/ns), date math, timezone matrix, and cron explainer. (Formats: Epoch, ISO-8601, RFC-2822, RFC-3339, Cron, Timezone)

## Architecture & Verification
- **DevTools Network Proof:** Inspect network traffic via browser DevTools (F12 > Network tab). Notice 0 requests during file conversions.
- **Privacy Audit Guide:** [https://privatools.dev/privacy-audit/](https://privatools.dev/privacy-audit/)
- **About & Creator:** [https://privatools.dev/about/](https://privatools.dev/about/) (Gareth Barlow, UK)
- **Source Repository:** [https://github.com/apilysw/privatools](https://github.com/apilysw/privatools)
- **License:** Business Source License 1.1 (BSL 1.1, converting to MIT on September 12, 2030)
- **Community Support:** [https://buymeacoffee.com/privatools](https://buymeacoffee.com/privatools)
