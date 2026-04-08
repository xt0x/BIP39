import assert from "node:assert/strict";
import test from "node:test";

import {
	createEntropyGenerator,
	type EntropyGenerator,
	generateEntropy,
	InvalidEntropyLengthError,
} from "../src/entropy/entropyGenerator.ts";

const allowed = [16, 20, 24, 28, 32];

test("generateEntropy returns allowed lengths", () => {
	for (const length of allowed) {
		const entropy = generateEntropy(length);
		assert.equal(entropy.length, length);
	}
});

test("generateEntropy rejects invalid lengths", () => {
	assert.throws(() => generateEntropy(15), InvalidEntropyLengthError);
	assert.throws(() => generateEntropy(33), InvalidEntropyLengthError);
});

test("EntropyGenerator allows deterministic output in tests", () => {
	const fixed = Uint8Array.from({ length: 16 }, (_, i) => i);
	const generator = createEntropyGenerator(() => fixed);
	const entropy = generator.generate(16);
	assert.equal(entropy.length, 16);
	assert.deepEqual(Array.from(entropy), Array.from(fixed));
});

// Validate the interface shape used by callers
const _typecheck: EntropyGenerator = {
	generate: (bytes) => new Uint8Array(bytes),
};
void _typecheck;
