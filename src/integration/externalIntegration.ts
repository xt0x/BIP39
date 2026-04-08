import { mnemonicToSeed } from "../bip39/mnemonicToSeed.js";
import { validateMnemonic } from "../bip39/validateMnemonic.js";
import { ErrorCode } from "../errors/errorCodes.js";
import { normalizeMnemonicInput } from "../normalize/normalizeMnemonicInput.js";
import type { ValidationResult } from "../types/validationResult.js";
import { ERROR_MESSAGES } from "./errorMessages.js";

export type SeedDerivationResult =
	| {
			ok: true;
			seed: Uint8Array;
			normalized_mnemonic: string;
	  }
	| {
			ok: false;
			error_code: ErrorCode;
			normalized_mnemonic: string | null;
	  };

export type Bip32Adapter<T> = {
	fromSeed: (seed: Uint8Array) => T;
};

export type Bip32DerivationResult<T> =
	| {
			ok: true;
			seed: Uint8Array;
			root: T;
			normalized_mnemonic: string;
	  }
	| {
			ok: false;
			error_code: ErrorCode;
			normalized_mnemonic: string | null;
	  };

const isErrorWithCode = (value: unknown): value is { code: ErrorCode } =>
	!!value && typeof value === "object" && "code" in value;

export const validateMnemonicForUi = (input: string): ValidationResult => {
	const normalized = normalizeMnemonicInput(input);
	return validateMnemonic(normalized);
};

export const deriveSeedForUi = (
	input: string,
	passphrase = "",
): SeedDerivationResult => {
	const normalized = normalizeMnemonicInput(input);
	const validation = validateMnemonic(normalized);
	if (!validation.ok) {
		return {
			ok: false,
			error_code:
				validation.error_code ?? ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
			normalized_mnemonic: validation.normalized_mnemonic,
		};
	}
	try {
		const seed = mnemonicToSeed(normalized, passphrase);
		return {
			ok: true,
			seed,
			normalized_mnemonic: normalized,
		};
	} catch (error) {
		if (isErrorWithCode(error)) {
			return {
				ok: false,
				error_code: error.code,
				normalized_mnemonic: normalized,
			};
		}
		throw error;
	}
};

export const deriveBip32RootFromMnemonic = <T>(
	input: string,
	passphrase: string,
	adapter: Bip32Adapter<T>,
): Bip32DerivationResult<T> => {
	const seedResult = deriveSeedForUi(input, passphrase);
	if (!seedResult.ok) {
		return seedResult;
	}
	return {
		ok: true,
		seed: seedResult.seed,
		root: adapter.fromSeed(seedResult.seed),
		normalized_mnemonic: seedResult.normalized_mnemonic,
	};
};

export const errorCodeToMessage = (code: ErrorCode): string =>
	ERROR_MESSAGES[code];
