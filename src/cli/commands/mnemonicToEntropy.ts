import { mnemonicToEntropy } from "../../bip39/mnemonicToEntropy.js";
import { normalizeMnemonicInput } from "../../normalize/normalizeMnemonicInput.js";

export const mnemonicToEntropyCommand = (
	input: string,
	strict: boolean,
): Uint8Array => {
	const normalized = strict ? input : normalizeMnemonicInput(input);
	return mnemonicToEntropy(normalized);
};
