import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
	EntropyLengthError,
	entropyToMnemonic,
} from "../src/bip39/entropyToMnemonic.ts";
import {
	ChecksumMismatchError,
	InvalidMnemonicFormatError,
	InvalidWordCountError,
	mnemonicToEntropy,
	WordNotInListError,
} from "../src/bip39/mnemonicToEntropy.ts";
import {
	InvalidMnemonicSeedFormatError,
	mnemonicToSeed,
} from "../src/bip39/mnemonicToSeed.ts";
import { validateMnemonic } from "../src/bip39/validateMnemonic.ts";
import { ErrorCode } from "../src/errors/errorCodes.ts";

const hexToBytes = (hex: string): Uint8Array =>
	Uint8Array.from(hex.match(/.{2}/g) ?? [], (byte) =>
		Number.parseInt(byte, 16),
	);

const bytesToHex = (bytes: Uint8Array): string =>
	Array.from(bytes)
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");

type Vector = [string, string, string, string];

const loadVectors = async (): Promise<Vector[]> => {
	const filePath = resolve(process.cwd(), "assets/vectors.json");
	const payload = JSON.parse(await readFile(filePath, "utf8")) as {
		english: Vector[];
	};
	return payload.english;
};

test("roundtrip entropy -> mnemonic -> entropy holds for vectors", async () => {
	const vectors = await loadVectors();
	for (const [entropyHex, mnemonic] of vectors) {
		const entropy = hexToBytes(entropyHex);
		const derivedMnemonic = entropyToMnemonic(entropy);
		assert.equal(derivedMnemonic, mnemonic);
		const roundtrip = mnemonicToEntropy(derivedMnemonic);
		assert.equal(bytesToHex(roundtrip), entropyHex);
	}
});

test("roundtrip covers all allowed entropy lengths", () => {
	const lengths = [16, 20, 24, 28, 32];
	for (const length of lengths) {
		const entropy = Uint8Array.from({ length }, (_, i) => i & 0xff);
		const mnemonic = entropyToMnemonic(entropy);
		const roundtrip = mnemonicToEntropy(mnemonic);
		assert.equal(bytesToHex(roundtrip), bytesToHex(entropy));
	}
});

test("failure cases from appendix C are enforced", () => {
	assert.throws(
		() => entropyToMnemonic(new Uint8Array(15)),
		(error) =>
			error instanceof EntropyLengthError &&
			error.code === ErrorCode.ERR_ENTROPY_LENGTH,
	);

	assert.throws(
		() =>
			mnemonicToEntropy(
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon",
			),
		(error) =>
			error instanceof InvalidWordCountError &&
			error.code === ErrorCode.ERR_INVALID_WORD_COUNT,
	);

	assert.throws(
		() =>
			mnemonicToEntropy(
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon",
			),
		(error) =>
			error instanceof ChecksumMismatchError &&
			error.code === ErrorCode.ERR_CHECKSUM_MISMATCH,
	);

	assert.throws(
		() =>
			mnemonicToEntropy(
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon typo",
			),
		(error) =>
			error instanceof WordNotInListError &&
			error.code === ErrorCode.ERR_WORD_NOT_IN_LIST,
	);

	assert.throws(
		() =>
			mnemonicToEntropy(
				"abandon\tabandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
			),
		(error) =>
			error instanceof InvalidMnemonicFormatError &&
			error.code === ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
	);

	assert.throws(
		() => mnemonicToSeed(["abandon", "", "abandon"]),
		(error) =>
			error instanceof InvalidMnemonicSeedFormatError &&
			error.code === ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
	);
});

test("error priority favors word list before checksum", () => {
	const result = validateMnemonic(
		"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon typo",
	);
	assert.equal(result.ok, false);
	assert.equal(result.error_code, ErrorCode.ERR_WORD_NOT_IN_LIST);
	assert.equal(result.invalid_word, "typo");
});

test("error priority favors invalid format before word count", () => {
	const result = validateMnemonic(
		"abandon\tabandon abandon abandon abandon abandon abandon abandon abandon abandon abandon",
	);
	assert.equal(result.ok, false);
	assert.equal(result.error_code, ErrorCode.ERR_INVALID_MNEMONIC_FORMAT);
});
