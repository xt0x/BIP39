# src design

- Purpose: TypeScript source for the BIP39 implementation.
- `src/constants/` defines fixed BIP39 constants and length/word-count relations.
- `src/bits/` implements bit and chunk conversions used in mnemonic encoding.
- `src/errors/` defines standard error codes and priority ordering.
- `src/crypto/` wraps SHA-256 and PBKDF2-HMAC-SHA512 using standard libraries.
- `src/parser/` implements strict mnemonic parsing contracts.
- `src/types/` defines shared DTOs such as `ValidationResult`.
- `src/wordlist/` loads and validates the English wordlist with index mappings.
- `src/index.ts` re-exports the public surface for these foundational modules.
- Build output is emitted to `dist/`; `src/` contains TypeScript sources only.
