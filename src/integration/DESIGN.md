# integration design

- Purpose: Connect the BIP39 library to external layers like CLI, UI, or BIP32.
- Scope: Provide compatibility input normalization, orchestrate UI validation/derivation, and map error codes to messages.
- `normalizeMnemonicInput.ts` is the shared CLI/UI adapter for trimming, whitespace normalization, NFKD normalization, and lowercasing for the English profile. It remains separate from the library's strict parser and seed derivation.
- `externalIntegration.ts` implements UI and downstream seed adapters; `errorMessages.ts` maps the library's error identifiers to presentation text.
- Validation and its `ValidationResult` type come from `src/bip39/mnemonic.ts`; seed derivation remains a separate core API.
- Integration adapters depend on `src/bip39/` and do not depend on the CLI.
- Output: JavaScript is emitted to `dist/`; keep this directory TypeScript-only.
