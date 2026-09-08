import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { pbkdf2Sync } from "node:crypto";
import { test } from "vitest";

const MNEMONIC =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

test("cli validate runs from the TypeScript entrypoint", () => {
	const result = spawnSync(
		process.execPath,
		["--import", "tsx", "src/cli/index.ts", "validate", MNEMONIC],
		{ encoding: "utf8" },
	);

	assert.equal(result.status, 0);
	assert.equal(result.error, undefined);
	assert.equal(result.stdout, `valid\nnormalized: ${MNEMONIC}\n`);
	assert.equal(result.stderr, "");
});

test.each([
	{
		command: "validate",
		output: `valid\nnormalized: ${MNEMONIC}\n`,
	},
	{
		command: "mnemonic-to-entropy",
		output: "00000000000000000000000000000000\n",
	},
])("cli $command normalizes piped stdin by default", ({ command, output }) => {
	const result = spawnSync(
		process.execPath,
		["--import", "tsx", "src/cli/index.ts", command],
		{ encoding: "utf8", input: `\t${MNEMONIC.toUpperCase()}\r\n` },
	);

	assert.equal(result.error, undefined);
	assert.equal(result.status, 0);
	assert.equal(result.stdout, output);
	assert.equal(result.stderr, "");
});

test.each([
	"validate",
	"mnemonic-to-entropy",
])("cli %s rejects the piped newline in strict mode", (command) => {
	const result = spawnSync(
		process.execPath,
		["--import", "tsx", "src/cli/index.ts", command, "--strict"],
		{ encoding: "utf8", input: `${MNEMONIC}\n` },
	);

	assert.equal(result.error, undefined);
	assert.equal(result.status, 1);
	assert.equal(result.stdout, "");
	assert.equal(
		result.stderr,
		"error_code: ERR_INVALID_MNEMONIC_FORMAT\nmessage: Mnemonic format is invalid.\n",
	);
});

test.each([
	false,
	true,
])("cli mnemonic-to-seed derives from piped stdin with strict=%s", (strict) => {
	const input = `\t${MNEMONIC.toUpperCase()}\n`;
	const args = ["--import", "tsx", "src/cli/index.ts", "mnemonic-to-seed"];
	if (strict) args.push("--strict");
	const result = spawnSync(process.execPath, args, {
		encoding: "utf8",
		input,
	});
	const expectedSeed = pbkdf2Sync(
		strict ? input : MNEMONIC,
		"mnemonic",
		2048,
		64,
		"sha512",
	).toString("hex");

	assert.equal(result.error, undefined);
	assert.equal(result.status, 0);
	assert.equal(result.stdout, `${expectedSeed}\n`);
	assert.equal(result.stderr, "");
});

test("cli entropy-to-mnemonic accepts a newline-terminated hex stream", () => {
	const result = spawnSync(
		process.execPath,
		["--import", "tsx", "src/cli/index.ts", "entropy-to-mnemonic"],
		{ encoding: "utf8", input: "00000000000000000000000000000000\n" },
	);

	assert.equal(result.error, undefined);
	assert.equal(result.status, 0);
	assert.equal(result.stdout, `${MNEMONIC}\n`);
	assert.equal(result.stderr, "");
});
