const isHex = (value: string): boolean => /^[0-9a-fA-F]+$/u.test(value);

export const hexToBytes = (hex: string): Uint8Array => {
	const trimmed = hex.trim();
	if (trimmed.length === 0) {
		throw new Error("Hex input is empty");
	}
	if (trimmed.length % 2 !== 0) {
		throw new Error("Hex input must have even length");
	}
	if (!isHex(trimmed)) {
		throw new Error("Hex input contains non-hex characters");
	}
	const bytes = new Uint8Array(trimmed.length / 2);
	for (let index = 0; index < trimmed.length; index += 2) {
		bytes[index / 2] = Number.parseInt(trimmed.slice(index, index + 2), 16);
	}
	return bytes;
};

export const bytesToHex = (bytes: Uint8Array): string =>
	Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
