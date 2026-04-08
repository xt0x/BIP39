import { bitsToIntegers, bytesToBits } from "../bits/bitOps.js";
import {
	checksumBitsForEntropyBits,
	ENTROPY_BYTES,
} from "../constants/bip39.js";
import { sha256 } from "../crypto/crypto.js";
import { ErrorCode } from "../errors/errorCodes.js";
import { loadEnglishWordlist } from "./englishWordlist.js";

export class EntropyLengthError extends Error {
	code = ErrorCode.ERR_ENTROPY_LENGTH;

	constructor(message = "Invalid entropy length") {
		super(message);
		this.name = "EntropyLengthError";
	}
}

const isValidEntropyLength = (entropyBytes: number): boolean =>
	(ENTROPY_BYTES as readonly number[]).includes(entropyBytes);

export const entropyToMnemonic = (entropy: Uint8Array): string => {
	if (!isValidEntropyLength(entropy.length)) {
		throw new EntropyLengthError(
			`Entropy must be ${ENTROPY_BYTES.join("/")} bytes`,
		);
	}

	const entropyBits = entropy.length * 8;
	const checksumBits = checksumBitsForEntropyBits(entropyBits);
	const entropyBitArray = bytesToBits(entropy);
	const checksum = bytesToBits(sha256(entropy)).slice(0, checksumBits);
	const combined = entropyBitArray.concat(checksum);
	const indices = bitsToIntegers(combined, 11);
	const { words } = loadEnglishWordlist();
	const mnemonicWords = indices.map((index) => {
		const word = words[index];
		if (word === undefined) {
			throw new Error(`Word index out of range: ${index}`);
		}
		return word;
	});
	return mnemonicWords.join(" ");
};
