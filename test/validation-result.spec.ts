import assert from "node:assert/strict";
import test from "node:test";

import { ErrorCode } from "../src/errors/errorCodes.ts";
import type { ValidationResult } from "../src/types/validationResult.ts";

test("ValidationResult shape is stable", () => {
	const sample: ValidationResult = {
		ok: false,
		error_code: ErrorCode.ERR_INVALID_WORD_COUNT,
		normalized_mnemonic: null,
		word_count: 11,
		invalid_word: null,
	};

	assert.equal(sample.ok, false);
	assert.equal(sample.error_code, "ERR_INVALID_WORD_COUNT");
	assert.equal(sample.word_count, 11);
});
