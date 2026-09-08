# bip39 design

- Purpose: Core BIP39 conversion functions built on fixed assets and primitives.
- Scope: Deterministic conversions only; no UI or random entropy generation.
- Includes: `entropyToMnemonic`, `mnemonicToEntropy`, `mnemonicToSeed`, and `validateMnemonic`.
- `mnemonic.ts` groups validation, entropy recovery, `ValidationResult`, and the existing recovery error classes around a private decoder.
- The decoder checks format, word count, word membership, and checksum in that order. Both public APIs propagate infrastructure errors unchanged.
- `validateMnemonic` returns exactly its five public fields; `mnemonicToEntropy` translates decoder failures into the existing exception classes. Decoded entropy stays internal to validation.
- Seed derivation remains separate from strict mnemonic validation.
- English wordlist loading is delegated to `loadEnglishWordlistSync` in `src/wordlist/wordlist.ts`; this directory does not duplicate file parsing or caching.
- Output: JavaScript is emitted to `dist/`; keep this directory TypeScript-only.
