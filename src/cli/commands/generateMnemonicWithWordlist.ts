import { loadEnglishWordlist } from "../../bip39/englishWordlist.js";
import { generateMnemonicCommand } from "./generateMnemonic.js";

export type MnemonicWithWordlist = {
	mnemonic: string;
	wordlist: string[];
};

export const generateMnemonicWithWordlistCommand = (
	words: number,
): MnemonicWithWordlist => {
	const mnemonic = generateMnemonicCommand(words);
	const { words: wordlist } = loadEnglishWordlist();
	return { mnemonic, wordlist };
};
