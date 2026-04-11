import { ErrorCode } from "../errors/errorCodes.js";

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
	[ErrorCode.ERR_ENTROPY_LENGTH]:
		"Entropy length must be 16/20/24/28/32 bytes.",
	[ErrorCode.ERR_INVALID_MNEMONIC_FORMAT]: "Mnemonic format is invalid.",
	[ErrorCode.ERR_INVALID_WORD_COUNT]:
		"Mnemonic word count must be 12/15/18/21/24.",
	[ErrorCode.ERR_WORD_NOT_IN_LIST]: "Mnemonic contains an unknown word.",
	[ErrorCode.ERR_CHECKSUM_MISMATCH]: "Mnemonic checksum does not match.",
	[ErrorCode.ERR_PBKDF2_FAILURE]: "Failed to derive seed (PBKDF2 error).",
};
