export type CliCommand =
	| "validate"
	| "entropy-to-mnemonic"
	| "mnemonic-to-entropy"
	| "mnemonic-to-seed"
	| "generate-entropy"
	| "generate-mnemonic"
	| "generate-mnemonic-with-wordlist";

export type CliFlags = {
	help: boolean;
	strict: boolean;
	passphrase: string | null;
	bytes: number | null;
	words: number | null;
};

export type ParsedArgs = {
	command: CliCommand | null;
	positionals: string[];
	flags: CliFlags;
};

export type ParseResult =
	| {
			ok: true;
			value: ParsedArgs;
	  }
	| {
			ok: false;
			error: string;
	  };

const COMMANDS = new Set<CliCommand>([
	"validate",
	"entropy-to-mnemonic",
	"mnemonic-to-entropy",
	"mnemonic-to-seed",
	"generate-entropy",
	"generate-mnemonic",
	"generate-mnemonic-with-wordlist",
]);

type ParseNumberResult =
	| { ok: true; value: number }
	| { ok: false; error: string };

const parseNumber = (value: string, label: string): ParseNumberResult => {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed)) {
		return { ok: false, error: `Invalid ${label} value: ${value}` };
	}
	return { ok: true, value: parsed };
};

export const parseArgs = (argv: string[]): ParseResult => {
	const flags: CliFlags = {
		help: false,
		strict: false,
		passphrase: null,
		bytes: null,
		words: null,
	};
	let command: CliCommand | null = null;
	const positionals: string[] = [];

	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];
		if (token.startsWith("--")) {
			switch (token) {
				case "--help":
					flags.help = true;
					break;
				case "--strict":
					flags.strict = true;
					break;
				case "--passphrase": {
					const next = argv[index + 1];
					if (!next || next.startsWith("--")) {
						return { ok: false, error: "Missing value for --passphrase" };
					}
					flags.passphrase = next;
					index += 1;
					break;
				}
				case "--bytes": {
					const next = argv[index + 1];
					if (!next || next.startsWith("--")) {
						return { ok: false, error: "Missing value for --bytes" };
					}
					const parsed = parseNumber(next, "bytes");
					if (!parsed.ok) {
						return parsed;
					}
					flags.bytes = parsed.value;
					index += 1;
					break;
				}
				case "--words": {
					const next = argv[index + 1];
					if (!next || next.startsWith("--")) {
						return { ok: false, error: "Missing value for --words" };
					}
					const parsed = parseNumber(next, "words");
					if (!parsed.ok) {
						return parsed;
					}
					flags.words = parsed.value;
					index += 1;
					break;
				}
				default:
					return { ok: false, error: `Unknown option: ${token}` };
			}
			continue;
		}
		if (!command) {
			if (!COMMANDS.has(token as CliCommand)) {
				return { ok: false, error: `Unknown command: ${token}` };
			}
			command = token as CliCommand;
			continue;
		}
		positionals.push(token);
	}

	if (!command && !flags.help) {
		return { ok: false, error: "Missing command" };
	}

	return {
		ok: true,
		value: {
			command,
			positionals,
			flags,
		},
	};
};
