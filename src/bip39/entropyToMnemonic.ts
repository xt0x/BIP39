import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { bitsToIntegers, bytesToBits } from "../bits/bitOps.js";
import {
	checksumBitsForEntropyBits,
	ENTROPY_BYTES,
	WORDLIST_SIZE,
} from "../constants/bip39.js";
import { sha256 } from "../crypto/crypto.js";
import { ErrorCode } from "../errors/errorCodes.js";

const ENGLISH_WORDLIST_PATH = "assets/english.txt";

let cachedEnglishWords: string[] | null = null;

export class EntropyLengthError extends Error {
	code = ErrorCode.ERR_ENTROPY_LENGTH;

	constructor(message = "Invalid entropy length") {
		super(message);
		this.name = "EntropyLengthError";
	}
}

const loadEnglishWords = (): string[] => {
	if (cachedEnglishWords) {
		return cachedEnglishWords;
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
	const seen = new Set<string>();
	for (const word of lines) {
		if (word.length === 0) {
			throw new Error("Wordlist contains an empty word");
		}
		if (seen.has(word)) {
			throw new Error(`Duplicate word detected: ${word}`);
		}
		seen.add(word);
	}
	cachedEnglishWords = lines;
	return lines;
};

const isValidEntropyLength = (entropyBytes: number): boolean =>
	(ENTROPY_BYTES as readonly number[]).includes(entropyBytes);

export const entropyToMnemonic = (entropy: Uint8Array): string => {
	if (!isValidEntropyLength(entropy.length)) {
		throw new EntropyLengthError(
			`Entropy must be ${ENTROPY_BYTES.join("/")} bytes`,
		);
	}

	const entropyBits = entropy.length * 8;
	const checksumBits = checksumBitsForEntropyBits(entropyBits);
	const entropyBitArray = bytesToBits(entropy);
	const checksum = bytesToBits(sha256(entropy)).slice(0, checksumBits);
	const combined = entropyBitArray.concat(checksum);
	const indices = bitsToIntegers(combined, 11);
	const words = loadEnglishWords();
	const mnemonicWords = indices.map((index) => {
		const word = words[index];
		if (word === undefined) {
			throw new Error(`Word index out of range: ${index}`);
		}
		return word;
	});
	return mnemonicWords.join(" ");
};
