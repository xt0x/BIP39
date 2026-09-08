import assert from "node:assert/strict";
import { test } from "vitest";

import {
	createWordlist,
	indexToWord,
	loadEnglishWordlist,
	parseWordlist,
	wordToIndex,
} from "../src/wordlist/wordlist.ts";

const makeWords = (count: number): string[] =>
	Array.from({ length: count }, (_, i) => `word${i}`);

const makeText = (words: string[]): string => words.join("\n");

test("createWordlist accepts 2048 unique words", () => {
	const words = makeWords(2048);
	const list = createWordlist(words);
	assert.equal(list.words.length, 2048);
	assert.equal(list.wordToIndex.size, 2048);
	assert.equal(list.words[0], "word0");
	assert.equal(list.words[2047], "word2047");
});

test.each([
	0, 2047, 2049,
])("createWordlist rejects %i words before checking their contents", (count) => {
	const words = Array.from({ length: count }, () => "");
	assert.throws(() => createWordlist(words), {
		name: "Error",
		message: `Wordlist must contain 2048 words, got ${count}`,
	});
});

test("createWordlist rejects duplicate words", () => {
	const words = makeWords(2048);
	words[2047] = "word0";
	assert.throws(() => createWordlist(words), {
		name: "Error",
		message: "Duplicate word detected: word0",
	});
});

test("createWordlist rejects an empty word", () => {
	const words = makeWords(2048);
	words[100] = "";
	assert.throws(() => createWordlist(words), {
		name: "Error",
		message: "Wordlist contains an empty word",
	});
});

test("createWordlist copies its input array", () => {
	const words = makeWords(2048);
	const list = createWordlist(words);
	words[0] = "changed";
	words.pop();
	assert.equal(list.words.length, 2048);
	assert.equal(indexToWord(list, 0), "word0");
	assert.equal(wordToIndex(list, "word0"), 0);
});

test.each([
	{ name: "LF", separator: "\n", trailingNewline: false },
	{ name: "LF with final newline", separator: "\n", trailingNewline: true },
	{ name: "CRLF", separator: "\r\n", trailingNewline: false },
	{ name: "CRLF with final newline", separator: "\r\n", trailingNewline: true },
])("parseWordlist accepts $name and preserves every index", ({
	separator,
	trailingNewline,
}) => {
	const words = makeWords(2048);
	const text = words.join(separator) + (trailingNewline ? separator : "");
	const list = parseWordlist(text);
	assert.deepEqual(list.words, words);
	assert.deepEqual(
		[...list.wordToIndex],
		words.map((word, i) => [word, i]),
	);
});

test.each([
	["leading", `\n${makeText(makeWords(2048))}`],
	["internal", makeText(makeWords(2048)).replace("word100\n", "\n")],
	["extra trailing", `${makeText(makeWords(2048))}\n\n`],
])("parseWordlist rejects %s empty lines before size errors", (_, text) => {
	assert.throws(() => parseWordlist(text), {
		name: "Error",
		message: "Wordlist contains empty lines",
	});
});

test("parseWordlist checks empty lines before duplicate words", () => {
	const words = makeWords(2048);
	words[1] = "word0";
	words[100] = "";
	assert.throws(() => parseWordlist(makeText(words)), {
		name: "Error",
		message: "Wordlist contains empty lines",
	});
});

test("indexToWord and wordToIndex are inverse", () => {
	const words = makeWords(2048);
	const list = createWordlist(words);
	assert.equal(indexToWord(list, 0), "word0");
	assert.equal(indexToWord(list, 2047), "word2047");
	assert.equal(wordToIndex(list, "word123"), 123);
});

test("indexToWord throws on out-of-range", () => {
	const list = createWordlist(makeWords(2048));
	for (const index of [-1, 2048]) {
		assert.throws(() => indexToWord(list, index), {
			name: "Error",
			message: `Index out of range: ${index}`,
		});
	}
});

test.each([
	0.5,
	Number.NaN,
	Number.POSITIVE_INFINITY,
])("indexToWord rejects non-integer index %s", (index) => {
	const list = createWordlist(makeWords(2048));
	assert.throws(() => indexToWord(list, index), {
		name: "Error",
		message: `Index must be an integer: ${index}`,
	});
});

test("indexToWord and wordToIndex observe changes to the returned dictionary", () => {
	const list = createWordlist(makeWords(2048));
	list.words[0] = "changed";
	list.wordToIndex.set("changed", 0);
	assert.equal(indexToWord(list, 0), "changed");
	assert.equal(wordToIndex(list, "changed"), 0);
});

test("wordToIndex throws on unknown word", () => {
	const list = createWordlist(makeWords(2048));
	assert.throws(() => wordToIndex(list, "unknown"), {
		name: "Error",
		message: "Word not in list: unknown",
	});
});

test("loadEnglishWordlist loads 2048 words with stable mapping", async () => {
	const list = await loadEnglishWordlist();
	assert.equal(list.words.length, 2048);
	assert.equal(list.wordToIndex.size, 2048);
	assert.equal(wordToIndex(list, list.words[0]), 0);
	assert.equal(wordToIndex(list, list.words[2047]), 2047);
});

test("the public entry point preserves wordlist exports and keeps the synchronous loader internal", async () => {
	const api = await import("../src/index.ts");
	assert.strictEqual(api.createWordlist, createWordlist);
	assert.strictEqual(api.parseWordlist, parseWordlist);
	assert.strictEqual(api.loadEnglishWordlist, loadEnglishWordlist);
	assert.strictEqual(api.indexToWord, indexToWord);
	assert.strictEqual(api.wordToIndex, wordToIndex);
	assert.equal("loadEnglishWordlistSync" in api, false);
});
