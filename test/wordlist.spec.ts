import assert from "node:assert/strict";
import test from "node:test";

import {
	createWordlist,
	indexToWord,
	loadEnglishWordlist,
	parseWordlist,
	wordToIndex,
} from "../src/wordlist/wordlist.ts";

const makeWords = (count: number): string[] =>
	Array.from({ length: count }, (_, i) => `word${i}`);

const makeText = (words: string[], withTrailingNewline = false): string => {
	const text = words.join("\n");
	return withTrailingNewline ? `${text}\n` : text;
};

test("createWordlist accepts 2048 unique words", () => {
	const words = makeWords(2048);
	const list = createWordlist(words);
	assert.equal(list.words.length, 2048);
	assert.equal(list.wordToIndex.size, 2048);
	assert.equal(list.words[0], "word0");
	assert.equal(list.words[2047], "word2047");
});

test("createWordlist rejects incorrect length", () => {
	const words = makeWords(2047);
	assert.throws(() => createWordlist(words));
});

test("createWordlist rejects duplicate words", () => {
	const words = makeWords(2048);
	words[2047] = "word0";
	assert.throws(() => createWordlist(words));
});

test("parseWordlist parses text and preserves order", () => {
	const words = makeWords(2048);
	const list = parseWordlist(makeText(words, true));
	assert.equal(list.words[0], "word0");
	assert.equal(list.words[2047], "word2047");
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
	assert.throws(() => indexToWord(list, -1));
	assert.throws(() => indexToWord(list, 2048));
});

test("wordToIndex throws on unknown word", () => {
	const list = createWordlist(makeWords(2048));
	assert.throws(() => wordToIndex(list, "unknown"));
});

test("loadEnglishWordlist loads 2048 words with stable mapping", async () => {
	const list = await loadEnglishWordlist();
	assert.equal(list.words.length, 2048);
	assert.equal(list.wordToIndex.size, 2048);
	assert.equal(wordToIndex(list, list.words[0]), 0);
	assert.equal(wordToIndex(list, list.words[2047]), 2047);
});
