import { randomBytes } from "node:crypto";

import { ENTROPY_BYTES } from "../constants/bip39.js";

export class InvalidEntropyLengthError extends Error {
	constructor(message = "Invalid entropy length") {
		super(message);
		this.name = "InvalidEntropyLengthError";
	}
}

export type EntropyGenerator = {
	generate: (bytes: number) => Uint8Array;
};

const isValidEntropyLength = (bytes: number): boolean =>
	(ENTROPY_BYTES as readonly number[]).includes(bytes);

export const createEntropyGenerator = (
	provider: (bytes: number) => Uint8Array,
): EntropyGenerator => ({
	generate: (bytes: number) => {
		if (!isValidEntropyLength(bytes)) {
			throw new InvalidEntropyLengthError(
				`Entropy must be ${ENTROPY_BYTES.join("/")} bytes`,
			);
		}
		const output = provider(bytes);
		if (!(output instanceof Uint8Array) || output.length !== bytes) {
			throw new Error("Entropy provider returned invalid output");
		}
		return output;
	},
});

export const generateEntropy = (bytes: number): Uint8Array =>
	createEntropyGenerator(
		(length) => new Uint8Array(randomBytes(length)),
	).generate(bytes);
