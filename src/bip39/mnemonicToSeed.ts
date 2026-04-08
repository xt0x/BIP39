import { pbkdf2HmacSha512 } from "../crypto/crypto.js";
import { ErrorCode } from "../errors/errorCodes.js";

export class InvalidMnemonicSeedFormatError extends Error {
	code = ErrorCode.ERR_INVALID_MNEMONIC_FORMAT;

	constructor(message = "Invalid mnemonic format") {
		super(message);
		this.name = "InvalidMnemonicSeedFormatError";
	}
}

const hasWhitespace = (value: string): boolean => /\s/u.test(value);

const normalizeNfkd = (value: string): string => value.normalize("NFKD");

const normalizeMnemonicInput = (input: string | string[]): string => {
	if (typeof input === "string") {
		return input;
	}
	if (!Array.isArray(input) || input.length === 0) {
		throw new InvalidMnemonicSeedFormatError();
	}
	for (const item of input) {
		if (typeof item !== "string") {
			throw new InvalidMnemonicSeedFormatError();
		}
		if (item.length === 0 || hasWhitespace(item)) {
			throw new InvalidMnemonicSeedFormatError();
		}
	}
	return input.join(" ");
};

export const mnemonicToSeed = (
	mnemonic: string | string[],
	passphrase = "",
): Uint8Array => {
	if (typeof passphrase !== "string") {
		throw new InvalidMnemonicSeedFormatError();
	}
	const mnemonicText = normalizeMnemonicInput(mnemonic);
	const normalizedMnemonic = normalizeNfkd(mnemonicText);
	const normalizedPassphrase = normalizeNfkd(passphrase);
	const encoder = new TextEncoder();
	const password = encoder.encode(normalizedMnemonic);
	const salt = encoder.encode(`mnemonic${normalizedPassphrase}`);
	return pbkdf2HmacSha512(password, salt);
};
