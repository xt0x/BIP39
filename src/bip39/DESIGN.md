# bip39 design

- Purpose: Keep the BIP39 library and its supporting primitives together, with each responsibility in a separate module.
- Scope: Conversion, validation, strict parsing, wordlist loading, and secure entropy generation, including runtime file and standard-library crypto operations. UI/CLI input normalization and presentation remain in the adapter directories.
- `entropyToMnemonic.ts` handles entropy encoding; `mnemonicToSeed.ts` handles seed derivation separately from strict mnemonic validation.
- `mnemonic.ts` groups validation, entropy recovery, `ValidationResult`, and the existing recovery error classes around a private decoder.
- The decoder checks format, word count, word membership, and checksum in that order. Both public APIs propagate infrastructure errors unchanged.
- `validateMnemonic` returns exactly its five public fields; `mnemonicToEntropy` translates decoder failures into the existing exception classes. Decoded entropy stays internal to validation.
- `strictMnemonic.ts` enforces NFKD, spacing, and lowercase ASCII for the English profile and extracts word arrays; it does not apply compatibility input normalization.
- `constants.ts` defines fixed BIP39 constants and deterministic length/word-count relations without I/O or crypto dependencies.
- `bitOps.ts` provides pure conversions between bytes, bit arrays, and integer chunks in MSB-first order.
- `errorCodes.ts` defines error identifiers and priority ordering; user-facing messages belong to the integration layer.
- `crypto.ts` wraps standard SHA-256 and PBKDF2-HMAC-SHA512 primitives and maps PBKDF2 failures; it does not implement cryptographic algorithms itself.
- `entropyGenerator.ts` validates allowed byte lengths and delegates secure entropy generation to a randomness provider, with provider injection for tests.
- `wordlist.ts` owns the shared `Wordlist` type, line splitting, integrity checks, file-order index mappings, and both English wordlist loaders; it performs no input normalization or crypto.
- Public `loadEnglishWordlist` reads asynchronously; `loadEnglishWordlistSync` serves conversions and CLI generation and stays excluded from the root public exports.
- The loaders maintain separate caches because returned dictionaries are mutable; each caches only successful loads.
- Wordlist parsing preserves error precedence: the public parser checks empty lines first, while the synchronous loader checks word count before empty or duplicate words in file order.
- Output: JavaScript is emitted to `dist/`; keep this directory TypeScript-only.
