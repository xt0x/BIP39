import { ENTROPY_BYTES, WORD_COUNTS } from "../constants/bip39.js";
import type { ErrorCode } from "../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../integration/errorMessages.js";
import { parseArgs } from "./args.js";
import { entropyToMnemonicCommand } from "./commands/entropyToMnemonic.js";
import { generateEntropyCommand } from "./commands/generateEntropy.js";
import { generateMnemonicCommand } from "./commands/generateMnemonic.js";
import { generateMnemonicWithWordlistCommand } from "./commands/generateMnemonicWithWordlist.js";
import { mnemonicToEntropyCommand } from "./commands/mnemonicToEntropy.js";
import { mnemonicToSeedCommand } from "./commands/mnemonicToSeed.js";
import { validateCommand } from "./commands/validate.js";
import { bytesToHex, hexToBytes } from "./hex.js";

export type CliIO = {
	readStdin: () => Promise<string | null>;
	writeStdout: (text: string) => void;
	writeStderr: (text: string) => void;
};

type UsageError = {
	message: string;
};

const usage = `Usage: bip39 <command> [options] [input]

Commands:
  validate [MNEMONIC] [--strict]
  entropy-to-mnemonic [HEX]
  mnemonic-to-entropy [MNEMONIC] [--strict]
  mnemonic-to-seed [MNEMONIC] [--strict] [--passphrase <string>]
  generate-entropy [--bytes <16|20|24|28|32>]
  generate-mnemonic [--words <12|15|18|21|24>]
  generate-mnemonic-with-wordlist [--words <12|15|18|21|24>]

Options:
  --help        Show help
  --strict      Disable input normalization
  --passphrase  Passphrase for mnemonic-to-seed
  --bytes       Entropy bytes for generate-entropy
  --words       Word count for generate-mnemonic
`;

const isErrorWithCode = (value: unknown): value is { code: ErrorCode } =>
	!!value && typeof value === "object" && "code" in value;

const formatError = (code: ErrorCode): string => {
	const message = ERROR_MESSAGES[code] ?? "Unknown error";
	return `error_code: ${code}\nmessage: ${message}\n`;
};

const isValidEntropyBytes = (bytes: number): boolean =>
	(ENTROPY_BYTES as readonly number[]).includes(bytes);

const isValidWordCount = (count: number): boolean =>
	(WORD_COUNTS as readonly number[]).includes(count);

const getInputFromArgsOrStdin = async (
	positionals: string[],
	io: CliIO,
	joiner: string,
): Promise<string | null> => {
	if (positionals.length > 0) {
		return positionals.join(joiner);
	}
	return io.readStdin();
};

const getSingleInputOrStdin = async (
	positionals: string[],
	io: CliIO,
): Promise<string | UsageError> => {
	if (positionals.length > 1) {
		return { message: "Too many arguments" };
	}
	const input =
		positionals.length === 1 ? positionals[0] : await io.readStdin();
	if (input === null) {
		return { message: "Missing input" };
	}
	return input;
};

export const runCli = async (argv: string[], io: CliIO): Promise<number> => {
	const parsed = parseArgs(argv);
	if (!parsed.ok) {
		io.writeStderr(`${parsed.error}\n`);
		io.writeStderr(usage);
		return 2;
	}

	const { command, flags, positionals } = parsed.value;
	if (flags.help) {
		io.writeStdout(usage);
		return 0;
	}
	if (!command) {
		io.writeStderr("Missing command\n");
		io.writeStderr(usage);
		return 2;
	}

	try {
		switch (command) {
			case "validate": {
				const input = await getInputFromArgsOrStdin(positionals, io, " ");
				if (input === null) {
					io.writeStderr("Missing input\n");
					io.writeStderr(usage);
					return 2;
				}
				const result = validateCommand(input, flags.strict);
				if (!result.ok) {
					io.writeStderr(formatError(result.errorCode));
					return 1;
				}
				io.writeStdout(`valid\nnormalized: ${result.normalized}\n`);
				return 0;
			}
			case "entropy-to-mnemonic": {
				const input = await getSingleInputOrStdin(positionals, io);
				if (typeof input !== "string") {
					io.writeStderr(`${input.message}\n`);
					io.writeStderr(usage);
					return 2;
				}
				let bytes: Uint8Array;
				try {
					bytes = hexToBytes(input);
				} catch (error) {
					io.writeStderr(`Invalid hex: ${(error as Error).message}\n`);
					return 2;
				}
				const mnemonic = entropyToMnemonicCommand(bytes);
				io.writeStdout(`${mnemonic}\n`);
				return 0;
			}
			case "mnemonic-to-entropy": {
				const input = await getInputFromArgsOrStdin(positionals, io, " ");
				if (input === null) {
					io.writeStderr("Missing input\n");
					io.writeStderr(usage);
					return 2;
				}
				const entropy = mnemonicToEntropyCommand(input, flags.strict);
				io.writeStdout(`${bytesToHex(entropy)}\n`);
				return 0;
			}
			case "mnemonic-to-seed": {
				const input = await getInputFromArgsOrStdin(positionals, io, " ");
				if (input === null) {
					io.writeStderr("Missing input\n");
					io.writeStderr(usage);
					return 2;
				}
				const passphrase = flags.passphrase ?? "";
				const seed = mnemonicToSeedCommand(input, flags.strict, passphrase);
				io.writeStdout(`${bytesToHex(seed)}\n`);
				return 0;
			}
			case "generate-entropy": {
				const bytes = flags.bytes ?? 16;
				if (!isValidEntropyBytes(bytes)) {
					io.writeStderr("Invalid --bytes value\n");
					io.writeStderr(usage);
					return 2;
				}
				const entropy = generateEntropyCommand(bytes);
				io.writeStdout(`${bytesToHex(entropy)}\n`);
				return 0;
			}
			case "generate-mnemonic": {
				const words = flags.words ?? 12;
				if (!isValidWordCount(words)) {
					io.writeStderr("Invalid --words value\n");
					io.writeStderr(usage);
					return 2;
				}
				const mnemonic = generateMnemonicCommand(words);
				io.writeStdout(`${mnemonic}\n`);
				return 0;
			}
			case "generate-mnemonic-with-wordlist": {
				const words = flags.words ?? 12;
				if (!isValidWordCount(words)) {
					io.writeStderr("Invalid --words value\n");
					io.writeStderr(usage);
					return 2;
				}
				const result = generateMnemonicWithWordlistCommand(words);
				io.writeStdout(`mnemonic: ${result.mnemonic}\n`);
				io.writeStdout("wordlist:\n");
				for (const word of result.wordlist) {
					io.writeStdout(`${word}\n`);
				}
				return 0;
			}
			default:
				io.writeStderr("Unknown command\n");
				io.writeStderr(usage);
				return 2;
		}
	} catch (error) {
		if (isErrorWithCode(error)) {
			io.writeStderr(formatError(error.code));
			return 1;
		}
		io.writeStderr(`Unexpected error: ${(error as Error).message}\n`);
		return 3;
	}
};
