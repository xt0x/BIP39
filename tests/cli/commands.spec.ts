import assert from "node:assert/strict";
import { pbkdf2Sync } from "node:crypto";
import { test } from "vitest";

import { InvalidMnemonicFormatError } from "../../src/bip39/mnemonicToEntropy.ts";
import {
	generateMnemonicCommand,
	generateMnemonicWithWordlistCommand,
	mnemonicToEntropyCommand,
	mnemonicToSeedCommand,
	validateCommand,
} from "../../src/cli/commands.ts";
import { ErrorCode } from "../../src/errors/errorCodes.ts";

const ENTROPY_HEX = "00000000000000000000000000000000";
const MNEMONIC =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const SEED_HEX =
	"c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e5349553" +
	"1f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04";

const bytesToHex = (bytes: Uint8Array): string =>
	Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

test("mnemonicToEntropyCommand matches vector", () => {
	const entropy = mnemonicToEntropyCommand(MNEMONIC, false);
	assert.equal(bytesToHex(entropy), ENTROPY_HEX);
});

test("mnemonicToSeedCommand matches vector", () => {
	const seed = mnemonicToSeedCommand(MNEMONIC, false, "TREZOR");
	assert.equal(bytesToHex(seed), SEED_HEX);
});

test("validateCommand returns normalized mnemonic", () => {
	assert.deepEqual(validateCommand(MNEMONIC, true), {
		ok: true,
		normalized: MNEMONIC,
	});
});

test.each([
	12, 15, 18, 21, 24,
])("generateMnemonicCommand returns a valid %i-word mnemonic", (words) => {
	const mnemonic = generateMnemonicCommand(words);
	assert.equal(mnemonic.split(" ").length, words);
	assert.deepEqual(validateCommand(mnemonic, true), {
		ok: true,
		normalized: mnemonic,
	});
});

test.each([
	12, 15, 18, 21, 24,
])("generateMnemonicWithWordlistCommand returns %i valid words and the English wordlist", (words) => {
	const result = generateMnemonicWithWordlistCommand(words);
	assert.equal(result.mnemonic.split(" ").length, words);
	assert.deepEqual(validateCommand(result.mnemonic, true), {
		ok: true,
		normalized: result.mnemonic,
	});
	assert.equal(result.wordlist.length, 2048);
	assert.equal(new Set(result.wordlist).size, 2048);
	assert.equal(result.wordlist[0], "abandon");
	assert.equal(result.wordlist[result.wordlist.length - 1], "zoo");
	for (const word of result.mnemonic.split(" ")) {
		assert.ok(result.wordlist.includes(word));
	}
});

test.each([
	["uppercase", MNEMONIC.toUpperCase()],
	["whitespace", ` \t${MNEMONIC.replaceAll(" ", "  \t")}\r\n`],
	["compatibility characters", MNEMONIC.replaceAll("a", "ａ")],
])("mnemonic commands normalize %s unless strict", (_label, input) => {
	assert.deepEqual(validateCommand(input, false), {
		ok: true,
		normalized: MNEMONIC,
	});
	assert.equal(bytesToHex(mnemonicToEntropyCommand(input, false)), ENTROPY_HEX);
	assert.equal(
		bytesToHex(mnemonicToSeedCommand(input, false, "TREZOR")),
		SEED_HEX,
	);
	assert.deepEqual(validateCommand(input, true), {
		ok: false,
		errorCode: ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
	});
	assert.throws(
		() => mnemonicToEntropyCommand(input, true),
		InvalidMnemonicFormatError,
	);

	// BIP39 seed derivation applies NFKD even when CLI cleanup is disabled.
	const strictSeed = pbkdf2Sync(
		input.normalize("NFKD"),
		"mnemonicTREZOR",
		2048,
		64,
		"sha512",
	);
	assert.equal(
		bytesToHex(mnemonicToSeedCommand(input, true, "TREZOR")),
		strictSeed.toString("hex"),
	);
});

test.each([
	["", ErrorCode.ERR_INVALID_MNEMONIC_FORMAT],
	["abandon", ErrorCode.ERR_INVALID_WORD_COUNT],
	[MNEMONIC.replace("about", "unknownword"), ErrorCode.ERR_WORD_NOT_IN_LIST],
	[MNEMONIC.replace("about", "abandon"), ErrorCode.ERR_CHECKSUM_MISMATCH],
])("validateCommand reports the error for %s", (input, errorCode) => {
	assert.deepEqual(validateCommand(input, true), { ok: false, errorCode });
});

test.each([
	false,
	true,
])("mnemonicToSeedCommand preserves passphrase case and spaces with strict=%s", (strict) => {
	const passphrase = " TréZoR \t";
	const expected = pbkdf2Sync(
		MNEMONIC,
		`mnemonic${passphrase.normalize("NFKD")}`,
		2048,
		64,
		"sha512",
	);
	assert.equal(
		bytesToHex(mnemonicToSeedCommand(MNEMONIC, strict, passphrase)),
		expected.toString("hex"),
	);
});

test.each([
	"",
	"not a bip39 sentence",
	MNEMONIC.replace("about", "abandon"),
])("mnemonicToSeedCommand derives a seed without mnemonic validation: %s", (input) => {
	const expected = pbkdf2Sync(input, "mnemonic", 2048, 64, "sha512");
	for (const strict of [false, true]) {
		assert.equal(
			bytesToHex(mnemonicToSeedCommand(input, strict, "")),
			expected.toString("hex"),
		);
	}
});

test.each([
	generateMnemonicCommand,
	generateMnemonicWithWordlistCommand,
])("%s preserves the unsupported-word-count exception", (generate) => {
	assert.throws(() => generate(13), {
		constructor: Error,
		message: "Unsupported word count: 13",
	});
});
