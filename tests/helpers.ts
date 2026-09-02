import { ACTORS, type ActorKind } from "../src/core/domain/types";
import type { Command, CommandRequest } from "../src/core/domain/commands";
import { createOnceStore } from "../src/core/store/once-store";
import type { StoragePort } from "../src/core/persistence/local-storage";

let commandId = 0;
export function request(command: Command, actor: ActorKind = "human"): CommandRequest {
  return {
    ...command, id: `command-${++commandId}`, actor: ACTORS[actor],
    channel: actor === "human" ? "ui" : actor === "agent" ? "webmcp" : "system",
    phase: "collaboration",
  };
}

export const candidate: Command = { type: "ADD_CANDIDATE", payload: { candidateId: "aegis", name: "Aegis Cloud" } };
export const criterion: Command = { type: "ADD_CRITERION", payload: { criterionId: "security", name: "Security", priority: 1, required: false } };
export const evidence: Command = { type: "ATTACH_EVIDENCE", payload: { evidenceId: "e1", candidateId: "aegis", criterionId: "security", summary: "SOC 2 Type II", sourceRef: "aegis-security", confidence: "high" } };
export const score: Command = { type: "SET_SCORE", payload: { candidateId: "aegis", criterionId: "security", score: 4, rationale: "Strong controls" } };

export function testStore(storage?: StoragePort) {
  let id = 0;
  return createOnceStore({ storage, newId: () => `event-${++id}`, now: () => "2026-09-02T12:00:00.000Z" });
}

export function populatedStore() {
  const store = testStore();
  store.executeBatch([candidate, criterion, evidence, score].map((c) => request(c)));
  return store;
}

export function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  } satisfies StoragePort;
}
