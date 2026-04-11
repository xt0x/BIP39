<div align="center">
  <h1>BIP39</h1>
  <p><strong>TypeScript library and CLI for generating, validating, and converting BIP39 English mnemonics</strong></p>
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white" />
  <img alt="Node" src="https://img.shields.io/badge/node-%3E%3D24-339933?logo=node.js&logoColor=white" />
  <img alt="pnpm" src="https://img.shields.io/badge/pnpm-10.30.0-F69220?logo=pnpm&logoColor=white" />
</div>


## Project Overview

This repository provides the core BIP39 workflows for the English wordlist profile:

- Convert entropy to a mnemonic sentence
- Convert a mnemonic sentence back to entropy
- Derive a 64-byte seed from a mnemonic and passphrase
- Validate mnemonic structure, word membership, and checksum
- Use the same behavior from both a TypeScript API and a CLI

It is backed by pinned specification assets in `assets/`, including the English wordlist and official test vectors.

## Warnings

- This project targets the English BIP39 profile only.
- The CLI and exported APIs distinguish between strict parsing and compatibility normalization; do not assume all inputs are auto-corrected.
- Generated mnemonics and derived seeds are sensitive secrets. Never commit them, log them, or share them in screenshots.
- This repository implements BIP39 behavior only. It does not implement BIP32, derivation paths, addresses, or wallet UX.

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Build the project

```bash
pnpm build
```

### 3. Show CLI help

```bash
node dist/cli/index.js --help
```

### 4. Try the CLI

Generate a 12-word mnemonic:

```bash
node dist/cli/index.js generate-mnemonic --words 12
```

Convert entropy hex to a mnemonic:

```bash
node dist/cli/index.js entropy-to-mnemonic 00000000000000000000000000000000
```

Validate a mnemonic:

```bash
node dist/cli/index.js validate "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
```

Derive a seed:

```bash
node dist/cli/index.js mnemonic-to-seed "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about" --passphrase TREZOR
```

### 5. Use the library API

```ts
import {
	entropyToMnemonic,
	generateEntropy,
	mnemonicToEntropy,
	mnemonicToSeed,
	validateMnemonic,
} from "./dist/index.js";

const entropy = generateEntropy(16);
const mnemonic = entropyToMnemonic(entropy);
const roundTripEntropy = mnemonicToEntropy(mnemonic);
const seed = mnemonicToSeed(mnemonic, "TREZOR");
const validation = validateMnemonic(mnemonic);

console.log({
	mnemonic,
	roundTripEntropyLength: roundTripEntropy.length,
	seedLength: seed.length,
	validation,
});
```

## Development Setup

1. Ensure `Node.js >= 24` is installed.
2. Ensure `pnpm 10.30.0` or a compatible `pnpm` version is available.
3. Clone the repository.
4. Install dependencies with `pnpm install`.
5. Run `pnpm test` to execute the test suite.
6. Run `pnpm typecheck` to verify TypeScript types.
7. Run `pnpm lint` to check formatting and static issues.
8. Run `pnpm build` to emit JavaScript into `dist/`.

## Output Location

- Compiled JavaScript is emitted to `dist/`.
- The CLI entry point is emitted to `dist/cli/index.js`.
- Source files remain in `src/`.
- Tests live in `test/` and are not emitted by the build.

## Configuration File Setup

No runtime configuration file is required.

The main repository-level configuration files are:

- `package.json` for scripts and package metadata
- `tsconfig.json` and `tsconfig.build.json` for TypeScript compilation
- `biome.json` for linting and formatting

## Environment Variables

No environment variables are required for standard development, build, test, or CLI usage.

## Directory Structure

```text
.
├── assets/                  # Pinned specification assets and test vectors
├── src/                     # TypeScript source code
│   ├── bip39/               # Core entropy/mnemonic/seed workflows
│   ├── bits/                # Bit conversion helpers
│   ├── cli/                 # Command-line interface
│   ├── constants/           # Fixed BIP39 constants and mappings
│   ├── crypto/              # SHA-256 and PBKDF2 wrappers
│   ├── entropy/             # Secure entropy generation
│   ├── errors/              # Standard error codes
│   ├── integration/         # Error messaging and integration adapters
│   ├── normalize/           # Compatibility input normalization
│   ├── parser/              # Strict mnemonic parsing rules
│   ├── types/               # Shared DTOs and result types
│   └── index.ts             # Public export surface
├── test/                    # Unit and integration tests
├── biome.json               # Lint/format configuration
├── package.json             # Scripts and package metadata
├── README.md                # Project overview and usage
├── tsconfig.build.json      # Build-time TypeScript configuration
└── tsconfig.json            # Base TypeScript configuration
```

## License

MIT - see [LICENSE](LICENSE).
