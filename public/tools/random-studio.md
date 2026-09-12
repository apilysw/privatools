# Provably Fair & Random Studio

> Private Provably Fair Random Number Studio | Privatools
> Canonical URL: [https://privatools.dev/tools/random-studio/](https://privatools.dev/tools/random-studio/)
> Markdown Alternate: [https://privatools.dev/tools/random-studio.md](https://privatools.dev/tools/random-studio.md)
> Execution Architecture: 100% Client-Side In-Memory Execution (Zero Remote Egress)

## Overview
Generate cryptographically secure random numbers, Diceware passphrases, UUIDs (v4 & v7), and Gaussian distributions. Audit randomness with NIST-style statistical tests, and roll verifiably provably fair numbers using SHA-256 HMAC commitments.

## Format Specifications
- **Category:** Security & Dev
- **Supported Formats:** `CSPRNG`, `HMAC-SHA256`, `EFF Diceware`, `UUID v7`, `Dice Notation`, `JSON`, `CSV`
- **Privacy Guarantee:** 0 bytes uploaded to remote servers. All computation executes locally in browser memory.
- **Compliance:** GDPR, HIPAA & SOC 2 Friendly (process sensitive payloads and PII directly on your local device).

## Technology Stack
- Web Crypto API (crypto.getRandomValues)
- SHA-256 HMAC Provably Fair Protocol
- Diceware Wordlist Engine
- Chi-Square Statistical Tests

## How It Works
1. Hardware randomness is gathered from the OS kernel via window.crypto.getRandomValues.
2. The provably fair protocol hashes a 256-bit server seed into a commitment, combines it with a client seed and nonce, and produces verifiable rolls via HMAC-SHA256.
3. Gaussian random values are generated via the Box-Muller transformation using cryptographic uniform floats.
4. Statistical test suites evaluate Shannon entropy, chi-square distribution uniformity, and run frequency in real time.

## Practical Use Cases
### Provably Fair Audits for Gaming & Contests
Run verifiably fair giveaways, contests, and game mechanics where participants can verify their roll was not manipulated after the fact.

### High-Entropy Password & Diceware Generation
Generate memorable, cryptographically secure multi-word passphrases with exact entropy calculation for password managers and master keys.

### Database UUID v7 Generation
Generate time-ordered UUID v7 tokens for high-performance database primary keys without index fragmentation.

### Scientific Simulation & Monte Carlo Modeling
Sample Gaussian distributions and uniform random batches for statistical modeling and engineering simulations.

## Frequently Asked Questions
### What makes a roll 'Provably Fair'?
A secret seed is generated and its SHA-256 hash is published before the roll (commitment). The outcome is determined mathematically by HMAC-SHA256(ServerSeed, ClientSeed:Nonce). When the roll finishes, the secret seed is revealed so anyone can verify the outcome was not changed.

### Is this cryptographically secure?
Yes. All random values are harvested from window.crypto.getRandomValues, which connects to your operating system's cryptographic CSPRNG (/dev/urandom or Windows CryptoAPI). It does not use pseudo-random Math.random().

### What is UUID v7 and why should I use it over UUID v4?
UUID v4 is completely random, which causes severe B-tree page splits when used as a database primary key. UUID v7 embeds a Unix millisecond timestamp at the front, creating natural time-ordered indexing while retaining 74 bits of cryptographic uniqueness.

## Related Tools
- [Cryptographic Checksum & File Hash Studio](https://privatools.dev/tools/hash-studio/)
- [JWT & OAuth Token Debugger](https://privatools.dev/tools/jwt-inspector/)
- [Network & Subnet CIDR Studio](https://privatools.dev/tools/subnet-calculator/)
- [X.509 Certificate Inspector & Exporter](https://privatools.dev/tools/cert-inspector/)

---
*Privatools — 100% Client-Side Web Utilities. No tracking, no remote server processing.*
