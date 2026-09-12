# Privatools DevTools Verification & Zero-Egress Audit Proof

> Canonical URL: [https://privatools.dev/privacy-audit/](https://privatools.dev/privacy-audit/)
> Markdown Alternate: [https://privatools.dev/privacy-audit.md](https://privatools.dev/privacy-audit.md)
> Proof Method: Verifiable DevTools Network Tab Inspection

## How to Verify Zero Network Egress Yourself
1. Open DevTools by pressing F12 or Right-Click > Inspect.
2. Switch to the **Network** tab.
3. Check the **Preserve log** option and filter by **Fetch/XHR**.
4. Disconnect your internet connection (or enable Airplane Mode / Offline throttling).
5. Load a file, convert structured data, inspect an X.509 certificate, or calculate cryptographic hashes.
6. Notice that **zero network requests** are dispatched during any tool operation.

## Architecture Guarantees
- **Static Export Only:** Compiled to static HTML/JS/CSS with no server-side Node.js runtime.
- **No Analytics or Trackers:** Zero Google Analytics, Facebook Pixels, or telemetry SDKs.
- **Local Browser Storage:** User preferences and pinned favorites are stored only in `localStorage`.
- **BSL 1.1 License:** Source available and auditable on GitHub ([https://github.com/apilysw/privatools](https://github.com/apilysw/privatools)).
