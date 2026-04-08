# bip39 design

- Purpose: Core BIP39 conversion functions built on fixed assets and primitives.
- Scope: Deterministic conversions only; no UI or random entropy generation.
- Includes: `entropyToMnemonic`, `mnemonicToEntropy`, and `validateMnemonic`.
- Output: JavaScript is emitted to `dist/`; keep this directory TypeScript-only.
