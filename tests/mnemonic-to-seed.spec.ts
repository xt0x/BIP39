import assert from "node:assert/strict";
import { pbkdf2Sync } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "vitest";
import { ErrorCode } from "../src/bip39/errorCodes.ts";
import {
	InvalidMnemonicSeedFormatError,
	mnemonicToSeed,
} from "../src/bip39/mnemonicToSeed.ts";

const toHex = (bytes: Uint8Array): string =>
	Array.from(bytes)
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");

const validMnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

const deriveWithNode = (mnemonic: string, passphrase: string): string => {
	const normalizedMnemonic = mnemonic.normalize("NFKD");
	const normalizedPassphrase = passphrase.normalize("NFKD");
	const salt = `mnemonic${normalizedPassphrase}`;
	const derived = pbkdf2Sync(normalizedMnemonic, salt, 2048, 64, "sha512");
	return derived.toString("hex");
};

test("mnemonicToSeed rejects invalid list input", () => {
	assert.throws(
		() => mnemonicToSeed(["abandon", ""]),
		(error) =>
			error instanceof InvalidMnemonicSeedFormatError &&
			error.code === ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
	);
	assert.throws(
		() => mnemonicToSeed(["abandon", "about about"]),
		(error) =>
			error instanceof InvalidMnemonicSeedFormatError &&
			error.code === ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
	);
	assert.throws(
		() => mnemonicToSeed(["abandon", 123 as unknown as string]),
		(error) =>
			error instanceof InvalidMnemonicSeedFormatError &&
			error.code === ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
	);
});

test("mnemonicToSeed matches official vectors with TREZOR", async () => {
	const filePath = resolve(process.cwd(), "assets/vectors.json");
	const payload = JSON.parse(await readFile(filePath, "utf8")) as {
		english: [string, string, string, string][];
	};

	for (const [, mnemonic, seed] of payload.english) {
		const derived = mnemonicToSeed(mnemonic, "TREZOR");
		assert.equal(toHex(derived), seed);
		assert.equal(toHex(mnemonicToSeed(mnemonic.split(" "), "TREZOR")), seed);
	}
});

test("mnemonicToSeed matches pbkdf2 output with empty passphrase", () => {
	const expected = deriveWithNode(validMnemonic, "");
	const derived = mnemonicToSeed(validMnemonic, "");
	assert.equal(toHex(derived), expected);
	assert.equal(toHex(mnemonicToSeed(validMnemonic)), expected);
});

// BIP39 "From mnemonic to seed" specifies NFKD for both password and salt.
test("mnemonicToSeed normalizes Unicode mnemonic and passphrase to NFKD", () => {
	const mnemonic = "caf\u00e9 \u2460";
	const passphrase = "\u212b";
	const expected = deriveWithNode("cafe\u0301 1", "A\u030a");
	assert.equal(toHex(mnemonicToSeed(mnemonic, passphrase)), expected);
	assert.equal(
		toHex(mnemonicToSeed(mnemonic.split(" "), passphrase)),
		expected,
	);
});

// Seed derivation is independent of wordlist membership and checksum validation.
test.each([
	{ label: "nonstandard word count", mnemonic: "abandon about" },
	{ label: "unknown word", mnemonic: validMnemonic.replace("about", "typo") },
	{
		label: "invalid checksum",
		mnemonic: validMnemonic.replace("about", "abandon"),
	},
])("mnemonicToSeed accepts $label", ({ mnemonic }) => {
	assert.equal(
		toHex(mnemonicToSeed(mnemonic, "TREZOR")),
		deriveWithNode(mnemonic, "TREZOR"),
	);
});

test.each([
	{ label: "uppercase", mnemonic: validMnemonic.toUpperCase() },
	{ label: "outer spaces", mnemonic: ` ${validMnemonic} ` },
	{
		label: "repeated spaces",
		mnemonic: validMnemonic.replace(" ", "  "),
	},
])("mnemonicToSeed preserves $label in string input", ({ mnemonic }) => {
	const seed = toHex(mnemonicToSeed(mnemonic));
	assert.equal(seed, deriveWithNode(mnemonic, ""));
	assert.notEqual(seed, deriveWithNode(validMnemonic, ""));
});

test.each([
	{ label: "empty array", input: [] },
	{ label: "null", input: null },
	{ label: "object", input: {} },
	{ label: "number", input: 123 },
	{ label: "tab in array word", input: ["abandon\tabout"] },
])("mnemonicToSeed rejects $label with its format error", ({ input }) => {
	assert.throws(
		() => mnemonicToSeed(input as unknown as string[]),
		(error: unknown) => {
			assert.ok(error instanceof InvalidMnemonicSeedFormatError);
			assert.equal(error.name, "InvalidMnemonicSeedFormatError");
			assert.equal(error.code, ErrorCode.ERR_INVALID_MNEMONIC_FORMAT);
			assert.equal(error.message, "Invalid mnemonic format");
			return true;
		},
	);
});

test.each([
	{ label: "null", passphrase: null },
	{ label: "number", passphrase: 123 },
	{ label: "array", passphrase: ["TREZOR"] },
])("mnemonicToSeed rejects a $label passphrase", ({ passphrase }) => {
	assert.throws(
		() => mnemonicToSeed(validMnemonic, passphrase as unknown as string),
		(error: unknown) => {
			assert.ok(error instanceof InvalidMnemonicSeedFormatError);
			assert.equal(error.code, ErrorCode.ERR_INVALID_MNEMONIC_FORMAT);
			assert.equal(error.message, "Invalid mnemonic format");
			return true;
		},
	);
});
