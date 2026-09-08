# wordlist design

- Purpose: Load the English wordlist in file order and build index mappings.
- Scope: File parsing, integrity checks, and index lookups; no normalization or crypto.
- `wordlist.ts` owns the shared `Wordlist` type, line splitting, validation, and index construction for both loaders.
- Public `loadEnglishWordlist` uses asynchronous file reads; `loadEnglishWordlistSync` serves core conversions and CLI generation and is excluded from the root public exports.
- The two loaders keep separate caches because returned dictionaries are mutable; each caches only successful loads.
- Parsing preserves existing error precedence: the public parser checks empty lines first, while the synchronous loader checks word count before empty or duplicate words in file order.
- Output: JavaScript is emitted to `dist/`; keep this directory TypeScript-only.
