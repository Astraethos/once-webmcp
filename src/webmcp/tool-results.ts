import type { CommandResult } from "../core/domain/types";
import type { OnceStore } from "../core/store/once-store";

export function invalidInput(store: OnceStore, message: string): CommandResult {
  return { ok: false, error: { code: "INVALID_INPUT", message }, stateVersion: store.getState().stateVersion };
}

export function cancelled(store: OnceStore): CommandResult {
  return { ok: false, error: { code: "ABORTED", message: "The tool call was cancelled before making changes." }, stateVersion: store.getState().stateVersion };
}
