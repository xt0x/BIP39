import assert from "node:assert/strict";
import { afterEach, beforeEach, test, vi } from "vitest";

const fileReads = vi.hoisted(() => ({
	readFile: vi.fn(),
	readFileSync: vi.fn(),
}));

vi.mock("node:fs/promises", async (importOriginal) => ({
	...(await importOriginal<typeof import("node:fs/promises")>()),
	readFile: fileReads.readFile,
}));

vi.mock("node:fs", async (importOriginal) => ({
	...(await importOriginal<typeof import("node:fs")>()),
	readFileSync: fileReads.readFileSync,
}));

const { readFileSync } =
	await vi.importActual<typeof import("node:fs")>("node:fs");
const englishText = readFileSync(
	new URL("../assets/english.txt", import.meta.url),
	"utf8",
);
const words = Array.from({ length: 2048 }, (_, index) => `word${index}`);
const wordsWith = (replacements: Record<number, string>): string[] =>
	words.map((word, index) => replacements[index] ?? word);
const mnemonic = `${"abandon ".repeat(11)}about`;

beforeEach(() => {
	vi.resetModules();
	fileReads.readFile.mockReset().mockResolvedValue(englishText);
	fileReads.readFileSync.mockReset().mockReturnValue(englishText);
});

afterEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
});

// BIP39 uses an ordered, 2048-entry dictionary. These parsing and error
// contracts preserve the distinct synchronous and asynchronous entry points.
test.each([
	{ name: "LF", separator: "\n", trailingNewline: false },
	{ name: "LF with final newline", separator: "\n", trailingNewline: true },
	{ name: "CRLF", separator: "\r\n", trailingNewline: false },
	{ name: "CRLF with final newline", separator: "\r\n", trailingNewline: true },
])("both English loaders accept $name and preserve indices", async (input) => {
	const text =
		words.join(input.separator) +
		(input.trailingNewline ? input.separator : "");
	fileReads.readFile.mockResolvedValue(text);
	fileReads.readFileSync.mockReturnValue(text);
	const { loadEnglishWordlist: loadAsync, loadEnglishWordlistSync: loadSync } =
		await import("../src/bip39/wordlist.ts");
	for (const list of [await loadAsync(), loadSync()]) {
		assert.deepEqual(list.words, words);
		assert.deepEqual(
			[...list.wordToIndex],
			words.map((word, i) => [word, i]),
		);
	}
});

test.each([
	{
		name: "an empty file",
		lines: [],
		asyncMessage: "Wordlist must contain 2048 words, got 0",
		syncMessage: "Wordlist must contain 2048 words, got 0",
	},
	{
		name: "too few words",
		lines: words.slice(1),
		asyncMessage: "Wordlist must contain 2048 words, got 2047",
		syncMessage: "Wordlist must contain 2048 words, got 2047",
	},
	{
		name: "too many words",
		lines: [...words, "extra"],
		asyncMessage: "Wordlist must contain 2048 words, got 2049",
		syncMessage: "Wordlist must contain 2048 words, got 2049",
	},
	{
		name: "an empty word",
		lines: wordsWith({ 100: "" }),
		asyncMessage: "Wordlist contains empty lines",
		syncMessage: "Wordlist contains an empty word",
	},
	{
		name: "a leading empty line with an incorrect count",
		lines: ["", ...words],
		asyncMessage: "Wordlist contains empty lines",
		syncMessage: "Wordlist must contain 2048 words, got 2049",
	},
	{
		name: "two final newlines",
		lines: [...words, "", ""],
		asyncMessage: "Wordlist contains empty lines",
		syncMessage: "Wordlist must contain 2048 words, got 2049",
	},
	{
		name: "duplicate words",
		lines: wordsWith({ 1: "word0" }),
		asyncMessage: "Duplicate word detected: word0",
		syncMessage: "Duplicate word detected: word0",
	},
	{
		name: "a duplicate with an incorrect count",
		lines: [...words, "word0"],
		asyncMessage: "Wordlist must contain 2048 words, got 2049",
		syncMessage: "Wordlist must contain 2048 words, got 2049",
	},
	{
		name: "a duplicate before an empty word",
		lines: wordsWith({ 1: "word0", 100: "" }),
		asyncMessage: "Wordlist contains empty lines",
		syncMessage: "Duplicate word detected: word0",
	},
	{
		name: "an empty word before a duplicate",
		lines: wordsWith({ 1: "", 100: "word0" }),
		asyncMessage: "Wordlist contains empty lines",
		syncMessage: "Wordlist contains an empty word",
	},
])("English loaders preserve error precedence for $name", async (input) => {
	fileReads.readFile.mockResolvedValue(input.lines.join("\n"));
	fileReads.readFileSync.mockReturnValue(input.lines.join("\n"));
	const { loadEnglishWordlist: loadAsync, loadEnglishWordlistSync: loadSync } =
		await import("../src/bip39/wordlist.ts");
	await assert.rejects(loadAsync, {
		name: "Error",
		message: input.asyncMessage,
	});
	assert.throws(loadSync, { name: "Error", message: input.syncMessage });
});

