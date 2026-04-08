import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
	EntropyLengthError,
	entropyToMnemonic,
} from "../src/bip39/entropyToMnemonic.ts";
import { ErrorCode } from "../src/errors/errorCodes.ts";

type Vector = [string, string, string, string];

test("entropyToMnemonic rejects invalid entropy length", () => {
	assert.throws(
		() => entropyToMnemonic(new Uint8Array(15)),
		(error) =>
			error instanceof EntropyLengthError &&
			error.code === ErrorCode.ERR_ENTROPY_LENGTH,
	);
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
