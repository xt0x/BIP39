# cli design

- Purpose: Provide a human-friendly CLI wrapper for BIP39 core APIs.
- `runCli` handles argument parsing, input resolution (args/stdin), and exit codes.
- `commands.ts` groups mnemonic generation, optional input normalization, and validation-result adapters with their result types.
- Validation and entropy recovery delegate to the shared `src/bip39/mnemonic.ts` module.
- `runCli` calls core entropy generation and entropy-to-mnemonic conversion directly; adapters are used where CLI-specific behavior is needed.
- Library functions and constants come from `src/bip39/`; compatibility normalization and error messages come from `src/integration/`.
- `hex.ts` handles hex encoding/decoding for byte outputs.
- The CLI defaults to normalized input, with `--strict` to disable normalization.
- Added `generate-mnemonic-with-wordlist` to emit a generated mnemonic plus the full English wordlist.
- Wordlist output uses the synchronous loader in `src/bip39/wordlist.ts`, sharing the core dictionary while remaining independent of the public asynchronous loader's cache.