test("English loaders reuse a successfully loaded dictionary", async () => {
	const { loadEnglishWordlist: loadAsync, loadEnglishWordlistSync: loadSync } =
		await import("../src/bip39/wordlist.ts");
	const asyncList = await loadAsync();
	const syncList = loadSync();
	fileReads.readFile.mockRejectedValue(new Error("Wordlist unavailable"));
	fileReads.readFileSync.mockImplementation(() => {
		throw new Error("Wordlist unavailable");
	});
	assert.strictEqual(await loadAsync(), asyncList);
	assert.strictEqual(loadSync(), syncList);
});

test("English loaders retry after a failed file read", async () => {
	const failure = new Error("Wordlist unavailable");
	fileReads.readFile.mockRejectedValueOnce(failure);
	fileReads.readFileSync.mockImplementationOnce(() => {
		throw failure;
	});
	const { loadEnglishWordlist: loadAsync, loadEnglishWordlistSync: loadSync } =
		await import("../src/bip39/wordlist.ts");
	await assert.rejects(loadAsync, failure);
	assert.throws(loadSync, failure);
	assert.equal((await loadAsync()).words[0], "abandon");
	assert.equal(loadSync().words[0], "abandon");
});

test("English loaders retry after malformed wordlist contents", async () => {
	fileReads.readFile.mockResolvedValueOnce("incomplete\n");
	fileReads.readFileSync.mockReturnValueOnce("incomplete\n");
	const { loadEnglishWordlist: loadAsync, loadEnglishWordlistSync: loadSync } =
		await import("../src/bip39/wordlist.ts");
	const error = {
		name: "Error",
		message: "Wordlist must contain 2048 words, got 1",
	};
	await assert.rejects(loadAsync, error);
	assert.throws(loadSync, error);
	assert.equal((await loadAsync()).words[2047], "zoo");
	assert.equal(loadSync().words[2047], "zoo");
});

test.each([
	"async first",
	"sync first",
])("English loader caches stay separate when initialized %s", async (order) => {
	const { loadEnglishWordlist: loadAsync, loadEnglishWordlistSync: loadSync } =
		await import("../src/bip39/wordlist.ts");
	if (order === "sync first") loadSync();
	const asyncList = await loadAsync();
	const syncList = loadSync();
	assert.notStrictEqual(asyncList, syncList);
	assert.notStrictEqual(asyncList.words, syncList.words);
	assert.notStrictEqual(asyncList.wordToIndex, syncList.wordToIndex);
	assert.deepEqual(asyncList, syncList);
	assert.strictEqual(await loadAsync(), asyncList);
	assert.strictEqual(loadSync(), syncList);
});

test("an asynchronous read can finish independently of a synchronous read", async () => {
	let resolveRead!: (text: string) => void;
	fileReads.readFile.mockReturnValueOnce(
		new Promise<string>((resolve) => {
			resolveRead = resolve;
		}),
	);
	const { loadEnglishWordlist: loadAsync, loadEnglishWordlistSync: loadSync } =
		await import("../src/bip39/wordlist.ts");
	const pending = loadAsync();
	assert.ok(pending instanceof Promise);
	assert.equal(fileReads.readFileSync.mock.calls.length, 0);
	const syncList = loadSync();
	assert.equal(syncList.words[0], "abandon");
	resolveRead(englishText);
	const asyncList = await pending;
	assert.notStrictEqual(asyncList, syncList);
	assert.strictEqual(await loadAsync(), asyncList);
	assert.strictEqual(loadSync(), syncList);
});

