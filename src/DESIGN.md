# src design

- Purpose: TypeScript source for the BIP39 implementation.
- `src/bip39/` groups the BIP39 library: conversions, validation and result types, strict parsing, constants, error codes, bit operations, cryptographic primitives, secure entropy generation, and English wordlists. These remain separate files with their existing responsibilities.
- `src/integration/` provides shared CLI/UI input normalization, external adapters (UI/BIP32), and error messaging.
- `src/cli/` provides argument handling, command adapters, and text output around the library APIs.
- Dependencies flow from CLI and integration adapters into the BIP39 library; the library does not depend on either adapter directory.
- `src/index.ts` preserves the public export surface independently of the internal file layout.
- Wordlist exports are explicit so the synchronous loader remains internal to core and CLI modules.
- Build output is emitted to `dist/`; `src/` contains TypeScript sources only.
