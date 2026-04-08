import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { WORDLIST_SIZE } from "../constants/bip39.js";

export type EnglishWordlist = {
	words: string[];
	wordToIndex: Map<string, number>;
};

const ENGLISH_WORDLIST_PATH = "assets/english.txt";

let cachedEnglishWordlist: EnglishWordlist | null = null;

export const loadEnglishWordlist = (): EnglishWordlist => {
	if (cachedEnglishWordlist) {
		return cachedEnglishWordlist;
	}
	const filePath = resolve(process.cwd(), ENGLISH_WORDLIST_PATH);
	const text = readFileSync(filePath, "utf8");
	const lines = text
		.split("\n")
		.map((line) => (line.endsWith("\r") ? line.slice(0, -1) : line));
	if (lines.length > 0 && lines[lines.length - 1] === "") {
		lines.pop();
	}
	if (lines.length !== WORDLIST_SIZE) {
		throw new Error(
			`Wordlist must contain ${WORDLIST_SIZE} words, got ${lines.length}`,
		);
	}
	const wordToIndex = new Map<string, number>();
	lines.forEach((word, index) => {
		if (word.length === 0) {
			throw new Error("Wordlist contains an empty word");
		}
		if (wordToIndex.has(word)) {
			throw new Error(`Duplicate word detected: ${word}`);
		}
		wordToIndex.set(word, index);
	});
	cachedEnglishWordlist = { words: lines, wordToIndex };
	return cachedEnglishWordlist;
};
