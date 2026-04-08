import { bitsToBytes, bytesToBits, integersToBits } from "../bits/bitOps.js";
import { WORD_COUNTS } from "../constants/bip39.js";
import { sha256 } from "../crypto/crypto.js";
import { ErrorCode } from "../errors/errorCodes.js";
import { parseMnemonicWordsStrict } from "../parser/strictMnemonic.js";
import type { ValidationResult } from "../types/validationResult.js";
import { loadEnglishWordlist } from "./englishWordlist.js";

const isValidWordCount = (count: number): boolean =>
	(WORD_COUNTS as readonly number[]).includes(count);

const checksumBitsForWordCount = (wordCount: number): number =>
	wordCount === 0 ? 0 : (wordCount * 11) / 33;

const arraysEqual = (a: number[], b: number[]): boolean =>
	a.length === b.length && a.every((value, index) => value === b[index]);

export const validateMnemonic = (
	input: string | string[],
): ValidationResult => {
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

	const { wordToIndex } = loadEnglishWordlist();
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
		error_code: null,
		normalized_mnemonic,
		word_count: wordCount,
		invalid_word: null,
	};
};
