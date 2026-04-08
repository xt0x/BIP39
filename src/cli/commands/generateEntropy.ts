import { generateEntropy } from "../../entropy/entropyGenerator.js";

export const generateEntropyCommand = (bytes: number): Uint8Array =>
	generateEntropy(bytes);
