import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "vitest";

import { validateMnemonic } from "../src/bip39/validateMnemonic.ts";
import { ErrorCode } from "../src/errors/errorCodes.ts";

const validMnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

type Vector = [string, string, string, string];

test("validateMnemonic rejects invalid format", () => {
	const result = validateMnemonic(` ${validMnemonic}`);
	assert.deepEqual(result, {
		ok: false,
		error_code: ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
		normalized_mnemonic: null,
		word_count: null,
		invalid_word: null,
	});
});

test("validateMnemonic rejects invalid word count", () => {
	const result = validateMnemonic(validMnemonic.replace(" about", ""));
	assert.equal(result.ok, false);
	assert.equal(result.error_code, ErrorCode.ERR_INVALID_WORD_COUNT);
	assert.equal(result.word_count, 11);
});

test("validateMnemonic rejects word not in list", () => {
	const result = validateMnemonic(validMnemonic.replace("about", "typo"));
	assert.equal(result.ok, false);
	assert.equal(result.error_code, ErrorCode.ERR_WORD_NOT_IN_LIST);
	assert.equal(result.invalid_word, "typo");
});

test("validateMnemonic rejects checksum mismatch", () => {
	const invalid =
		"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon";
	const result = validateMnemonic(invalid);
	assert.equal(result.ok, false);
	assert.equal(result.error_code, ErrorCode.ERR_CHECKSUM_MISMATCH);
});

test("validateMnemonic accepts valid mnemonic", () => {
	const result = validateMnemonic(validMnemonic);
	assert.equal(result.ok, true);
	assert.equal(result.error_code, null);
	assert.equal(result.normalized_mnemonic, validMnemonic);
	assert.equal(result.word_count, 12);
});

test("validateMnemonic matches official vectors", async () => {
	const filePath = resolve(process.cwd(), "assets/vectors.json");
	const payload = JSON.parse(await readFile(filePath, "utf8")) as {
		english: Vector[];
	};

	for (const [, mnemonic] of payload.english) {
		const result = validateMnemonic(mnemonic);
		assert.equal(result.ok, true);
	}
});
