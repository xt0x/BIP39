import assert from "node:assert/strict";
import { test } from "vitest";

import type { CliIO } from "../../src/cli/runCli.ts";
import { runCli } from "../../src/cli/runCli.ts";

const ENTROPY_HEX = "00000000000000000000000000000000";
const MNEMONIC =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const SEED_HEX =
	"c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e5349553" +
	"1f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04";
const USAGE = `Usage: bip39 <command> [options] [input]

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

const createIo = (stdin: string | null = null) => {
	const stdout: string[] = [];
	const stderr: string[] = [];
	const io: CliIO = {
		readStdin: async () => stdin,
		writeStdout: (text) => {
			stdout.push(text);
		},
		writeStderr: (text) => {
			stderr.push(text);
		},
	};
	return { io, stdout, stderr };
};

test("runCli validate succeeds with args", async () => {
	const { io, stdout, stderr } = createIo();
	const exitCode = await runCli(["validate", MNEMONIC], io);
	assert.equal(exitCode, 0);
	assert.equal(stdout.join(""), `valid\nnormalized: ${MNEMONIC}\n`);
	assert.equal(stderr.join(""), "");
});

test("runCli validate reads from stdin", async () => {
	const { io, stdout, stderr } = createIo(`\t${MNEMONIC.toUpperCase()}\n`);
	const exitCode = await runCli(["validate"], io);
	assert.equal(exitCode, 0);
	assert.equal(stdout.join(""), `valid\nnormalized: ${MNEMONIC}\n`);
	assert.equal(stderr.join(""), "");
});

test("runCli entropy-to-mnemonic outputs mnemonic", async () => {
	const { io, stdout } = createIo();
	const exitCode = await runCli(["entropy-to-mnemonic", ENTROPY_HEX], io);
	assert.equal(exitCode, 0);
	assert.equal(stdout.join("").trim(), MNEMONIC);
});

test.each([
	["0", "Hex input must have even length"],
	["zz", "Hex input contains non-hex characters"],
	[" \n", "Hex input is empty"],
])("runCli rejects invalid hex %j with usage exit code", async (input, message) => {
	const { io, stdout, stderr } = createIo();
	assert.equal(await runCli(["entropy-to-mnemonic", input], io), 2);
	assert.equal(stdout.join(""), "");
	assert.equal(stderr.join(""), `Invalid hex: ${message}\n`);
});

test("runCli mnemonic-to-entropy outputs hex", async () => {
	const { io, stdout } = createIo();
	const exitCode = await runCli(["mnemonic-to-entropy", MNEMONIC], io);
	assert.equal(exitCode, 0);
	assert.equal(stdout.join("").trim(), ENTROPY_HEX);
});

test("runCli mnemonic-to-seed outputs seed hex", async () => {
	const { io, stdout } = createIo();
	const exitCode = await runCli(
		["mnemonic-to-seed", MNEMONIC, "--passphrase", "TREZOR"],
		io,
	);
	assert.equal(exitCode, 0);
	assert.equal(stdout.join("").trim(), SEED_HEX);
});

test.each([
	{
		argv: ["validate", ...MNEMONIC.split(" ")],
		output: `valid\nnormalized: ${MNEMONIC}\n`,
	},
	{
		argv: ["entropy-to-mnemonic", ENTROPY_HEX],
		output: `${MNEMONIC}\n`,
	},
	{
		argv: ["mnemonic-to-entropy", ...MNEMONIC.split(" ")],
		output: `${ENTROPY_HEX}\n`,
	},
	{
		argv: [
			"mnemonic-to-seed",
			...MNEMONIC.split(" "),
			"--passphrase",
			"TREZOR",
		],
		output: `${SEED_HEX}\n`,
	},
])("runCli gives arguments precedence over stdin: $argv.0", async ({
	argv,
	output,
}) => {
	const { io, stdout, stderr } = createIo();
	io.readStdin = async () => {
		assert.fail("stdin must not be read when an argument was supplied");
	};
	assert.equal(await runCli(argv, io), 0);
	assert.equal(stdout.join(""), output);
	assert.equal(stderr.join(""), "");
});

test.each([
	{
		argv: ["entropy-to-mnemonic", "00"],
		code: "ERR_ENTROPY_LENGTH",
		message: "Entropy length must be 16/20/24/28/32 bytes.",
	},
	...(["validate", "mnemonic-to-entropy"] as const).flatMap((command) => [
		{
			argv: [command, `${MNEMONIC}\n`, "--strict"],
			code: "ERR_INVALID_MNEMONIC_FORMAT",
			message: "Mnemonic format is invalid.",
		},
		{
			argv: [command, "abandon"],
			code: "ERR_INVALID_WORD_COUNT",
			message: "Mnemonic word count must be 12/15/18/21/24.",
		},
		{
			argv: [command, MNEMONIC.replace("about", "unknownword")],
			code: "ERR_WORD_NOT_IN_LIST",
			message: "Mnemonic contains an unknown word.",
		},
		{
			argv: [command, MNEMONIC.replace("about", "abandon")],
			code: "ERR_CHECKSUM_MISMATCH",
			message: "Mnemonic checksum does not match.",
		},
	]),
])("runCli reports $code for $argv.0", async ({ argv, code, message }) => {
	const { io, stdout, stderr } = createIo();
	assert.equal(await runCli(argv, io), 1);
	assert.equal(stdout.join(""), "");
	assert.equal(stderr.join(""), `error_code: ${code}\nmessage: ${message}\n`);
});

test.each([
	{ argv: [], message: "Missing command" },
	{ argv: ["unknown"], message: "Unknown command: unknown" },
	{ argv: ["validate", "--nope"], message: "Unknown option: --nope" },
	{
		argv: ["mnemonic-to-seed", "--passphrase"],
		message: "Missing value for --passphrase",
	},
	{
		argv: ["generate-entropy", "--bytes", "17"],
		message: "Invalid --bytes value",
	},
	{
		argv: ["generate-mnemonic", "--words", "13"],
		message: "Invalid --words value",
	},
	{
		argv: ["generate-mnemonic-with-wordlist", "--words", "13"],
		message: "Invalid --words value",
	},
	{
		argv: ["entropy-to-mnemonic", ENTROPY_HEX, ENTROPY_HEX],
		message: "Too many arguments",
	},
	...[
		"validate",
		"entropy-to-mnemonic",
		"mnemonic-to-entropy",
		"mnemonic-to-seed",
	].map((command) => ({ argv: [command], message: "Missing input" })),
])("runCli reports usage error $message for $argv.0", async ({
	argv,
	message,
}) => {
	const { io, stdout, stderr } = createIo();
	assert.equal(await runCli(argv, io), 2);
	assert.equal(stdout.join(""), "");
	assert.equal(stderr.join(""), `${message}\n${USAGE}`);
});

test("runCli prints help to stdout and succeeds", async () => {
	const { io, stdout, stderr } = createIo();
	assert.equal(await runCli(["--help"], io), 0);
	assert.equal(stdout.join(""), USAGE);
	assert.equal(stderr.join(""), "");
});

test("runCli reports unexpected I/O errors with exit code 3", async () => {
	const { io, stdout, stderr } = createIo();
	io.readStdin = async () => {
		throw new Error("stdin unavailable");
	};
	assert.equal(await runCli(["validate"], io), 3);
	assert.equal(stdout.join(""), "");
	assert.equal(stderr.join(""), "Unexpected error: stdin unavailable\n");
});

test("runCli generate-entropy outputs hex of default length", async () => {
	const { io, stdout } = createIo();
	const exitCode = await runCli(["generate-entropy"], io);
	assert.equal(exitCode, 0);
	const hex = stdout.join("").trim();
	assert.equal(hex.length, 32);
	assert.match(hex, /^[0-9a-f]+$/u);
});

test("runCli generate-mnemonic outputs requested word count", async () => {
	const { io, stdout } = createIo();
	const exitCode = await runCli(["generate-mnemonic", "--words", "12"], io);
	assert.equal(exitCode, 0);
	const words = stdout.join("").trim().split(" ");
	assert.equal(words.length, 12);
});

test("runCli generate-mnemonic-with-wordlist outputs mnemonic and wordlist", async () => {
	const { io, stdout } = createIo();
	const exitCode = await runCli(
		["generate-mnemonic-with-wordlist", "--words", "12"],
		io,
	);
	assert.equal(exitCode, 0);
	const lines = stdout.join("").trimEnd().split("\n");
	assert.ok(lines.length >= 2050);
	assert.match(lines[0], /^mnemonic: /u);
	const mnemonic = lines[0].replace(/^mnemonic: /u, "");
	assert.equal(mnemonic.split(" ").length, 12);
	assert.equal(lines[1], "wordlist:");
	const wordlist = lines.slice(2);
	assert.equal(wordlist.length, 2048);
	assert.equal(wordlist[0], "abandon");
	assert.equal(wordlist[wordlist.length - 1], "zoo");
});
