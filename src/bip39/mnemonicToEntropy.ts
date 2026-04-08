import { bitsToBytes, bytesToBits, integersToBits } from "../bits/bitOps.js";
import { WORD_COUNTS } from "../constants/bip39.js";
import { sha256 } from "../crypto/crypto.js";
import { ErrorCode } from "../errors/errorCodes.js";
import { parseMnemonicWordsStrict } from "../parser/strictMnemonic.js";
import { loadEnglishWordlist } from "./englishWordlist.js";

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

const isValidWordCount = (count: number): boolean =>
	(WORD_COUNTS as readonly number[]).includes(count);

const checksumBitsForWordCount = (wordCount: number): number =>
	wordCount === 0 ? 0 : (wordCount * 11) / 33;

const arraysEqual = (a: number[], b: number[]): boolean =>
	a.length === b.length && a.every((value, index) => value === b[index]);

export const mnemonicToEntropy = (input: string | string[]): Uint8Array => {
	const parsed = parseMnemonicWordsStrict(input);
	if (!parsed.ok) {
		throw new InvalidMnemonicFormatError();
	}

	const { words } = parsed;
	const wordCount = words.length;
	if (!isValidWordCount(wordCount)) {
		throw new InvalidWordCountError();
	}

	const { wordToIndex } = loadEnglishWordlist();
	const indices = words.map((word) => {
		const index = wordToIndex.get(word);
		if (index === undefined) {
			throw new WordNotInListError(`Word not in list: ${word}`);
		}
		return index;
	});

	const bits = integersToBits(indices, 11);
	const checksumBits = checksumBitsForWordCount(wordCount);
	const entropyBits = bits.length - checksumBits;
	const entropyBitArray = bits.slice(0, entropyBits);
	const checksumBitArray = bits.slice(entropyBits);
	const entropy = bitsToBytes(entropyBitArray);

	const expectedChecksum = bytesToBits(sha256(entropy)).slice(0, checksumBits);
	if (!arraysEqual(checksumBitArray, expectedChecksum)) {
		throw new ChecksumMismatchError();
	}

	return entropy;
};
