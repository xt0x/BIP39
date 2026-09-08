import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { expectTypeOf, test } from "vitest";

import {
	ErrorCode,
	entropyToMnemonic,
	loadEnglishWordlist,
	mnemonicToEntropy,
	mnemonicToSeed,
	type ValidationResult,
	validateMnemonic,
	type Wordlist,
} from "../src/index.ts";

test("ValidationResult shape is stable", () => {
	const result: ValidationResult = validateMnemonic("abandon about");
	assert.deepEqual(result, {
		ok: false,
		error_code: ErrorCode.ERR_INVALID_WORD_COUNT,
		normalized_mnemonic: "abandon about",
		word_count: 2,
		invalid_word: null,
	});
});

// Vitest transpiles type assertions; the compiler test below checks them too.
test("public validation and conversion types remain compatible", () => {
	expectTypeOf<ValidationResult>().toEqualTypeOf<{
		ok: boolean;
		error_code: ErrorCode | null;
		normalized_mnemonic: string | null;
		word_count: number | null;
		invalid_word: string | null;
	}>();
	expectTypeOf(validateMnemonic).toEqualTypeOf<
		(input: string | string[]) => ValidationResult
	>();
	expectTypeOf(entropyToMnemonic).toEqualTypeOf<
		(entropy: Uint8Array) => string
	>();
	expectTypeOf(mnemonicToEntropy).toEqualTypeOf<
		(input: string | string[]) => Uint8Array
	>();
	expectTypeOf(mnemonicToSeed).toEqualTypeOf<
		(input: string | string[], passphrase?: string) => Uint8Array
	>();
	expectTypeOf(loadEnglishWordlist).toEqualTypeOf<() => Promise<Wordlist>>();
	expectTypeOf<Wordlist>().toEqualTypeOf<{
		words: string[];
		wordToIndex: Map<string, number>;
	}>();
});

test("TypeScript checks the test suite and public API type contracts", () => {
	const result = spawnSync(
		process.execPath,
		[
			createRequire(import.meta.url).resolve("typescript/bin/tsc"),
			"-p",
			fileURLToPath(new URL("./tsconfig.json", import.meta.url)),
		],
		{ encoding: "utf8", timeout: 20_000 },
	);
	assert.equal(result.error, undefined);
	assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
}, 30_000);
