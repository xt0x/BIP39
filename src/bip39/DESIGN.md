# bip39 design

- Purpose: Core BIP39 conversion functions built on fixed assets and primitives.
- Scope: Deterministic conversions only; no UI or random entropy generation.
- Includes: `entropyToMnemonic`, `mnemonicToEntropy`, `mnemonicToSeed`, and `validateMnemonic`.
- English wordlist loading is delegated to `loadEnglishWordlistSync` in `src/wordlist/wordlist.ts`; this directory does not duplicate file parsing or caching.
- Output: JavaScript is emitted to `dist/`; keep this directory TypeScript-only.
