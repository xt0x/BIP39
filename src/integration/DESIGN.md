# integration design

- Purpose: Connect core BIP39 APIs to external layers like UI or BIP32.
- Scope: Normalize UI input, orchestrate validation/derivation, and map error codes to messages.
- Validation and its `ValidationResult` type come from `src/bip39/mnemonic.ts`; seed derivation remains a separate core API.
- Output: JavaScript is emitted to `dist/`; keep this directory TypeScript-only.
