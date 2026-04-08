import assert from "node:assert/strict";
import test from "node:test";

import { parseArgs } from "../../src/cli/args.ts";

test("parseArgs parses command, positionals, and strict flag", () => {
	const result = parseArgs(["validate", "abandon", "about", "--strict"]);
	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.value.command, "validate");
	assert.deepEqual(result.value.positionals, ["abandon", "about"]);
	assert.equal(result.value.flags.strict, true);
});

test("parseArgs parses passphrase", () => {
	const result = parseArgs([
		"mnemonic-to-seed",
		"abandon",
		"--passphrase",
		"TREZOR",
	]);
	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.value.flags.passphrase, "TREZOR");
});

test("parseArgs rejects unknown options", () => {
	const result = parseArgs(["validate", "--nope"]);
	assert.equal(result.ok, false);
});

test("parseArgs rejects missing option values", () => {
	const result = parseArgs(["mnemonic-to-seed", "--passphrase"]);
	assert.equal(result.ok, false);
});

test("parseArgs handles --help without command", () => {
	const result = parseArgs(["--help"]);
	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.value.flags.help, true);
	assert.equal(result.value.command, null);
});

test("parseArgs rejects missing command", () => {
	const result = parseArgs([]);
	assert.equal(result.ok, false);
});

test("parseArgs parses numeric options", () => {
	const result = parseArgs([
		"generate-entropy",
		"--bytes",
		"24",
		"--words",
		"12",
	]);
	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.value.flags.bytes, 24);
	assert.equal(result.value.flags.words, 12);
});

test("parseArgs accepts generate-mnemonic-with-wordlist command", () => {
	const result = parseArgs([
		"generate-mnemonic-with-wordlist",
		"--words",
		"12",
	]);
	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.value.command, "generate-mnemonic-with-wordlist");
});
