import { validateMnemonic } from "../../bip39/validateMnemonic.js";
import { ErrorCode } from "../../errors/errorCodes.js";
import { normalizeMnemonicInput } from "../../normalize/normalizeMnemonicInput.js";

export type ValidateCommandResult =
	| {
			ok: true;
			normalized: string;
	  }
	| {
			ok: false;
			errorCode: ErrorCode;
	  };

export const validateCommand = (
	input: string,
	strict: boolean,
): ValidateCommandResult => {
	const normalized = strict ? input : normalizeMnemonicInput(input);
	const result = validateMnemonic(normalized);
	if (!result.ok) {
		return {
			ok: false,
			errorCode: result.error_code ?? ErrorCode.ERR_INVALID_MNEMONIC_FORMAT,
		};
	}
	return {
		ok: true,
		normalized: result.normalized_mnemonic ?? normalized,
	};
};
