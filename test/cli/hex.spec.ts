import assert from "node:assert/strict";
import test from "node:test";

import { bytesToHex, hexToBytes } from "../../src/cli/hex.ts";

test("hexToBytes decodes valid hex", () => {
	const bytes = hexToBytes("0001ff");
	assert.deepEqual(Array.from(bytes), [0, 1, 255]);
});

test("hexToBytes rejects odd-length hex", () => {
	assert.throws(() => hexToBytes("0"));
});

test("hexToBytes rejects non-hex characters", () => {
	assert.throws(() => hexToBytes("zz"));
});

test("hexToBytes rejects empty input", () => {
	assert.throws(() => hexToBytes(""));
});

test("bytesToHex encodes bytes as lowercase hex", () => {
	const hex = bytesToHex(Uint8Array.from([0, 15, 16, 255]));
	assert.equal(hex, "000f10ff");
});
