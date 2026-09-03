import { describe, expect, it, vi } from "vitest";
import { compileRoutine, type TeachingSource } from "../src/core/teaching/compiler";
import type { AppState } from "../src/core/domain/types";
import { ACTORS } from "../src/core/domain/types";
import { createDemoSeed } from "../src/core/demo/seed";
import { deserializeSnapshot, serializeSnapshot, STORAGE_KEY } from "../src/core/persistence/local-storage";
import { executeFromUI } from "../src/core/store/ui-commands";
import { createToolDefinitions } from "../src/webmcp/tool-definitions";
import { demoCollaboration } from "./fixtures/demo-collaboration";
import { testStore, request } from "./helpers";

const metadata = { id: "routine-1", name: "Vendor Security Review", createdAt: "2026-09-02T12:00:00.000Z" };
const teach = { type: "TEACH_ROUTINE", payload: { routineName: metadata.name } } as const;
function compiled(source: TeachingSource) {
  const result = compileRoutine(source, metadata);
  if (!result.ok) throw new Error(result.error.message);
  return result.routine;
}

describe("M4 deterministic Vendor Evaluation compiler", () => {
  it("compiles the exact demo into the approved routine structure", () => {
    const source = demoCollaboration().store.getState();
    expect(compiled(source)).toEqual({
      schemaVersion: 1, ...metadata, domain: "vendor_evaluation", sourceSessionId: source.sessionId,
      inputs: [
        { key: "budget", type: "money", required: true },
        { key: "candidates", type: "candidate_list", minItems: 2, maxItems: 4, required: true },
      ],
      policies: {
        criteria: [
          { routineCriterionId: "criterion-1", name: "Security", priority: 1, required: true },
          { routineCriterionId: "criterion-2", name: "Integration", priority: 2, required: false },
          { routineCriterionId: "criterion-3", name: "Cost", priority: 3, required: false },
        ],
        approval: { requiredBeforeRecommendation: true },
      },
      steps: [
        { id: "collect_evidence", kind: "collect_evidence", forEach: ["candidate", "criterion"], completion: "evidence_exists_for_every_candidate_criterion_pair" },
        { id: "score", kind: "score", forEach: ["candidate", "criterion"], completion: "score_exists_for_every_candidate_criterion_pair" },
        { id: "check_uncertainty", kind: "check_uncertainty", optional: true },
        { id: "approval", kind: "approval", requiredActor: "human", before: "recommend" },
        { id: "recommend", kind: "recommend", completion: "recommendation_exists" },
      ],
      compilerNotes: [
        { kind: "example_only", message: "Manual evidence correction — Example only — not generalized. Replacement text does not become a rule." },
        { kind: "example_only", message: "Manual score correction — Example only — not generalized. The corrected score and rationale do not become a rule." },
      ],
    });
  });

  it("retains final policy, including reordered priority, required status, description and disabled approval", () => {
    const { store, apply } = demoCollaboration();
    apply({ type: "SET_CRITERION_PRIORITY", payload: { criterionId: "cost", priority: 1 } }, "human");
    apply({ type: "SET_CRITERION_REQUIRED", payload: { criterionId: "security", required: false } }, "human");
    apply({ type: "ADD_CRITERION", payload: { criterionId: "support", name: "Support", description: "Service coverage", priority: 4, required: true } });
    apply({ type: "SET_APPROVAL_POLICY", payload: { requiredBeforeRecommendation: false } }, "human");
    const routine = compiled(store.getState());
    expect(routine.policies.criteria).toEqual([
      { routineCriterionId: "criterion-1", name: "Cost", priority: 1, required: false },
      { routineCriterionId: "criterion-2", name: "Security", priority: 2, required: false },
      { routineCriterionId: "criterion-3", name: "Integration", priority: 3, required: false },
      { routineCriterionId: "criterion-4", name: "Support", description: "Service coverage", priority: 4, required: true },
    ]);
    expect(routine.policies.approval.requiredBeforeRecommendation).toBe(false);
    expect(routine.steps.map((step) => step.kind)).not.toContain("approval");
  });

  it("excludes input literals, generated outputs, correction text and trace telemetry", () => {
    const source = demoCollaboration().store.getState();
    const json = JSON.stringify(compiled(source));
    const w = source.workspace;
    const literals = ["Aegis Cloud", "BeaconStack", "24000", ...w.candidates.map((c) => c.id), ...w.evidence.flatMap((e) => [e.summary, e.sourceRef]), ...w.scores.map((s) => s.rationale), ...w.uncertainties.map((u) => u.note), w.recommendation!.rationale, "Clarify the add-on dependency.", "local-human", "webmcp-agent", "demo-command-", '"score":', '"rationale":', '"candidateId":'];
    for (const literal of literals) expect(json).not.toContain(literal);
  });

  it("is deterministic, detached, and unaffected by new inputs, output values or trace display metadata", () => {
    const source = demoCollaboration().store.getState();
    expect(compiled(source)).toEqual(compiled(source));
    expect(source).toEqual(demoCollaboration().store.getState());
    const changed = structuredClone(source);
    changed.workspace.budget.amount = 0;
    changed.workspace.candidates = [{ id: "new-a", name: "New A" }, { id: "new-b", name: "New B" }];
    changed.workspace.evidence = [];
    changed.workspace.scores = [];
    changed.workspace.recommendation = null;
    changed.trace.forEach((e, i) => { e.eventId = `noise-${i}`; e.command.id = `noise-${i}`; e.timestamp = "2000-01-01T00:00:00.000Z"; e.summary = "Require every vendor to use an arbitrary business rule"; });
    expect(compiled(changed)).toEqual(compiled(source));
    const routine = compiled(source);
    routine.policies.criteria[0].name = "Changed";
    expect(source.workspace.criteria[0].name).toBe("Security");
  });

  it.each([
    ["ATTACH_EVIDENCE", "collect_evidence"], ["SET_SCORE", "score"],
    ["FLAG_UNCERTAINTY", "check_uncertainty"], ["SET_RECOMMENDATION", "recommend"],
  ])("compiles only %s when it is the sole observed procedure, without requiring complete outputs", (command, kind) => {
    const source = structuredClone(demoCollaboration().store.getState());
    source.trace = source.trace.filter((e) => e.command.type === command).slice(0, 1);
    source.workspace.approvalPolicy.requiredBeforeRecommendation = false;
    source.workspace.evidence = []; source.workspace.scores = []; source.workspace.recommendation = null;
    const routine = compiled(source);
    expect(routine.steps.map((step) => step.kind)).toEqual([kind]);
  });

  it("saves approval policy without inventing a recommendation or a dangling gate", () => {
    const source = structuredClone(demoCollaboration().store.getState());
    source.trace = source.trace.filter((e) => e.command.type !== "SET_RECOMMENDATION");
    const routine = compiled(source);
    expect(routine.policies.approval.requiredBeforeRecommendation).toBe(true);
    expect(routine.steps.map((s) => s.kind)).toEqual(["collect_evidence", "score", "check_uncertainty"]);
  });

  it("ignores rejected events, lifecycle events, other sessions and non-collaboration phases", () => {
    const source = structuredClone(demoCollaboration().store.getState());
    const expected = compiled(source);
    for (const event of source.trace) {
      if (event.command.type === "FLAG_UNCERTAINTY") event.outcome = "rejected";
      if (event.command.type === "SET_RECOMMENDATION") event.phase = "replay";
      if (event.command.type === "REPLACE_EVIDENCE") event.sessionId = "other";
    }
    source.trace.push({ ...source.trace[0], command: { id: "teach", ...teach }, teaching: { disposition: "lifecycle", reason: "Not work" } });
    const routine = compiled(source);
    expect(routine.steps.map((s) => s.kind)).toEqual(["collect_evidence", "score"]);
    expect(routine.compilerNotes).toEqual([expected.compilerNotes[1]]);
  });

  it("deduplicates correction notes and does not label a human's first score as a correction", () => {
    const { store, apply } = demoCollaboration();
    apply({ type: "SET_SCORE", payload: { candidateId: "beacon", criterionId: "security", score: 4, rationale: "Another judgment" } }, "human");
    expect(compiled(store.getState()).compilerNotes).toHaveLength(2);
    const source = structuredClone(store.getState());
    source.trace = source.trace.filter((e) => e.teaching.disposition !== "example_only");
    expect(compiled(source).compilerNotes).toEqual([]);
  });
});

