export const normalizeMnemonicInput = (input: string): string => {
	if (typeof input !== "string") {
		throw new TypeError("Mnemonic input must be a string");
	}

	const replaced = input.replace(/[\t\n\r]/gu, " ");
	const trimmed = replaced.trim();
	if (trimmed.length === 0) {
		return "";
	}
	const collapsed = trimmed.replace(/\s+/gu, " ");
	const normalized = collapsed.normalize("NFKD");
	return normalized.toLowerCase();
};
