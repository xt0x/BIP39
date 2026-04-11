#!/usr/bin/env node
import { runCli } from "./runCli.js";

const readStdin = async (): Promise<string | null> => {
	if (process.stdin.isTTY) {
		return null;
	}
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) {
		chunks.push(Buffer.from(chunk));
	}
	return Buffer.concat(chunks).toString("utf8");
};

const exitCode = await runCli(process.argv.slice(2), {
	readStdin,
	writeStdout: (text) => {
		process.stdout.write(text);
	},
	writeStderr: (text) => {
		process.stderr.write(text);
	},
});

process.exitCode = exitCode;
