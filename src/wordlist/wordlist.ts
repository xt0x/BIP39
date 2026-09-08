import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { WORDLIST_SIZE } from "../constants/bip39.js";

export type Wordlist = {
	words: string[];
	wordToIndex: Map<string, number>;
};

const ENGLISH_WORDLIST_PATH = "assets/english.txt";

// Public callers can mutate their dictionary without changing core operations.
let cachedAsyncEnglishWordlist: Wordlist | null = null;
let cachedSyncEnglishWordlist: Wordlist | null = null;

export const createWordlist = (words: string[]): Wordlist => {
	if (words.length !== WORDLIST_SIZE) {
		throw new Error(
			`Wordlist must contain ${WORDLIST_SIZE} words, got ${words.length}`,
		);
	}

	const wordToIndex = new Map<string, number>();
	words.forEach((word, index) => {
		if (word.length === 0) {
			throw new Error("Wordlist contains an empty word");
		}
		if (wordToIndex.has(word)) {
			throw new Error(`Duplicate word detected: ${word}`);
		}
		wordToIndex.set(word, index);
	});

	return { words: [...words], wordToIndex };
};

const splitWordlistLines = (text: string): string[] => {
	const lines = text
		.split("\n")
		.map((line) => (line.endsWith("\r") ? line.slice(0, -1) : line));
	if (lines.length > 0 && lines[lines.length - 1] === "") {
		lines.pop();
	}
	return lines;
};

export const parseWordlist = (text: string): Wordlist => {
	const lines = splitWordlistLines(text);
	if (lines.some((line) => line.length === 0)) {
		throw new Error("Wordlist contains empty lines");
	}
	return createWordlist(lines);
};

export const loadEnglishWordlist = async (): Promise<Wordlist> => {
	if (cachedAsyncEnglishWordlist) {
		return cachedAsyncEnglishWordlist;
	}
	const filePath = resolve(process.cwd(), ENGLISH_WORDLIST_PATH);
	const text = await readFile(filePath, "utf8");
	cachedAsyncEnglishWordlist = parseWordlist(text);
	return cachedAsyncEnglishWordlist;
};

export const loadEnglishWordlistSync = (): Wordlist => {
	if (cachedSyncEnglishWordlist) {
		return cachedSyncEnglishWordlist;
	}
	const filePath = resolve(process.cwd(), ENGLISH_WORDLIST_PATH);
	const text = readFileSync(filePath, "utf8");
	// The synchronous contract checks length before empty or duplicate words.
	cachedSyncEnglishWordlist = createWordlist(splitWordlistLines(text));
	return cachedSyncEnglishWordlist;
};

export const indexToWord = (wordlist: Wordlist, index: number): string => {
	if (!Number.isInteger(index)) {
		throw new Error(`Index must be an integer: ${index}`);
	}
	if (index < 0 || index >= wordlist.words.length) {
		throw new Error(`Index out of range: ${index}`);
	}
	return wordlist.words[index];
};

export const wordToIndex = (wordlist: Wordlist, word: string): number => {
	const index = wordlist.wordToIndex.get(word);
	if (index === undefined) {
		throw new Error(`Word not in list: ${word}`);
	}
	return index;
};
