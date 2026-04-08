export const ENTROPY_BYTES = [16, 20, 24, 28, 32];
export const ENTROPY_BITS = [128, 160, 192, 224, 256];
export const WORD_COUNTS = [12, 15, 18, 21, 24];
export const WORDLIST_SIZE = 2048;
export const SEED_BYTES = 64;
export const PBKDF2_ITERATIONS = 2048;
export const ENTROPY_BITS_BY_WORD_COUNT = new Map([
    [12, 128],
    [15, 160],
    [18, 192],
    [21, 224],
    [24, 256],
]);
export const WORD_COUNT_BY_ENTROPY_BITS = new Map([
    [128, 12],
    [160, 15],
    [192, 18],
    [224, 21],
    [256, 24],
]);
export const entropyBitsFromBytes = (bytes) => bytes * 8;
export const checksumBitsForEntropyBits = (entropyBits) => entropyBits / 32;
export const wordCountForEntropyBits = (entropyBits) => WORD_COUNT_BY_ENTROPY_BITS.get(entropyBits) ??
    (() => {
        throw new Error(`Unsupported entropy bits: ${entropyBits}`);
    })();
export const entropyBitsForWordCount = (wordCount) => ENTROPY_BITS_BY_WORD_COUNT.get(wordCount) ??
    (() => {
        throw new Error(`Unsupported word count: ${wordCount}`);
    })();
