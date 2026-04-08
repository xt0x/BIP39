import { entropyToMnemonic } from "../../bip39/entropyToMnemonic.js";

export const entropyToMnemonicCommand = (entropy: Uint8Array): string =>
	entropyToMnemonic(entropy);
