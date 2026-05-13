import assert from "node:assert/strict";
import { test } from "vitest";

import { mnemonicToSeed } from "../src/bip39/mnemonicToSeed.ts";
import { ErrorCode } from "../src/errors/errorCodes.ts";
import {
	deriveBip32RootFromMnemonic,
	deriveSeedForUi,
	errorCodeToMessage,
	validateMnemonicForUi,
} from "../src/integration/externalIntegration.ts";

const messyMnemonic =
	"  ABANDON  abandon\tabandon\nABANDON abandon abandon abandon abandon abandon abandon abandon about  ";
const normalizedMnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

test("validateMnemonicForUi normalizes before validation", () => {
	const result = validateMnemonicForUi(messyMnemonic);
	assert.equal(result.ok, true);
	assert.equal(result.normalized_mnemonic, normalizedMnemonic);
});

test("deriveSeedForUi returns seed for valid input", () => {
	const expected = mnemonicToSeed(normalizedMnemonic, "TREZOR");
	const result = deriveSeedForUi(messyMnemonic, "TREZOR");
	assert.equal(result.ok, true);
	if (result.ok) {
		assert.deepEqual(Array.from(result.seed), Array.from(expected));
		assert.equal(result.normalized_mnemonic, normalizedMnemonic);
	}
});

test("deriveSeedForUi returns error for invalid input", () => {
	const result = deriveSeedForUi("abandon abandon", "");
	assert.equal(result.ok, false);
	if (!result.ok) {
		assert.equal(result.error_code, ErrorCode.ERR_INVALID_WORD_COUNT);
	}
});

test("deriveBip32RootFromMnemonic uses adapter", () => {
	const result = deriveBip32RootFromMnemonic(messyMnemonic, "", {
		fromSeed: (seed) => ({ length: seed.length, first: seed[0] }),
	});
	assert.equal(result.ok, true);
	if (result.ok) {
		assert.equal(result.root.length, 64);
	}
});

test("errorCodeToMessage covers all error codes", () => {
	for (const code of Object.values(ErrorCode)) {
		const message = errorCodeToMessage(code);
		assert.equal(typeof message, "string");
		assert.notEqual(message.length, 0);
	}
});
