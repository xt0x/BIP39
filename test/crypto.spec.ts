import assert from "node:assert/strict";
import { test } from "vitest";

import {
	Pbkdf2FailureError,
	pbkdf2HmacSha512,
	sha256,
} from "../src/crypto/crypto.ts";
import { ErrorCode } from "../src/errors/errorCodes.ts";

const bytesToHex = (bytes: Uint8Array): string =>
	Array.from(bytes)
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");

test("sha256 matches known vector", () => {
	const hash = sha256(new TextEncoder().encode("abc"));
	assert.equal(
		bytesToHex(hash),
		"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
	);
});

test("pbkdf2HmacSha512 matches known vector", () => {
	const derived = pbkdf2HmacSha512(
		new TextEncoder().encode("password"),
		new TextEncoder().encode("salt"),
	);
	assert.equal(
		bytesToHex(derived),
		"91be23564f09fc855c82ce84a223ebe7d63d8b49d69372593a0d9ed39e143c83e1ab2f722a5ddb969feefc88403f7e2afe1afb8b2f0e6b20add0fb7b28368807",
	);
});

test("pbkdf2 failure surfaces error code", () => {
	const error = new Pbkdf2FailureError();
	assert.equal(error.code, ErrorCode.ERR_PBKDF2_FAILURE);
	assert.equal(error.name, "Pbkdf2FailureError");
});
