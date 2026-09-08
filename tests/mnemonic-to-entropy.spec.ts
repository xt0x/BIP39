import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "vitest";

import {
	ChecksumMismatchError,
	InvalidMnemonicFormatError,
	InvalidWordCountError,
	MnemonicToEntropyError,
	mnemonicToEntropy,
	WordNotInListError,
} from "../src/bip39/mnemonic.ts";
import { ErrorCode } from "../src/errors/errorCodes.ts";

type Vector = [string, string, string, string];

const validMnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

test("mnemonicToEntropy rejects invalid format", () => {
	assert.throws(
		() => mnemonicToEntropy(` ${validMnemonic}`),
		(error) =>
			error instanceof InvalidMnemonicFormatError &&
			error.code === ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
	);
});

test("mnemonicToEntropy rejects invalid word count", () => {
	assert.throws(
		() => mnemonicToEntropy(validMnemonic.replace(" about", "")),
		(error) =>
			error instanceof InvalidWordCountError &&
			error.code === ErrorCode.ERR_INVALID_WORD_COUNT,
	);
});

test("mnemonicToEntropy rejects word not in list", () => {
	assert.throws(
		() => mnemonicToEntropy(validMnemonic.replace("about", "typo")),
		(error) =>
			error instanceof WordNotInListError &&
			error.code === ErrorCode.ERR_WORD_NOT_IN_LIST,
	);
});

test("mnemonicToEntropy rejects checksum mismatch", () => {
	const invalid =
		"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon";
	assert.throws(
		() => mnemonicToEntropy(invalid),
		(error) =>
			error instanceof ChecksumMismatchError &&
			error.code === ErrorCode.ERR_CHECKSUM_MISMATCH,
	);
});

test("mnemonicToEntropy matches official vectors", async () => {
	const filePath = resolve(process.cwd(), "assets/vectors.json");
	const payload = JSON.parse(await readFile(filePath, "utf8")) as {
		english: Vector[];
	};

	for (const [entropyHex, mnemonic] of payload.english) {
		const entropy = mnemonicToEntropy(mnemonic);
		const hex = Array.from(entropy)
			.map((byte) => byte.toString(16).padStart(2, "0"))
			.join("");
		assert.equal(hex, entropyHex);
	}
});

test("mnemonicToEntropy error types share base class", () => {
	const error = new InvalidMnemonicFormatError();
	assert.ok(error instanceof MnemonicToEntropyError);
});

test.each([
	{
		ErrorType: InvalidMnemonicFormatError,
		name: "InvalidMnemonicFormatError",
		code: ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
		message: "Invalid mnemonic format",
	},
	{
		ErrorType: InvalidWordCountError,
		name: "InvalidWordCountError",
		code: ErrorCode.ERR_INVALID_WORD_COUNT,
		message: "Invalid word count",
	},
	{
		ErrorType: WordNotInListError,
		name: "WordNotInListError",
		code: ErrorCode.ERR_WORD_NOT_IN_LIST,
		message: "Word not in list",
	},
	{
		ErrorType: ChecksumMismatchError,
		name: "ChecksumMismatchError",
		code: ErrorCode.ERR_CHECKSUM_MISMATCH,
		message: "Checksum mismatch",
	},
])("$name preserves its public identity and optional message", ({
	ErrorType,
	name,
	code,
	message,
}) => {
	for (const [error, expectedMessage] of [
		[new ErrorType(), message],
		[new ErrorType("custom message"), "custom message"],
	] as const) {
		assert.ok(error instanceof Error);
		assert.ok(error instanceof MnemonicToEntropyError);
		assert.equal(error.name, name);
		assert.equal(error.code, code);
		assert.equal(error.message, expectedMessage);
	}
});

test("MnemonicToEntropyError preserves its supplied code and message", () => {
	const error = new MnemonicToEntropyError(
		ErrorCode.ERR_INVALID_WORD_COUNT,
		"custom message",
	);
	assert.ok(error instanceof Error);
	assert.equal(error.name, "MnemonicToEntropyError");
	assert.equal(error.code, ErrorCode.ERR_INVALID_WORD_COUNT);
	assert.equal(error.message, "custom message");
});
