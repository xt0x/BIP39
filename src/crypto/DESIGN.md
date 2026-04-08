# crypto design

- Purpose: Provide thin wrappers around standard SHA-256 and PBKDF2-HMAC-SHA512 primitives.
- Scope: No custom crypto; only fixed-parameter calls and error mapping.
- Output: JavaScript is emitted to `dist/`; keep this directory TypeScript-only.
