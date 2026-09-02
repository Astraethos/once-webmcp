import { describe, expect, it } from "vitest";
import { createDemoSeed } from "../src/core/demo/seed";
import { deserializeSnapshot, loadSnapshot, serializeSnapshot, STORAGE_KEY } from "../src/core/persistence/local-storage";
import { candidate, memoryStorage, populatedStore, request, testStore } from "./helpers";

describe("versioned local persistence", () => {
  it("round-trips the complete semantic snapshot", () => {
    const store = populatedStore();
    store.execute(request(candidate));
    expect(deserializeSnapshot(serializeSnapshot(store.getState()))).toEqual(store.getState());
  });
  it("persists commits and restores state on a new store instance", () => {
    const storage = memoryStorage();
    const store = testStore(storage);
    store.execute(request(candidate));
    expect(testStore(storage).getState()).toEqual(store.getState());
    expect(testStore(storage).getServerSnapshot()).toEqual(createDemoSeed());
  });
  it.each([null, "", "{", "null", "[]", "{}", '{"schemaVersion":2}', '{"schemaVersion":1,"workspace":{}}'])("falls back to deterministic seed for %s", (raw) => {
    expect(deserializeSnapshot(raw)).toEqual(createDemoSeed());
  });
  it("rejects incompatible versions and malformed nested state, not just malformed JSON", () => {
    const valid = populatedStore().getState();
    for (const mutate of [
      (s: typeof valid) => { s.schemaVersion = 2 as 1; },
      (s: typeof valid) => { s.workspace.scores[0].score = 9; },
      (s: typeof valid) => { s.workspace.evidence[0].candidateId = "missing"; },
      (s: typeof valid) => { s.workspace.candidates.push(s.workspace.candidates[0]); },
      (s: typeof valid) => { s.trace[0].sequence = 9; },
      (s: typeof valid) => { s.trace[0].actor.id = "forged"; },
      (s: typeof valid) => { s.workspace.criteria[0].priority = 3; },
    ]) {
      const state = structuredClone(valid);
      mutate(state);
      expect(deserializeSnapshot(JSON.stringify(state))).toEqual(createDemoSeed());
    }
  });
  it("discards an incompatible saved snapshot", () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, '{"schemaVersion":42}');
    expect(loadSnapshot(storage).state).toEqual(createDemoSeed());
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
  it("reset clears only the ONCE snapshot and produces no synthetic event", () => {
    const storage = memoryStorage();
    storage.setItem("unrelated", "keep");
    const store = testStore(storage);
    store.execute(request(candidate));
    store.resetDemo();
    expect(store.getState()).toEqual(createDemoSeed());
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem("unrelated")).toBe("keep");
    expect(testStore(storage).getState()).toEqual(createDemoSeed());
  });
  it("remains usable if reads fail, while reporting unavailable storage", () => {
    const storage = memoryStorage();
    storage.getItem = () => { throw new Error("denied"); };
    const store = testStore(storage);
    expect(store.getState()).toEqual(createDemoSeed());
    expect(store.getPersistenceError()).toContain("unavailable");
    expect(store.execute(request(candidate)).ok).toBe(true);
  });
  it("keeps in-memory edits when writes fail and reports reset failures honestly", () => {
    const storage = memoryStorage();
    storage.setItem = () => { throw new Error("quota"); };
    storage.removeItem = () => { throw new Error("denied"); };
    const store = testStore(storage);
    expect(store.execute(request(candidate)).ok).toBe(true);
    expect(store.getState().workspace.candidates).toHaveLength(1);
    expect(store.getPersistenceError()).toContain("could not be saved");
    store.resetDemo();
    expect(store.getState()).toEqual(createDemoSeed());
    expect(store.getPersistenceError()).toContain("could not be cleared");
  });
});
