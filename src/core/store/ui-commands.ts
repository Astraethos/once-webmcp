import { ACTORS } from "../domain/types";
import type { OnceStore } from "./once-store";

export function addCandidateFromUI(store: OnceStore, name: string) {
  return store.execute({
    id: crypto.randomUUID(),
    type: "ADD_CANDIDATE",
    payload: { candidateId: crypto.randomUUID(), name },
    actor: ACTORS.human,
    channel: "ui",
    phase: store.getState().phase,
  });
}
