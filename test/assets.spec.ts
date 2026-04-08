import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

type SpecAsset = {
	name: string;
	path: string;
	sha256: string;
};

const assets: SpecAsset[] = [
	{
		name: "bip-0039.mediawiki",
		path: "assets/bip-0039.mediawiki",
		sha256: "964f3adf5f7dc18d2515606ef73a2ca599c04519f90ac2fa5b5ddcec25295f76",
	},
	{
		name: "english.txt",
		path: "assets/english.txt",
		sha256: "2f5eed53a4727b4bf8880d8f3f199efc90e58503646d9ff8eff3a2ed3b24dbda",
	},
	{
		name: "vectors.json",
		path: "assets/vectors.json",
		sha256: "fa3b937b7cff9c9b8ecd3aa011faeb8d6dd67993174b72326e83f4de8fdb30f8",
	},
];

const sha256 = (data: Uint8Array): string =>
	createHash("sha256").update(data).digest("hex");

for (const asset of assets) {
	test(`spec asset SHA-256 matches: ${asset.name}`, async () => {
		const absolutePath = resolve(process.cwd(), asset.path);
		const data = await readFile(absolutePath);
		assert.equal(sha256(data), asset.sha256);
	});
}
