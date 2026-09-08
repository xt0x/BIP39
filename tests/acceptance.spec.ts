import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "vitest";

import {
	ChecksumMismatchError,
	EntropyLengthError,
	ErrorCode,
	entropyToMnemonic,
	InvalidMnemonicFormatError,
	InvalidMnemonicSeedFormatError,
	InvalidWordCountError,
	MnemonicToEntropyError,
	mnemonicToEntropy,
	mnemonicToSeed,
	validateMnemonic,
	WordNotInListError,
} from "../src/index.ts";

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

// Fixed zero-entropy cases for every ENT/CS/MS row in assets/bip-0039.mediawiki.
// The pinned official vectors do not include the 15- and 21-word lengths.
test.each([
	{ bytes: 16, wordCount: 12, lastWord: "about" },
	{ bytes: 20, wordCount: 15, lastWord: "address" },
	{ bytes: 24, wordCount: 18, lastWord: "agent" },
	{ bytes: 28, wordCount: 21, lastWord: "admit" },
	{ bytes: 32, wordCount: 24, lastWord: "art" },
])("public APIs support $wordCount words with string and array input", ({
	bytes,
	wordCount,
	lastWord,
}) => {
	const entropy = new Uint8Array(bytes);
	const words = [...Array<string>(wordCount - 1).fill("abandon"), lastWord];
	const mnemonic = words.join(" ");
	assert.equal(entropyToMnemonic(entropy), mnemonic);
	for (const input of [mnemonic, words]) {
		assert.deepEqual(mnemonicToEntropy(input), entropy);
		assert.deepEqual(validateMnemonic(input), {
			ok: true,
			error_code: null,
			normalized_mnemonic: mnemonic,
			word_count: wordCount,
			invalid_word: null,
		});
	}
	assert.equal(words.join(" "), mnemonic);
	assert.deepEqual(entropy, new Uint8Array(bytes));
});

const invalidMnemonicCases = [
	{
		label: "format before word count and unknown words",
		mnemonic: "TYPO abandon",
		code: ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
		ErrorType: InvalidMnemonicFormatError,
		message: "Invalid mnemonic format",
		normalized: null,
		wordCount: null,
		invalidWord: null,
	},
	{
		label: "word count before unknown words",
		mnemonic: "typo abandon",
		code: ErrorCode.ERR_INVALID_WORD_COUNT,
		ErrorType: InvalidWordCountError,
		message: "Invalid word count",
		normalized: "typo abandon",
		wordCount: 2,
		invalidWord: null,
	},
	{
		label: "unknown word before checksum",
		mnemonic: `${"abandon ".repeat(11)}typo`,
		code: ErrorCode.ERR_WORD_NOT_IN_LIST,
		ErrorType: WordNotInListError,
		message: "Word not in list: typo",
		normalized: `${"abandon ".repeat(11)}typo`,
		wordCount: 12,
		invalidWord: "typo",
	},
	{
		label: "first unknown word when several are present",
		mnemonic: `typo ${"abandon ".repeat(10)}unknown`,
		code: ErrorCode.ERR_WORD_NOT_IN_LIST,
		ErrorType: WordNotInListError,
		message: "Word not in list: typo",
		normalized: `typo ${"abandon ".repeat(10)}unknown`,
		wordCount: 12,
		invalidWord: "typo",
	},
	{
		label: "checksum after valid format, word count and words",
		mnemonic: Array<string>(12).fill("abandon").join(" "),
		code: ErrorCode.ERR_CHECKSUM_MISMATCH,
		ErrorType: ChecksumMismatchError,
		message: "Checksum mismatch",
		normalized: Array<string>(12).fill("abandon").join(" "),
		wordCount: 12,
		invalidWord: null,
	},
];

test.each(
	invalidMnemonicCases,
)("public validation and decoding preserve $label", ({
	mnemonic,
	code,
	ErrorType,
	message,
	normalized,
	wordCount,
	invalidWord,
}) => {
	for (const input of [mnemonic, mnemonic.split(" ")]) {
		assert.deepEqual(validateMnemonic(input), {
			ok: false,
			error_code: code,
			normalized_mnemonic: normalized,
			word_count: wordCount,
			invalid_word: invalidWord,
		});
		assert.throws(
			() => mnemonicToEntropy(input),
			(error: unknown) => {
				assert.ok(error instanceof ErrorType);
				assert.ok(error instanceof MnemonicToEntropyError);
				assert.equal(error.name, ErrorType.name);
				assert.equal(error.code, code);
				assert.equal(error.message, message);
				return true;
			},
		);
	}
});

test("failure cases from appendix C are enforced", () => {
	assert.throws(
		() => entropyToMnemonic(new Uint8Array(15)),
		(error: unknown) =>
			error instanceof EntropyLengthError &&
			error.code === ErrorCode.ERR_ENTROPY_LENGTH,
	);

	assert.throws(
		() =>
			mnemonicToEntropy(
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon",
			),
		(error: unknown) =>
			error instanceof InvalidWordCountError &&
			error.code === ErrorCode.ERR_INVALID_WORD_COUNT,
	);

	assert.throws(
		() =>
			mnemonicToEntropy(
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon",
			),
		(error: unknown) =>
			error instanceof ChecksumMismatchError &&
			error.code === ErrorCode.ERR_CHECKSUM_MISMATCH,
	);

	assert.throws(
		() =>
			mnemonicToEntropy(
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon typo",
			),
		(error: unknown) =>
			error instanceof WordNotInListError &&
			error.code === ErrorCode.ERR_WORD_NOT_IN_LIST,
	);

	assert.throws(
		() =>
			mnemonicToEntropy(
				"abandon\tabandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
			),
		(error: unknown) =>
			error instanceof InvalidMnemonicFormatError &&
			error.code === ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
	);

	assert.throws(
		() => mnemonicToSeed(["abandon", "", "abandon"]),
		(error: unknown) =>
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
