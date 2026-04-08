export const bytesToBits = (bytes: Uint8Array): number[] => {
	const bits: number[] = [];
	for (const byte of bytes) {
		for (let bit = 7; bit >= 0; bit -= 1) {
			bits.push((byte >> bit) & 1);
		}
	}
	return bits;
};

const assertBit = (bit: number): void => {
	if (bit !== 0 && bit !== 1) {
		throw new Error(`Invalid bit value: ${bit}`);
	}
};

export const bitsToBytes = (bits: number[]): Uint8Array => {
	if (bits.length % 8 !== 0) {
		throw new Error("Bit length must be a multiple of 8");
	}
	const bytes = new Uint8Array(bits.length / 8);
	for (let i = 0; i < bytes.length; i += 1) {
		let value = 0;
		for (let j = 0; j < 8; j += 1) {
			const bit = bits[i * 8 + j];
			assertBit(bit);
			value = (value << 1) | bit;
		}
		bytes[i] = value;
	}
	return bytes;
};

const assertChunkSize = (size: number): void => {
	if (!Number.isInteger(size) || size <= 0) {
		throw new Error(`Invalid chunk size: ${size}`);
	}
};

export const bitsToIntegers = (bits: number[], size: number): number[] => {
	assertChunkSize(size);
	if (bits.length % size !== 0) {
		throw new Error(`Bit length must be a multiple of ${size}`);
	}
	const values: number[] = [];
	for (let offset = 0; offset < bits.length; offset += size) {
		let value = 0;
		for (let i = 0; i < size; i += 1) {
			const bit = bits[offset + i];
			assertBit(bit);
			value = (value << 1) | bit;
		}
		values.push(value);
	}
	return values;
};

export const integersToBits = (values: number[], size: number): number[] => {
	assertChunkSize(size);
	const limit = 1 << size;
	const bits: number[] = [];
	for (const value of values) {
		if (!Number.isInteger(value) || value < 0 || value >= limit) {
			throw new Error(`Value out of range for ${size} bits: ${value}`);
		}
		for (let bit = size - 1; bit >= 0; bit -= 1) {
			bits.push((value >> bit) & 1);
		}
	}
	return bits;
};