test("a pending asynchronous read can fail and retry without affecting the synchronous cache", async () => {
	let rejectRead!: (error: Error) => void;
	fileReads.readFile.mockReturnValueOnce(
		new Promise<string>((_resolve, reject) => {
			rejectRead = reject;
		}),
	);
	const { loadEnglishWordlist: loadAsync, loadEnglishWordlistSync: loadSync } =
		await import("../src/bip39/wordlist.ts");
	const pending = loadAsync();
	const failure = new Error("Asynchronous read failed");
	const rejection = assert.rejects(pending, failure);
	const syncList = loadSync();
	rejectRead(failure);
	await rejection;
	assert.strictEqual(loadSync(), syncList);
	const asyncList = await loadAsync();
	assert.equal(asyncList.words[0], "abandon");
	assert.notStrictEqual(asyncList, syncList);
	assert.strictEqual(loadSync(), syncList);
});

test("mutating the public dictionary does not affect core BIP39 operations", async () => {
	const { loadEnglishWordlist } = await import("../src/bip39/wordlist.ts");
	const { entropyToMnemonic } = await import(
		"../src/bip39/entropyToMnemonic.ts"
	);
	const { validateMnemonic, mnemonicToEntropy } = await import(
		"../src/bip39/mnemonic.ts"
	);
	const list = await loadEnglishWordlist();
	const originalWords = [...list.words];
	const originalIndices = new Map(list.wordToIndex);
	try {
		list.words.fill("changed");
		list.wordToIndex.clear();
		assert.equal(entropyToMnemonic(new Uint8Array(16)), mnemonic);
		assert.equal(validateMnemonic(mnemonic).ok, true);
		assert.deepEqual(mnemonicToEntropy(mnemonic), new Uint8Array(16));
	} finally {
		list.words.splice(0, list.words.length, ...originalWords);
		for (const [word, index] of originalIndices) {
			list.wordToIndex.set(word, index);
		}
	}
});

test.each([
	{
		name: "invalid format",
		input: "abandon  unknown",
		code: "ERR_INVALID_MNEMONIC_FORMAT",
		errorName: "InvalidMnemonicFormatError",
		message: "Invalid mnemonic format",
	},
	{
		name: "invalid word count",
		input: "unknown",
		code: "ERR_INVALID_WORD_COUNT",
		errorName: "InvalidWordCountError",
		message: "Invalid word count",
	},
])("$name is rejected without loading the wordlist", async (input) => {
	fileReads.readFileSync.mockImplementation(() => {
		throw new Error("Wordlist unavailable");
	});
	const { validateMnemonic, mnemonicToEntropy } = await import(
		"../src/bip39/mnemonic.ts"
	);
	assert.equal(validateMnemonic(input.input).error_code, input.code);
	assert.throws(() => mnemonicToEntropy(input.input), {
		name: input.errorName,
		code: input.code,
		message: input.message,
	});
	assert.equal(fileReads.readFile.mock.calls.length, 0);
	assert.equal(fileReads.readFileSync.mock.calls.length, 0);
});

test("validation and decoding propagate wordlist read failures unchanged and retry", async () => {
	const failure = new Error("Wordlist unavailable");
	fileReads.readFileSync.mockImplementation(() => {
		throw failure;
	});
	const { validateMnemonic, mnemonicToEntropy } = await import(
		"../src/bip39/mnemonic.ts"
	);
	for (const operation of [validateMnemonic, mnemonicToEntropy]) {
		assert.throws(
			() => operation(mnemonic),
			(error: unknown) => error === failure,
		);
	}
	fileReads.readFileSync.mockReturnValue(englishText);
	assert.deepEqual(validateMnemonic(mnemonic), {
		ok: true,
		error_code: null,
		normalized_mnemonic: mnemonic,
		word_count: 12,
		invalid_word: null,
	});
	assert.deepEqual(mnemonicToEntropy(mnemonic), new Uint8Array(16));
});
