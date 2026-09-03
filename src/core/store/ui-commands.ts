import { ACTORS } from "../domain/types";
import type { Command } from "../domain/commands";
import type { OnceStore } from "./once-store";

export function addCandidateFromUI(store: OnceStore, name: string) {
  return executeFromUI(store, {
    type: "ADD_CANDIDATE",
    payload: { candidateId: crypto.randomUUID(), name },
  });
}

export function executeFromUI(store: OnceStore, command: Command) {
  const state = store.getState();
  return store.execute({ ...command, id: crypto.randomUUID(), actor: ACTORS.human, channel: "ui", phase: state.phase, ...(state.replay ? { replayRunId: state.replay.runId } : {}) });
}
