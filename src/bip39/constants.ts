export const ENTROPY_BYTES = [16, 20, 24, 28, 32] as const;
export const ENTROPY_BITS = [128, 160, 192, 224, 256] as const;
export const WORD_COUNTS = [12, 15, 18, 21, 24] as const;

export const WORDLIST_SIZE = 2048;
export const SEED_BYTES = 64;
export const PBKDF2_ITERATIONS = 2048;

export type EntropyBytes = (typeof ENTROPY_BYTES)[number];
export type EntropyBits = (typeof ENTROPY_BITS)[number];
export type WordCount = (typeof WORD_COUNTS)[number];

export const ENTROPY_BITS_BY_WORD_COUNT = new Map<WordCount, EntropyBits>([
	[12, 128],
	[15, 160],
	[18, 192],
	[21, 224],
	[24, 256],
]);

export const WORD_COUNT_BY_ENTROPY_BITS = new Map<EntropyBits, WordCount>([
	[128, 12],
	[160, 15],
	[192, 18],
	[224, 21],
	[256, 24],
]);

export const entropyBitsFromBytes = (bytes: number): number => bytes * 8;

export const checksumBitsForEntropyBits = (entropyBits: number): number =>
	entropyBits / 32;

export const wordCountForEntropyBits = (entropyBits: EntropyBits): WordCount =>
	WORD_COUNT_BY_ENTROPY_BITS.get(entropyBits) ??
	(() => {
		throw new Error(`Unsupported entropy bits: ${entropyBits}`);
	})();

export const entropyBitsForWordCount = (wordCount: WordCount): EntropyBits =>
	ENTROPY_BITS_BY_WORD_COUNT.get(wordCount) ??
	(() => {
		throw new Error(`Unsupported word count: ${wordCount}`);
	})();
