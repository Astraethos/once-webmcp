import { describe, expect, it, vi } from "vitest";
import { createDemoSeed } from "../src/core/demo/seed";
import { getVendorDossier } from "../src/core/demo/vendor-dossiers";
import type { Command, CommandRequest } from "../src/core/domain/commands";
import { candidate, criterion, evidence, populatedStore, request, score, testStore } from "./helpers";

describe("semantic command bus", () => {
  it("creates independent deterministic seeds with no manufactured activity", () => {
    const first = createDemoSeed();
    expect(first).toEqual(createDemoSeed());
    first.workspace.candidates.push({ id: "x", name: "Changed" });
    expect(createDemoSeed().workspace.candidates).toEqual([]);
    expect(createDemoSeed().trace).toEqual([]);
  });

  it("uses identical mutation semantics for human and agent requests", () => {
    const human = testStore();
    const agent = testStore();
    expect(human.execute(request(candidate, "human")).ok).toBe(true);
    expect(agent.execute(request(candidate, "agent")).ok).toBe(true);
    expect(human.getState().workspace).toEqual(agent.getState().workspace);
    expect(human.getState().trace[0]).toMatchObject({ actor: { kind: "human" }, channel: "ui", outcome: "applied", summary: "Added candidate: Aegis Cloud" });
    expect(agent.getState().trace[0]).toMatchObject({ actor: { kind: "agent" }, channel: "webmcp", outcome: "applied", summary: "Added candidate: Aegis Cloud" });
  });

  it("sets a finite nonnegative USD budget", () => {
    const store = testStore();
    store.execute(request({ type: "SET_BUDGET", payload: { amount: 24000, currency: "USD" } }));
    expect(store.getState().workspace.budget).toEqual({ amount: 24000, currency: "USD" });
    expect(store.getState().trace[0].summary).toBe("Set budget: $24,000 USD");
    store.execute(request({ type: "SET_BUDGET", payload: { amount: 0, currency: "USD" } }));
    expect(store.getState().workspace.budget.amount).toBe(0);
  });

  it.each([-1, NaN, Infinity, -Infinity])("rejects invalid budget %s", (amount) => {
    const store = testStore();
    expect(store.execute(request({ type: "SET_BUDGET", payload: { amount, currency: "USD" } }))).toMatchObject({ ok: false, error: { code: "INVALID_PAYLOAD" } });
    expect(store.getState().workspace).toEqual(createDemoSeed().workspace);
  });

  it("normalizes criterion priorities deterministically and honors repositioning", () => {
    const store = testStore();
    store.execute(request(criterion));
    store.execute(request({ type: "ADD_CRITERION", payload: { criterionId: "cost", name: "Cost", priority: 1, required: false } }));
    expect(store.getState().workspace.criteria.map((c) => [c.name, c.priority])).toEqual([["Cost", 1], ["Security", 2]]);
    store.execute(request({ type: "SET_CRITERION_PRIORITY", payload: { criterionId: "security", priority: 1 } }));
    expect(store.getState().workspace.criteria.map((c) => [c.name, c.priority])).toEqual([["Security", 1], ["Cost", 2]]);
    store.execute(request({ type: "SET_CRITERION_REQUIRED", payload: { criterionId: "security", required: true } }));
    expect(store.getState().workspace.criteria[0].required).toBe(true);
    expect(store.getState().trace.at(-1)?.summary).toBe("Made Security required");
  });

  it("rejects duplicates by ID or normalized name", () => {
    const store = testStore();
    store.execute(request(candidate));
    for (const payload of [{ candidateId: "different", name: "  AEGIS CLOUD  " }, { candidateId: "aegis", name: "Other" }]) {
      expect(store.execute(request({ type: "ADD_CANDIDATE", payload }))).toMatchObject({ ok: false, error: { code: "DUPLICATE_CANDIDATE" } });
    }
    expect(store.getState().workspace.candidates).toHaveLength(1);
    expect(store.getState().trace.map((e) => e.sequence)).toEqual([1, 2, 3]);
  });

  it("applies evidence corrections and upserts a single score per pair", () => {
    const store = populatedStore();
    store.execute(request({ type: "REPLACE_EVIDENCE", payload: { evidenceId: "e1", summary: "SAML SSO included", sourceRef: "aegis-security", confidence: "medium", reason: "Clarified scope" } }));
    store.execute(request({ type: "SET_SCORE", payload: { candidateId: "aegis", criterionId: "security", score: 3, rationale: "Meets requirements" } }));
    expect(store.getState().workspace.evidence[0]).toMatchObject({ summary: "SAML SSO included", confidence: "medium" });
    expect(store.getState().workspace.scores).toHaveLength(1);
    expect(store.getState().workspace.scores[0].score).toBe(3);
    expect(store.getState().trace.slice(-2).map((e) => e.teaching.disposition)).toEqual(["example_only", "example_only"]);
    expect(store.getState().trace[2].command.payload).toMatchObject({ summary: "SOC 2 Type II" });
  });

  it("allows evaluation-level uncertainty and stores approval policy without executing a gate", () => {
    const store = populatedStore();
    store.execute(request({ type: "FLAG_UNCERTAINTY", payload: { uncertaintyId: "u1", note: "Implementation scope needs review" } }, "agent"));
    store.execute(request({ type: "SET_RECOMMENDATION", payload: { candidateId: "aegis", rationale: "Best supported option" } }, "agent"));
    store.execute(request({ type: "SET_APPROVAL_POLICY", payload: { requiredBeforeRecommendation: true } }));
    expect(store.getState().workspace.uncertainties).toHaveLength(1);
    expect(store.getState().workspace.approvalPolicy.requiredBeforeRecommendation).toBe(true);
    expect(store.getState().workspace.recommendation?.candidateId).toBe("aegis");
    expect(store.getState().replay).toBeNull();
  });

  it.each([undefined, 1, 2, 3, 4, 5])("enforces required-criterion eligibility for score %s", (value) => {
    const store = testStore();
    store.executeBatch([request(candidate), request(criterion)]);
    store.execute(request({ type: "SET_CRITERION_REQUIRED", payload: { criterionId: "security", required: true } }));
    if (value !== undefined) store.execute(request({ type: "SET_SCORE", payload: { candidateId: "aegis", criterionId: "security", score: value, rationale: "Fixture assessment" } }));
    const result = store.execute(request({ type: "SET_RECOMMENDATION", payload: { candidateId: "aegis", rationale: "Assessment" } }));
    expect(result.ok).toBe(value !== undefined && value >= 3);
    if (value === undefined || value < 3) {
      expect(result).toMatchObject({ error: { code: "REQUIRED_CRITERION_FAILED" } });
      expect(store.getState().workspace.recommendation).toBeNull();
    }
  });

  it.each([evidence, score,
    { type: "SET_CRITERION_REQUIRED", payload: { criterionId: "missing", required: true } },
    { type: "REPLACE_EVIDENCE", payload: { evidenceId: "missing", summary: "x", sourceRef: "x", confidence: "high" } },
    { type: "FLAG_UNCERTAINTY", payload: { uncertaintyId: "u", candidateId: "missing", note: "x" } },
  ] satisfies Command[])("rejects missing references for $type", (command) => {
    const store = testStore();
    const before = store.getState().workspace;
    expect(store.execute(request(command)).ok).toBe(false);
    expect(store.getState().workspace).toBe(before);
    expect(store.getState().trace[0]).toMatchObject({ outcome: "rejected", teaching: { disposition: "excluded" } });
  });

  it("rolls back a batch when a later item fails, recording no applied events", () => {
    const store = testStore();
    const notify = vi.fn();
    store.subscribe(notify);
    const before = store.getState().workspace;
    const result = store.executeBatch([request(candidate), request(candidate)]);
    expect(result).toMatchObject({ ok: false, error: { code: "DUPLICATE_CANDIDATE" } });
    expect(store.getState().workspace).toBe(before);
    expect(store.getState().trace.map((e) => e.outcome)).toEqual(["rejected"]);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("commits a valid dependent batch synchronously with granular events and one notification", () => {
    const store = testStore();
    const notify = vi.fn(() => expect(store.getState().workspace.evidence).toHaveLength(1));
    const unsubscribe = store.subscribe(notify);
    const result = store.executeBatch([candidate, criterion, evidence, score].map((c) => request(c, "agent")));
    expect(result).toMatchObject({ ok: true, eventIds: ["event-1", "event-2", "event-3", "event-4"], stateVersion: 1 });
    expect(notify).toHaveBeenCalledTimes(1);
    expect(store.getState().trace.map((e) => e.sequence)).toEqual([1, 2, 3, 4]);
    unsubscribe();
    store.resetDemo();
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("protects snapshots and trace from caller mutation", () => {
    const store = testStore();
    const command = request(candidate);
    store.execute(command);
    if (command.type === "ADD_CANDIDATE") command.payload.name = "Mutated input";
    expect(store.getState().trace[0].command.payload).toMatchObject({ name: "Aegis Cloud" });
    expect(() => { store.getState().workspace.candidates[0].name = "Bypassed bus"; }).toThrow();
    expect(store.getState().workspace.candidates[0].name).toBe("Aegis Cloud");
  });

  it.each([
    { type: "SET_APPROVAL_POLICY", payload: { requiredBeforeRecommendation: false } },
    { type: "SET_CRITERION_REQUIRED", payload: { criterionId: "security", required: false } },
    { type: "SET_CRITERION_PRIORITY", payload: { criterionId: "security", priority: 2 } },
    { type: "REPLACE_EVIDENCE", payload: { evidenceId: "e1", summary: "x", sourceRef: "x", confidence: "high" } },
    { type: "TEACH_ROUTINE", payload: { routineName: "x" } },
    { type: "START_REPLAY", payload: { routineId: "x", budget: 0, currency: "USD", candidates: [{ candidateId: "a", name: "A" }, { candidateId: "b", name: "B" }] } },
    { type: "RECORD_APPROVAL", payload: { runId: "x", gateId: "g", decision: "approved" } },
    { type: "REQUEST_APPROVAL", payload: { runId: "x", gateId: "g", message: "x" } },
    { type: "COMPLETE_REPLAY", payload: { runId: "x" } },
  ] satisfies Command[])("rejects agent use of restricted command $type", (command) => {
    expect(populatedStore().execute(request(command, "agent"))).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  });

  it("rejects forged actor/channel combinations and system domain edits", () => {
    const store = testStore();
    expect(store.execute({ ...request(candidate), channel: "webmcp" })).toMatchObject({ error: { code: "UNAUTHORIZED" } });
    expect(store.execute({ ...request(candidate), actor: { kind: "agent", id: "local-human", label: "Human" } })).toMatchObject({ error: { code: "UNAUTHORIZED" } });
    expect(store.execute(request(candidate, "system"))).toMatchObject({ error: { code: "UNAUTHORIZED" } });
    expect(store.getState()).toEqual(createDemoSeed());
  });

  it("rejects stale phases and unavailable lifecycle actions", () => {
    const store = testStore();
    expect(store.execute({ ...request(candidate), phase: "replay" })).toMatchObject({ error: { code: "INVALID_PHASE" } });
    expect(store.execute(request({ type: "TEACH_ROUTINE", payload: { routineName: "Review" } }))).toMatchObject({ error: { code: "TEACHING_INCOMPLETE" } });
    expect(store.execute(request({ type: "REQUEST_APPROVAL", payload: { runId: "r", gateId: "g", message: "Review" } }, "system"))).toMatchObject({ error: { code: "NOT_IMPLEMENTED" } });
    expect(store.getState().trace.at(-1)?.actor.kind).toBe("system");
  });

  it.each([null, {}, { type: "UNKNOWN" }])("handles malformed command envelopes: %s", (input) => {
    const store = testStore();
    expect(store.execute(input as CommandRequest)).toMatchObject({ ok: false, error: { code: "INVALID_COMMAND" } });
    expect(store.getState()).toEqual(createDemoSeed());
  });

  it.each([{ candidateId: "x", name: " " }, { candidateId: "x", name: 42 }, { candidateId: "x", name: "A", actor: "human" }, null])("rejects malformed payload without mutation: %s", (payload) => {
    const store = testStore();
    const command = { ...request(candidate), payload } as CommandRequest;
    expect(store.execute(command)).toMatchObject({ ok: false, error: { code: "INVALID_PAYLOAD" } });
    expect(store.getState().workspace.candidates).toEqual([]);
  });
});

describe("fictional first-party dossiers", () => {
  it.each(["Aegis Cloud", "BeaconStack", "Northwind AI", "Orchid Systems"])("returns four fixed facts for %s", (name) => {
    const result = getVendorDossier(name);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.dossier.facts).toHaveLength(4);
    expect(result).toEqual(getVendorDossier(name));
  });
  it("does not invent unknown vendors or permit fixture mutation", () => {
    expect(getVendorDossier("Unknown")).toMatchObject({ ok: false, error: { code: "VENDOR_NOT_FOUND" } });
    const result = getVendorDossier("Aegis Cloud");
    if (result.ok) result.dossier.facts[0].statement = "Changed";
    expect(getVendorDossier("  aegis cloud  ")).toMatchObject({ dossier: { facts: [expect.objectContaining({ statement: "SOC 2 Type II. SAML SSO is included in the standard plan." }), expect.anything(), expect.anything(), expect.anything()] } });
  });
});
