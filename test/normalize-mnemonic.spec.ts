import assert from "node:assert/strict";
import test from "node:test";

import { normalizeMnemonicInput } from "../src/normalize/normalizeMnemonicInput.ts";

test("normalizeMnemonicInput trims and collapses whitespace", () => {
	const input = "  Abandon\tabandon\nABOUT  ";
	assert.equal(normalizeMnemonicInput(input), "abandon abandon about");
});

test("normalizeMnemonicInput replaces CR and multiple spaces", () => {
	const input = "abandon\rabandon   about";
	assert.equal(normalizeMnemonicInput(input), "abandon abandon about");
});

test("normalizeMnemonicInput applies NFKD and lowercases", () => {
	const input = "\u00c1"; // Á
	assert.equal(normalizeMnemonicInput(input), "a\u0301");
});

test("normalizeMnemonicInput rejects non-string input", () => {
	assert.throws(() => normalizeMnemonicInput(123 as unknown as string));
});
