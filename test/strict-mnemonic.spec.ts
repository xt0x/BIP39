import assert from "node:assert/strict";
import test from "node:test";

import { ErrorCode } from "../src/errors/errorCodes.ts";
import {
	parseMnemonicWordsStrict,
	type StrictMnemonicParseResult,
} from "../src/parser/strictMnemonic.ts";

const validMnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

const expectInvalid = (input: unknown): void => {
	const result = parseMnemonicWordsStrict(
		input as Parameters<typeof parseMnemonicWordsStrict>[0],
	);
	assert.deepEqual(result, {
		ok: false,
		error_code: ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
	} satisfies StrictMnemonicParseResult);
};

test("parseMnemonicWordsStrict accepts normalized string", () => {
	const result = parseMnemonicWordsStrict(validMnemonic);
	assert.equal(result.ok, true);
	if (result.ok) {
		assert.equal(result.normalized_mnemonic, validMnemonic);
		assert.equal(result.words.length, 12);
		assert.equal(result.words[0], "abandon");
		assert.equal(result.words[11], "about");
	}
});

test("parseMnemonicWordsStrict rejects string with extra spaces", () => {
	expectInvalid(` ${validMnemonic}`);
	expectInvalid(`${validMnemonic} `);
	expectInvalid(validMnemonic.replace("abandon abandon", "abandon  abandon"));
});

test("parseMnemonicWordsStrict rejects string with tabs or uppercase", () => {
	expectInvalid(validMnemonic.replace("abandon", "abandon\tabandon"));
	expectInvalid(validMnemonic.toUpperCase());
});

test("parseMnemonicWordsStrict accepts word list", () => {
	const words = validMnemonic.split(" ");
	const result = parseMnemonicWordsStrict(words);
	assert.equal(result.ok, true);
	if (result.ok) {
		assert.deepEqual(result.words, words);
		assert.equal(result.normalized_mnemonic, validMnemonic);
	}
});

test("parseMnemonicWordsStrict rejects invalid word list", () => {
	expectInvalid(["abandon", "", "about"]);
	expectInvalid(["abandon", "about about"]);
	expectInvalid(["abandon", "About"]);
	expectInvalid(["abandon", 123 as unknown as string]);
});

test("parseMnemonicWordsStrict rejects non-string input", () => {
	expectInvalid(123);
	expectInvalid({});
	expectInvalid(null);
});
