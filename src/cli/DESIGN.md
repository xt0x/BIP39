# cli design

- Purpose: Provide a human-friendly CLI wrapper for BIP39 core APIs.
- `runCli` handles argument parsing, input resolution (args/stdin), and exit codes.
- `commands/` contains small adapters that invoke core use cases.
- `hex.ts` handles hex encoding/decoding for byte outputs.
- The CLI defaults to normalized input, with `--strict` to disable normalization.
- Added `generate-mnemonic-with-wordlist` to emit a generated mnemonic plus the full English wordlist.