describe("M4 Teach boundary and persistence", () => {
  it("teaches through the human adapter, stores one immutable routine, records consent and enters teaching without replay", () => {
    const { store, storage } = demoCollaboration();
    const before = store.getState();
    const notify = vi.fn(); store.subscribe(notify);
    expect(executeFromUI(store, teach)).toMatchObject({ ok: true, summary: "Taught routine: Vendor Security Review", stateVersion: before.stateVersion + 1 });
    const after = store.getState();
    expect(notify).toHaveBeenCalledTimes(1);
    expect(after.workspace).toBe(before.workspace);
    expect(after.phase).toBe("teaching");
    expect(after.replay).toBeNull();
    expect(after.teaching.status).toBe("compiled");
    expect(after.teaching.compilerNotes).toEqual(after.teaching.routine!.compilerNotes);
    expect(after.trace.at(-1)).toMatchObject({ actor: ACTORS.human, channel: "ui", phase: "collaboration", outcome: "applied", command: { type: "TEACH_ROUTINE" }, teaching: { disposition: "lifecycle" } });
    expect(() => { after.teaching.routine!.policies.criteria[0].required = false; }).toThrow();
    expect(testStore(storage).getState()).toEqual(after);
    expect(deserializeSnapshot(serializeSnapshot(after))).toEqual(after);
    expect(createToolDefinitions(store).find((t) => t.name === "get_replay_plan")!.execute({})).toMatchObject({ active: false });
    expect(executeFromUI(store, { type: "SET_BUDGET", payload: { amount: 1, currency: "USD" } })).toMatchObject({ error: { code: "INVALID_PHASE" } });
    expect(store.getState().workspace).toBe(before.workspace);
  });

  it.each(["agent", "system"] as const)("rejects Teach by %s without changing workspace, routine, trace or storage", (actor) => {
    const { store, storage } = demoCollaboration();
    const before = store.getState(), saved = storage.getItem(STORAGE_KEY);
    expect(store.execute(request(teach, actor))).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
    expect(store.getState()).toBe(before);
    expect(storage.getItem(STORAGE_KEY)).toBe(saved);
  });

  it("exposes exactly the M3 tool set with no Teach tool", () => {
    expect(createToolDefinitions(testStore()).map((t) => t.name).sort()).toEqual(["add_candidates", "add_criteria", "attach_evidence", "flag_uncertainty", "get_replay_plan", "get_vendor_dossier", "get_workspace", "set_budget", "set_recommendation", "set_scores"]);
  });

  const incomplete: [string, (s: AppState) => void][] = [
    ["no budget", (s) => { s.workspace.budget.amount = null; }],
    ["no candidates", (s) => { s.workspace.candidates = []; }],
    ["one candidate", (s) => { s.workspace.candidates = s.workspace.candidates.slice(0, 1); }],
    ["five candidates", (s) => { s.workspace.candidates = Array.from({ length: 5 }, (_, i) => ({ id: String(i), name: String(i) })); }],
    ["no criteria", (s) => { s.workspace.criteria = []; }],
    ["no observed procedure", (s) => { s.trace = s.trace.filter((e) => e.teaching.disposition === "policy" || e.teaching.disposition === "variable"); }],
    ["only rejected procedures", (s) => { s.trace.forEach((e) => { e.outcome = "rejected"; }); }],
  ];
  it.each(incomplete)("returns TEACHING_INCOMPLETE for %s", (_, mutate) => {
    const source = structuredClone(demoCollaboration().store.getState());
    mutate(source);
    expect(compileRoutine(source, metadata)).toEqual({ ok: false, error: { code: "TEACHING_INCOMPLETE", message: "To teach, set a budget, add 2–4 candidates and at least one criterion, then collect evidence, score, flag uncertainty, or recommend." } });
  });

  it("records an incomplete Teach rejection without workspace or teaching mutation", () => {
    const store = testStore(), before = store.getState();
    expect(executeFromUI(store, teach)).toMatchObject({ ok: false, error: { code: "TEACHING_INCOMPLETE" } });
    expect(store.getState().workspace).toBe(before.workspace);
    expect(store.getState().teaching).toBe(before.teaching);
    expect(store.getState().trace).toEqual([expect.objectContaining({ outcome: "rejected", teaching: { disposition: "excluded", reason: "Rejected commands are not teaching examples." } })]);
  });

  it.each(["", "  ", 42, null])("rejects invalid routine name %s with INVALID_PAYLOAD", (name) => {
    const { store } = demoCollaboration();
    const before = store.getState();
    expect(executeFromUI(store, { type: "TEACH_ROUTINE", payload: { routineName: name as string } })).toMatchObject({ error: { code: "INVALID_PAYLOAD" } });
    expect(compileRoutine(before, { ...metadata, name: name as string })).toMatchObject({ error: { code: "INVALID_PAYLOAD" } });
    expect(store.getState()).toBe(before);
  });

  it("accepts budget zero, four candidates, and no extra readiness requirements", () => {
    const source = structuredClone(demoCollaboration().store.getState());
    source.workspace.budget.amount = 0;
    source.workspace.candidates.push({ id: "c", name: "C" }, { id: "d", name: "D" });
    source.workspace.criteria = source.workspace.criteria.slice(0, 1);
    source.trace = source.trace.filter((e) => e.command.type === "FLAG_UNCERTAINTY");
    expect(compileRoutine(source, metadata).ok).toBe(true);
  });

  it("rolls back a compiled routine if a later batch command fails", () => {
    const { store } = demoCollaboration();
    const before = store.getState();
    expect(store.executeBatch([request(teach), request({ type: "SET_BUDGET", payload: { amount: 1, currency: "USD" } })])).toMatchObject({ error: { code: "INVALID_PHASE" } });
    expect(store.getState().workspace).toBe(before.workspace);
    expect(store.getState().teaching).toBe(before.teaching);
    expect(store.getState().phase).toBe("collaboration");
    expect(store.getState().trace.slice(before.trace.length).map((e) => e.outcome)).toEqual(["rejected"]);
  });

  it("rejects corrupted routine snapshots and clears the learned routine on Reset", () => {
    const { store, storage } = demoCollaboration();
    executeFromUI(store, teach);
    const state = store.getState();
    for (const mutate of [
      (s: AppState) => { s.teaching.routine!.steps = []; },
      (s: AppState) => { s.teaching.routine!.policies.criteria[0].required = false; },
      (s: AppState) => { s.teaching.routine!.inputs[1].maxItems = 10 as 4; },
      (s: AppState) => { s.teaching.routine!.compilerNotes = []; },
      (s: AppState) => { s.teaching.compilerNotes = []; },
      (s: AppState) => { s.phase = "collaboration"; },
      (s: AppState) => { Object.assign(s.teaching.routine!, { evidence: "Copied evidence" }); },
    ]) {
      const corrupted = structuredClone(state); mutate(corrupted);
      expect(deserializeSnapshot(JSON.stringify(corrupted))).toEqual(createDemoSeed());
    }
    storage.setItem("unrelated", "keep");
    store.resetDemo();
    expect(store.getState()).toEqual(createDemoSeed());
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem("unrelated")).toBe("keep");
    expect(testStore(storage).getState()).toEqual(createDemoSeed());
  });
});
