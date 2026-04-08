import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const MNEMONIC =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

test("cli validate runs via node with tsx", () => {
	const result = spawnSync(
		process.execPath,
		["--import", "tsx", "src/cli/index.ts", "validate", MNEMONIC],
		{ encoding: "utf8" },
	);

	assert.equal(result.status, 0);
	assert.match(result.stdout, /^valid\nnormalized: /u);
});
