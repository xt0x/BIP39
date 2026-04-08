# src design

- Purpose: TypeScript source for the BIP39 implementation.
- `src/constants/` defines fixed BIP39 constants and length/word-count relations.
- `src/errors/` defines standard error codes and priority ordering.
- `src/types/` defines shared DTOs such as `ValidationResult`.
- `src/index.ts` re-exports the public surface for these foundational modules.
