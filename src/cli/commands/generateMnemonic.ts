import { entropyToMnemonic } from "../../bip39/entropyToMnemonic.js";
import type { WordCount } from "../../constants/bip39.js";
import { entropyBitsForWordCount } from "../../constants/bip39.js";
import { generateEntropy } from "../../entropy/entropyGenerator.js";

export const generateMnemonicCommand = (words: number): string => {
	const entropyBits = entropyBitsForWordCount(words as WordCount);
	const bytes = entropyBits / 8;
	if (!Number.isInteger(bytes)) {
		throw new Error("Invalid word count for entropy bytes");
	}
	return entropyToMnemonic(generateEntropy(bytes));
};
