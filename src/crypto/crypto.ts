import { createHash, pbkdf2Sync } from "node:crypto";

import { PBKDF2_ITERATIONS, SEED_BYTES } from "../constants/bip39.js";
import { ErrorCode } from "../errors/errorCodes.js";

export class Pbkdf2FailureError extends Error {
	code = ErrorCode.ERR_PBKDF2_FAILURE;

	constructor(message = "PBKDF2 failure") {
		super(message);
		this.name = "Pbkdf2FailureError";
	}
}

export const sha256 = (data: Uint8Array): Uint8Array =>
	new Uint8Array(createHash("sha256").update(data).digest());

export const pbkdf2HmacSha512 = (
	password: Uint8Array,
	salt: Uint8Array,
	iterations = PBKDF2_ITERATIONS,
	keyLen = SEED_BYTES,
): Uint8Array => {
	try {
		return new Uint8Array(
			pbkdf2Sync(password, salt, iterations, keyLen, "sha512"),
		);
	} catch (error) {
		throw new Pbkdf2FailureError(
			error instanceof Error ? error.message : "PBKDF2 failure",
		);
	}
};
