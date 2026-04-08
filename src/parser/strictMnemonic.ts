import { ErrorCode } from "../errors/errorCodes.js";

export type StrictMnemonicParseSuccess = {
	ok: true;
	words: string[];
	normalized_mnemonic: string;
};

export type StrictMnemonicParseFailure = {
	ok: false;
	error_code: ErrorCode.ERR_INVALID_MNEMONIC_FORMAT;
};

export type StrictMnemonicParseResult =
	| StrictMnemonicParseSuccess
	| StrictMnemonicParseFailure;

const isNfkd = (text: string): boolean => text.normalize("NFKD") === text;

const isLowercaseAsciiWord = (word: string): boolean => /^[a-z]+$/.test(word);

const parseWordsFromString = (text: string): string[] | null => {
	if (text.length === 0) {
		return null;
	}
	if (!isNfkd(text)) {
		return null;
	}
	const words = text.split(" ");
	if (words.some((word) => word.length === 0)) {
		return null;
	}
	if (words.join(" ") !== text) {
		return null;
	}
	if (!words.every(isLowercaseAsciiWord)) {
		return null;
	}
	return words;
};

const parseWordsFromList = (value: unknown[]): string[] | null => {
	if (value.length === 0) {
		return null;
	}
	const words: string[] = [];
	for (const item of value) {
		if (typeof item !== "string") {
			return null;
		}
		if (item.length === 0) {
			return null;
		}
		if (/\s/u.test(item)) {
			return null;
		}
		if (!isLowercaseAsciiWord(item)) {
			return null;
		}
		words.push(item);
	}
	const normalized = words.join(" ");
	const stringWords = parseWordsFromString(normalized);
	if (!stringWords) {
		return null;
	}
	return words;
};

export const parseMnemonicWordsStrict = (
	input: string | string[],
): StrictMnemonicParseResult => {
	const words =
		typeof input === "string"
			? parseWordsFromString(input)
			: Array.isArray(input)
				? parseWordsFromList(input)
				: null;

	if (!words) {
		return {
			ok: false,
			error_code: ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
		};
	}

	return {
		ok: true,
		words,
		normalized_mnemonic: words.join(" "),
	};
};
