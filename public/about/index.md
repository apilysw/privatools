# About Privatools & The Privacy Mission

> Canonical URL: [https://privatools.dev/about/](https://privatools.dev/about/)
> Markdown Alternate: [https://privatools.dev/about.md](https://privatools.dev/about.md)
> Creator: Gareth Barlow (Independent Software Engineer & Privacy Advocate, United Kingdom)

## The Mission
Every day, developers, analysts, and everyday users upload sensitive company code, database dumps, customer PII, SSL certificates, and personal media to random online converter websites. Most converter sites upload your files to remote cloud servers where they can be logged, scraped, retained, or leaked.

Privatools was built to prove that web applications can be fast, capable, and completely private by executing 100% of computations inside the browser's local sandbox.

## Architecture
- **Zero Server Endpoints:** Privatools has no backend API routes, server actions, or file upload endpoints.
- **In-Memory WebAssembly:** Applications like SQLite Database Explorer run official SQLite compiled to WebAssembly (sql.js) entirely in local RAM.
- **Hardware-Accelerated Web Crypto:** Cryptographic hashing and token verification use browser `crypto.subtle` with zero third-party telemetry.
- **Canvas & Web Audio:** Media manipulations use browser GPU pipelines and garbage-collect all buffers immediately.

## Verification & Open Source
- Inspect network requests using DevTools (F12 > Network tab).
- Step-by-step audit guide: [https://privatools.dev/privacy-audit/](https://privatools.dev/privacy-audit/)
- Source code available on GitHub: [https://github.com/apilysw/privatools](https://github.com/apilysw/privatools)
- Report issues or request features: [https://github.com/apilysw/privatools/issues](https://github.com/apilysw/privatools/issues)
- Support the project: [https://buymeacoffee.com/privatools](https://buymeacoffee.com/privatools)
