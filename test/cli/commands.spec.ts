import assert from "node:assert/strict";
import test from "node:test";

import { entropyToMnemonicCommand } from "../../src/cli/commands/entropyToMnemonic.ts";
import { generateEntropyCommand } from "../../src/cli/commands/generateEntropy.ts";
import { generateMnemonicCommand } from "../../src/cli/commands/generateMnemonic.ts";
import { generateMnemonicWithWordlistCommand } from "../../src/cli/commands/generateMnemonicWithWordlist.ts";
import { mnemonicToEntropyCommand } from "../../src/cli/commands/mnemonicToEntropy.ts";
import { mnemonicToSeedCommand } from "../../src/cli/commands/mnemonicToSeed.ts";
import { validateCommand } from "../../src/cli/commands/validate.ts";

const ENTROPY_HEX = "00000000000000000000000000000000";
const MNEMONIC =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const SEED_HEX =
	"c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e5349553" +
	"1f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04";

const hexToBytes = (hex: string): Uint8Array =>
	Uint8Array.from(hex.match(/.{2}/gu) ?? [], (pair) =>
		Number.parseInt(pair, 16),
	);

const bytesToHex = (bytes: Uint8Array): string =>
	Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

test("entropyToMnemonicCommand matches vector", () => {
	const mnemonic = entropyToMnemonicCommand(hexToBytes(ENTROPY_HEX));
	assert.equal(mnemonic, MNEMONIC);
});

test("mnemonicToEntropyCommand matches vector", () => {
	const entropy = mnemonicToEntropyCommand(MNEMONIC, false);
	assert.equal(bytesToHex(entropy), ENTROPY_HEX);
});

test("mnemonicToSeedCommand matches vector", () => {
	const seed = mnemonicToSeedCommand(MNEMONIC, false, "TREZOR");
	assert.equal(bytesToHex(seed), SEED_HEX);
});

test("validateCommand returns normalized mnemonic", () => {
	const result = validateCommand(MNEMONIC, true);
	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.normalized, MNEMONIC);
});

test("generateEntropyCommand returns requested length", () => {
	const entropy = generateEntropyCommand(16);
	assert.equal(entropy.length, 16);
});

test("generateMnemonicCommand returns requested word count", () => {
	const mnemonic = generateMnemonicCommand(12);
	assert.equal(mnemonic.split(" ").length, 12);
});

test("generateMnemonicWithWordlistCommand returns mnemonic and wordlist", () => {
	const result = generateMnemonicWithWordlistCommand(12);
	assert.equal(result.mnemonic.split(" ").length, 12);
	assert.equal(result.wordlist.length, 2048);
	assert.equal(result.wordlist[0], "abandon");
	assert.equal(result.wordlist[result.wordlist.length - 1], "zoo");
});
