import { entropyBitsForWordCount, type WordCount } from "../bip39/constants.js";
import { generateEntropy } from "../bip39/entropyGenerator.js";
import { entropyToMnemonic } from "../bip39/entropyToMnemonic.js";
import { ErrorCode } from "../bip39/errorCodes.js";
import { mnemonicToEntropy, validateMnemonic } from "../bip39/mnemonic.js";
import { mnemonicToSeed } from "../bip39/mnemonicToSeed.js";
import { loadEnglishWordlistSync } from "../bip39/wordlist.js";
import { normalizeMnemonicInput } from "../integration/normalizeMnemonicInput.js";

export const generateMnemonicCommand = (words: number): string => {
	const entropyBits = entropyBitsForWordCount(words as WordCount);
	const bytes = entropyBits / 8;
	if (!Number.isInteger(bytes)) {
		throw new Error("Invalid word count for entropy bytes");
	}
	return entropyToMnemonic(generateEntropy(bytes));
};

export type MnemonicWithWordlist = {
	mnemonic: string;
	wordlist: string[];
};

export const generateMnemonicWithWordlistCommand = (
	words: number,
): MnemonicWithWordlist => {
	const mnemonic = generateMnemonicCommand(words);
	const { words: wordlist } = loadEnglishWordlistSync();
	return { mnemonic, wordlist };
};

export const mnemonicToEntropyCommand = (
	input: string,
	strict: boolean,
): Uint8Array => {
	const normalized = strict ? input : normalizeMnemonicInput(input);
	return mnemonicToEntropy(normalized);
};

export const mnemonicToSeedCommand = (
	input: string,
	strict: boolean,
	passphrase: string,
): Uint8Array => {
	const normalized = strict ? input : normalizeMnemonicInput(input);
	return mnemonicToSeed(normalized, passphrase);
};

export type ValidateCommandResult =
	| {
			ok: true;
			normalized: string;
	  }
	| {
			ok: false;
			errorCode: ErrorCode;
	  };

export const validateCommand = (
	input: string,
	strict: boolean,
): ValidateCommandResult => {
	const normalized = strict ? input : normalizeMnemonicInput(input);
	const result = validateMnemonic(normalized);
	if (!result.ok) {
		return {
			ok: false,
			errorCode: result.error_code ?? ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
		};
	}
	return {
		ok: true,
		normalized: result.normalized_mnemonic ?? normalized,
	};
};
