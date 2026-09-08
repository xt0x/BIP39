import { bitsToBytes, bytesToBits, integersToBits } from "./bitOps.js";
import { WORD_COUNTS } from "./constants.js";
import { sha256 } from "./crypto.js";
import { ErrorCode } from "./errorCodes.js";
import { parseMnemonicWordsStrict } from "./strictMnemonic.js";
import { loadEnglishWordlistSync } from "./wordlist.js";

export type ValidationResult = {
	ok: boolean;
	error_code: ErrorCode | null;
	normalized_mnemonic: string | null;
	word_count: number | null;
	invalid_word: string | null;
};

export class MnemonicToEntropyError extends Error {
	code: ErrorCode;

	constructor(code: ErrorCode, message: string) {
		super(message);
		this.code = code;
		this.name = "MnemonicToEntropyError";
	}
}

export class InvalidMnemonicFormatError extends MnemonicToEntropyError {
	constructor(message = "Invalid mnemonic format") {
		super(ErrorCode.ERR_INVALID_MNEMONIC_FORMAT, message);
		this.name = "InvalidMnemonicFormatError";
	}
}

export class InvalidWordCountError extends MnemonicToEntropyError {
	constructor(message = "Invalid word count") {
		super(ErrorCode.ERR_INVALID_WORD_COUNT, message);
		this.name = "InvalidWordCountError";
	}
}

export class WordNotInListError extends MnemonicToEntropyError {
	constructor(message = "Word not in list") {
		super(ErrorCode.ERR_WORD_NOT_IN_LIST, message);
		this.name = "WordNotInListError";
	}
}

export class ChecksumMismatchError extends MnemonicToEntropyError {
	constructor(message = "Checksum mismatch") {
		super(ErrorCode.ERR_CHECKSUM_MISMATCH, message);
		this.name = "ChecksumMismatchError";
	}
}

type MnemonicDecodeResult =
	| {
			ok: true;
			entropy: Uint8Array;
			normalized_mnemonic: string;
			word_count: number;
	  }
	| {
			ok: false;
			error_code:
				| ErrorCode.ERR_INVALID_MNEMONIC_FORMAT
				| ErrorCode.ERR_INVALID_WORD_COUNT
				| ErrorCode.ERR_WORD_NOT_IN_LIST
				| ErrorCode.ERR_CHECKSUM_MISMATCH;
			normalized_mnemonic: string | null;
			word_count: number | null;
			invalid_word: string | null;
	  };

const isValidWordCount = (count: number): boolean =>
	(WORD_COUNTS as readonly number[]).includes(count);

const checksumBitsForWordCount = (wordCount: number): number =>
	wordCount === 0 ? 0 : (wordCount * 11) / 33;

const arraysEqual = (a: number[], b: number[]): boolean =>
	a.length === b.length && a.every((value, index) => value === b[index]);

const decodeMnemonic = (input: string | string[]): MnemonicDecodeResult => {
	const parsed = parseMnemonicWordsStrict(input);
	if (!parsed.ok) {
		return {
			ok: false,
			error_code: ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
			normalized_mnemonic: null,
			word_count: null,
			invalid_word: null,
		};
	}

	const { words, normalized_mnemonic } = parsed;
	const wordCount = words.length;
	if (!isValidWordCount(wordCount)) {
		return {
			ok: false,
			error_code: ErrorCode.ERR_INVALID_WORD_COUNT,
			normalized_mnemonic,
			word_count: wordCount,
			invalid_word: null,
		};
	}

	const { wordToIndex } = loadEnglishWordlistSync();
	const indices: number[] = [];
	for (const word of words) {
		const index = wordToIndex.get(word);
		if (index === undefined) {
			return {
				ok: false,
				error_code: ErrorCode.ERR_WORD_NOT_IN_LIST,
				normalized_mnemonic,
				word_count: wordCount,
				invalid_word: word,
			};
		}
		indices.push(index);
	}

	const bits = integersToBits(indices, 11);
	const checksumBits = checksumBitsForWordCount(wordCount);
	const entropyBits = bits.length - checksumBits;
	const entropyBitArray = bits.slice(0, entropyBits);
	const checksumBitArray = bits.slice(entropyBits);
	const entropy = bitsToBytes(entropyBitArray);
	const expectedChecksum = bytesToBits(sha256(entropy)).slice(0, checksumBits);

	if (!arraysEqual(checksumBitArray, expectedChecksum)) {
		return {
			ok: false,
			error_code: ErrorCode.ERR_CHECKSUM_MISMATCH,
			normalized_mnemonic,
			word_count: wordCount,
			invalid_word: null,
		};
	}

	return {
		ok: true,
		entropy,
		normalized_mnemonic,
		word_count: wordCount,
	};
};

export const validateMnemonic = (
	input: string | string[],
): ValidationResult => {
	const result = decodeMnemonic(input);
	return {
		ok: result.ok,
		error_code: result.ok ? null : result.error_code,
		normalized_mnemonic: result.normalized_mnemonic,
		word_count: result.word_count,
		invalid_word: result.ok ? null : result.invalid_word,
	};
};

export const mnemonicToEntropy = (input: string | string[]): Uint8Array => {
	const result = decodeMnemonic(input);
	if (result.ok) {
		return result.entropy;
	}
	switch (result.error_code) {
		case ErrorCode.ERR_INVALID_MNEMONIC_FORMAT:
			throw new InvalidMnemonicFormatError();
		case ErrorCode.ERR_INVALID_WORD_COUNT:
			throw new InvalidWordCountError();
		case ErrorCode.ERR_WORD_NOT_IN_LIST:
			throw new WordNotInListError(`Word not in list: ${result.invalid_word}`);
		case ErrorCode.ERR_CHECKSUM_MISMATCH:
			throw new ChecksumMismatchError();
	}
};
