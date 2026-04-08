import assert from "node:assert/strict";
import test from "node:test";

import {
	bitsToBytes,
	bitsToIntegers,
	bytesToBits,
	integersToBits,
} from "../src/bits/bitOps.ts";

test("bytesToBits reads MSB to LSB", () => {
	const bits = bytesToBits(Uint8Array.from([0x80, 0x01]));
	assert.deepEqual(bits.slice(0, 8), [1, 0, 0, 0, 0, 0, 0, 0]);
	assert.deepEqual(bits.slice(8, 16), [0, 0, 0, 0, 0, 0, 0, 1]);
});

test("bitsToBytes restores original bytes", () => {
	const original = Uint8Array.from([0x00, 0xff, 0x81]);
	const bits = bytesToBits(original);
	const restored = bitsToBytes(bits);
	assert.deepEqual(Array.from(restored), Array.from(original));
});

test("bitsToBytes rejects non-multiple of 8", () => {
	assert.throws(() => bitsToBytes([1, 0, 1]));
});

test("bitsToIntegers splits into 11-bit values", () => {
	const bits = [
		1,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0, // 1024
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1, // 1
	];
	assert.deepEqual(bitsToIntegers(bits, 11), [1024, 1]);
});

test("integersToBits encodes 11-bit values", () => {
	const bits = integersToBits([0, 1, 2047], 11);
	assert.equal(bits.length, 33);
	assert.deepEqual(bits.slice(0, 11), new Array(11).fill(0));
	assert.deepEqual(bits.slice(11, 22), [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
	assert.deepEqual(bits.slice(22, 33), new Array(11).fill(1));
});

test("integersToBits rejects out-of-range values", () => {
	assert.throws(() => integersToBits([2048], 11));
});
