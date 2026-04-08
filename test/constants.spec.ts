import assert from "node:assert/strict";
import test from "node:test";

import {
	checksumBitsForEntropyBits,
	ENTROPY_BITS,
	ENTROPY_BYTES,
	entropyBitsForWordCount,
	entropyBitsFromBytes,
	PBKDF2_ITERATIONS,
	SEED_BYTES,
	WORD_COUNTS,
	WORDLIST_SIZE,
	wordCountForEntropyBits,
} from "../src/constants/bip39.ts";

test("BIP39 constants match spec", () => {
	assert.deepEqual(ENTROPY_BYTES, [16, 20, 24, 28, 32]);
	assert.deepEqual(ENTROPY_BITS, [128, 160, 192, 224, 256]);
	assert.deepEqual(WORD_COUNTS, [12, 15, 18, 21, 24]);
	assert.equal(WORDLIST_SIZE, 2048);
	assert.equal(SEED_BYTES, 64);
	assert.equal(PBKDF2_ITERATIONS, 2048);
});

test("entropy length relations are fixed", () => {
	for (const entBits of ENTROPY_BITS) {
		const expectedChecksum = entBits / 32;
		const expectedWordCount = (entBits + expectedChecksum) / 11;

		assert.equal(checksumBitsForEntropyBits(entBits), expectedChecksum);
		assert.equal(wordCountForEntropyBits(entBits), expectedWordCount);
	}
});

test("entropy bytes map to entropy bits and word count", () => {
	const expected = new Map([
		[16, 128],
		[20, 160],
		[24, 192],
		[28, 224],
		[32, 256],
	]);

	for (const entBytes of ENTROPY_BYTES) {
		assert.equal(entropyBitsFromBytes(entBytes), expected.get(entBytes));
	}

	for (const wordCount of WORD_COUNTS) {
		const entBits = entropyBitsForWordCount(wordCount);
		assert.ok(ENTROPY_BITS.includes(entBits));
		assert.equal(wordCountForEntropyBits(entBits), wordCount);
	}
});
