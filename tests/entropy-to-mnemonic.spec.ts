import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "vitest";

import {
	EntropyLengthError,
	entropyToMnemonic,
} from "../src/bip39/entropyToMnemonic.ts";
import { ErrorCode } from "../src/bip39/errorCodes.ts";

type Vector = [string, string, string, string];

test.each([
	15, 17,
])("entropyToMnemonic rejects %i bytes with its length error", (bytes) => {
	assert.throws(() => entropyToMnemonic(new Uint8Array(bytes)), {
		constructor: EntropyLengthError,
		name: "EntropyLengthError",
		code: ErrorCode.ERR_ENTROPY_LENGTH,
		message: "Entropy must be 16/20/24/28/32 bytes",
	});
});

test("entropyToMnemonic matches official vectors", async () => {
	const filePath = resolve(process.cwd(), "assets/vectors.json");
	const payload = JSON.parse(await readFile(filePath, "utf8")) as {
		english: Vector[];
	};

	for (const [entropyHex, mnemonic] of payload.english) {
		const bytes = Uint8Array.from(entropyHex.match(/.{2}/g) ?? [], (byte) =>
			Number.parseInt(byte, 16),
		);
		assert.equal(entropyToMnemonic(bytes), mnemonic);
	}
});
