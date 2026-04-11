import { mnemonicToSeed } from "../../bip39/mnemonicToSeed.js";
import { normalizeMnemonicInput } from "../../normalize/normalizeMnemonicInput.js";

export const mnemonicToSeedCommand = (
	input: string,
	strict: boolean,
	passphrase: string,
): Uint8Array => {
	const normalized = strict ? input : normalizeMnemonicInput(input);
	return mnemonicToSeed(normalized, passphrase);
};
