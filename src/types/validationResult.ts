import type { ErrorCode } from "../errors/errorCodes.js";

export type ValidationResult = {
	ok: boolean;
	error_code: ErrorCode | null;
	normalized_mnemonic: string | null;
	word_count: number | null;
	invalid_word: string | null;
};
