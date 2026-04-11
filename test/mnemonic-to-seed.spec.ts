import assert from "node:assert/strict";
import { pbkdf2Sync } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "vitest";

import {
	InvalidMnemonicSeedFormatError,
	mnemonicToSeed,
} from "../src/bip39/mnemonicToSeed.ts";
import { ErrorCode } from "../src/errors/errorCodes.ts";

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
	}
});

test("mnemonicToSeed matches pbkdf2 output with empty passphrase", () => {
	const expected = deriveWithNode(validMnemonic, "");
	const derived = mnemonicToSeed(validMnemonic, "");
	assert.equal(toHex(derived), expected);
});
