import assert from "node:assert/strict";
import test from "node:test";

import type { CliIO } from "../../src/cli/runCli.ts";
import { runCli } from "../../src/cli/runCli.ts";

const ENTROPY_HEX = "00000000000000000000000000000000";
const MNEMONIC =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const SEED_HEX =
	"c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e5349553" +
	"1f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04";

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
	const { io, stdout } = createIo();
	const exitCode = await runCli(["validate", MNEMONIC], io);
	assert.equal(exitCode, 0);
	const output = stdout.join("");
	assert.match(output, /^valid\nnormalized: /u);
});

test("runCli validate reads from stdin", async () => {
	const { io, stdout } = createIo(MNEMONIC);
	const exitCode = await runCli(["validate"], io);
	assert.equal(exitCode, 0);
	assert.match(stdout.join(""), /^valid\nnormalized: /u);
});

test("runCli entropy-to-mnemonic outputs mnemonic", async () => {
	const { io, stdout } = createIo();
	const exitCode = await runCli(["entropy-to-mnemonic", ENTROPY_HEX], io);
	assert.equal(exitCode, 0);
	assert.equal(stdout.join("").trim(), MNEMONIC);
});

test("runCli entropy-to-mnemonic rejects invalid hex", async () => {
	const { io, stderr } = createIo();
	const exitCode = await runCli(["entropy-to-mnemonic", "0"], io);
	assert.equal(exitCode, 2);
	assert.match(stderr.join(""), /Invalid hex/u);
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
