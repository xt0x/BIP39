import assert from "node:assert/strict";
import { test } from "vitest";

import {
	ErrorCode,
	MNEMONIC_TO_SEED_ERROR_PRIORITY,
	MNEMONIC_VALIDATION_ERROR_PRIORITY,
} from "../src/errors/errorCodes.ts";

test("Error codes are fixed", () => {
	const codes = Object.values(ErrorCode);
	assert.deepEqual(codes, [
		"ERR_ENTROPY_LENGTH",
		"ERR_INVALID_MNEMONIC_FORMAT",
		"ERR_INVALID_WORD_COUNT",
		"ERR_WORD_NOT_IN_LIST",
		"ERR_CHECKSUM_MISMATCH",
		"ERR_PBKDF2_FAILURE",
	]);
});

test("Error priority order is fixed", () => {
	assert.deepEqual(MNEMONIC_VALIDATION_ERROR_PRIORITY, [
		"ERR_INVALID_MNEMONIC_FORMAT",
		"ERR_INVALID_WORD_COUNT",
		"ERR_WORD_NOT_IN_LIST",
		"ERR_CHECKSUM_MISMATCH",
	]);

	assert.deepEqual(MNEMONIC_TO_SEED_ERROR_PRIORITY, [
		"ERR_INVALID_MNEMONIC_FORMAT",
		"ERR_PBKDF2_FAILURE",
	]);
});
