import { describe, expect, it, vi } from "vitest";
import type { Command, CommandPayloads } from "../src/core/domain/commands";
import { ACTORS, type ActorKind, type AppState, type CommandResult } from "../src/core/domain/types";
import { createDemoSeed } from "../src/core/demo/seed";
import { getVendorDossier } from "../src/core/demo/vendor-dossiers";
import { getReplayPlan, validateReplayReadiness } from "../src/core/replay/replay-engine";
import { createOnceStore, type OnceStore } from "../src/core/store/once-store";
import { executeFromUI } from "../src/core/store/ui-commands";
import { deserializeSnapshot, serializeSnapshot, STORAGE_KEY } from "../src/core/persistence/local-storage";
import { createToolDefinitions } from "../src/webmcp/tool-definitions";
import { demoCollaboration } from "./fixtures/demo-collaboration";
import { memoryStorage, testStore } from "./helpers";

let id = 0;
function command(store: OnceStore, action: Command, actor: ActorKind = "agent") {
  return store.execute({ ...action, id: `replay-command-${++id}`, actor: ACTORS[actor], channel: actor === "human" ? "ui" : actor === "agent" ? "webmcp" : "system", phase: store.getState().phase, ...(store.getState().replay ? { replayRunId: store.getState().replay!.runId } : {}) });
}
function tool(store: OnceStore, name: string, input: unknown): CommandResult {
  return createToolDefinitions(store).find((t) => t.name === name)!.execute(input) as CommandResult;
}
function teach(store: OnceStore) {
  expect(executeFromUI(store, { type: "TEACH_ROUTINE", payload: { routineName: "Vendor Security Review" } }).ok).toBe(true);
}
function start(store: OnceStore, overrides: Partial<CommandPayloads["START_REPLAY"]> = {}) {
  return executeFromUI(store, { type: "START_REPLAY", payload: { routineId: store.getState().teaching.routine?.id ?? "missing", budget: 18000, currency: "USD", candidates: [{ candidateId: "northwind", name: "Northwind AI" }, { candidateId: "orchid", name: "Orchid Systems" }], ...overrides } });
}
function setup(approval = true) {
  const fixture = demoCollaboration();
  if (!approval) fixture.apply({ type: "SET_APPROVAL_POLICY", payload: { requiredBeforeRecommendation: false } }, "human");
  teach(fixture.store);
  expect(start(fixture.store).ok).toBe(true);
  return fixture;
}
function evidenceItems(store: OnceStore) {
  return store.getState().workspace.candidates.flatMap((candidate) => {
    const dossier = getVendorDossier(candidate.name);
    if (!dossier.ok) throw new Error("Fixture missing");
    return store.getState().workspace.criteria.map((criterion, i) => ({ candidateId: candidate.id, criterionId: criterion.id, summary: dossier.dossier.facts[i].statement, sourceRef: dossier.dossier.facts[i].sourceRef, confidence: "high" }));
  });
}
function scoreItems(store: OnceStore) {
  return store.getState().workspace.candidates.flatMap((candidate) => store.getState().workspace.criteria.map((criterion) => ({ candidateId: candidate.id, criterionId: criterion.id, score: candidate.id === "orchid" && criterion.required ? 2 : 4, rationale: `New-run assessment of ${candidate.name} ${criterion.name}.` })));
}
function finishWork(store: OnceStore) {
  expect(tool(store, "attach_evidence", { items: evidenceItems(store) }).ok).toBe(true);
  expect(tool(store, "flag_uncertainty", { candidateId: "orchid", note: "SOC 2 Type II is not listed in the current dossier." }).ok).toBe(true);
  expect(tool(store, "set_scores", { items: scoreItems(store) }).ok).toBe(true);
}
function decide(store: OnceStore, decision: "approved" | "rejected") {
  const run = store.getState().replay!;
  return executeFromUI(store, { type: "RECORD_APPROVAL", payload: { runId: run.runId, gateId: run.approval.gateId!, decision } });
}
function recommend(store: OnceStore, candidateId = "northwind") {
  return tool(store, "set_recommendation", { candidateId, rationale: "Current evidence supports this eligible vendor within the new budget." });
}

describe("M5 replay readiness — M4 Teach remains permissive", () => {
  function partial(kinds: string[], required = false) {
    const storage = memoryStorage(), store = testStore(storage);
    command(store, { type: "SET_BUDGET", payload: { amount: 24000, currency: "USD" } });
    for (const candidateId of ["a", "b"]) command(store, { type: "ADD_CANDIDATE", payload: { candidateId, name: candidateId } });
    command(store, { type: "ADD_CRITERION", payload: { criterionId: "security", name: "Security", priority: 1, required: false } });
    if (kinds.includes("collect_evidence")) command(store, { type: "ATTACH_EVIDENCE", payload: { evidenceId: "old-evidence", candidateId: "a", criterionId: "security", summary: "Old evidence", sourceRef: "old-source", confidence: "high" } });
    if (kinds.includes("score")) command(store, { type: "SET_SCORE", payload: { candidateId: "a", criterionId: "security", score: 4, rationale: "Old score" } });
    if (kinds.includes("check_uncertainty")) command(store, { type: "FLAG_UNCERTAINTY", payload: { uncertaintyId: "old-u", note: "Old uncertainty" } });
    if (kinds.includes("recommend")) command(store, { type: "SET_RECOMMENDATION", payload: { candidateId: "a", rationale: "Old recommendation" } });
    if (required) command(store, { type: "SET_CRITERION_REQUIRED", payload: { criterionId: "security", required: true } }, "human");
    teach(store);
    return { store, storage };
  }

  it("teaches and persists scoring-only, but rejects replay without changing workspace, routine, or replay", () => {
    const { store, storage } = partial(["score"]);
    const before = store.getState();
    expect(before.teaching.routine!.steps.map((s) => s.kind)).toEqual(["score"]);
    expect(testStore(storage).getState()).toEqual(before);
    expect(start(store)).toMatchObject({ ok: false, error: { code: "REPLAY_ROUTINE_INCOMPLETE", message: "Replay can’t start because scoring was learned without evidence collection." } });
    expect(store.getState().workspace).toBe(before.workspace);
    expect(store.getState().replay).toBe(before.replay);
    expect(store.getState().teaching).toBe(before.teaching);
    expect(store.getState().phase).toBe("teaching");
    expect(store.getState().trace.at(-1)).toMatchObject({ actor: ACTORS.human, outcome: "rejected", teaching: { disposition: "excluded" } });
    expect(testStore(storage).getState()).toEqual(store.getState());
  });

  it("rejects recommendation with required criteria but no scoring; injects no missing procedure", () => {
    const { store } = partial(["recommend"], true);
    const before = store.getState();
    expect(start(store)).toMatchObject({ error: { code: "REPLAY_ROUTINE_INCOMPLETE", message: "Replay can’t start because recommendation requires scoring to evaluate required criteria." } });
    expect(store.getState().teaching.routine!.steps.map((s) => s.kind)).toEqual(["recommend"]);
    expect(store.getState().workspace).toBe(before.workspace);
    expect(store.getState().replay).toBeNull();
  });

  it.each([
    [["collect_evidence", "score"], false],
    [["collect_evidence", "score", "recommend"], true],
    [["collect_evidence"], true],
    [["recommend"], false],
    [["check_uncertainty"], true],
  ] as const)("accepts exactly the learned procedures %s with required=%s", (kinds, required) => {
    const { store } = partial([...kinds], required);
    const routine = store.getState().teaching.routine!;
    expect(validateReplayReadiness(routine)).toBeNull();
    expect(start(store).ok).toBe(true);
    expect(store.getState().teaching.routine).toBe(routine);
    expect(routine.steps.map((s) => s.kind)).toEqual(kinds);
  });

  it("completes evidence-only work without inventing scores, approval, or recommendation", () => {
    const { store } = partial(["collect_evidence"]);
    start(store);
    expect(tool(store, "set_scores", { items: [{ candidateId: "northwind", criterionId: "criterion-1", score: 4, rationale: "Unlearned" }] })).toMatchObject({ error: { code: "REPLAY_ACTION_NOT_ALLOWED" } });
    tool(store, "attach_evidence", { items: evidenceItems(store) });
    expect(store.getState().replay?.status).toBe("completed");
    expect(store.getState().workspace.scores).toEqual([]);
    expect(store.getState().workspace.recommendation).toBeNull();
  });
});

describe("M5 new inputs, immutable policy and plan", () => {
  it("cannot start without a learned routine", () => {
    const store = testStore(), before = store.getState();
    expect(start(store)).toMatchObject({ error: { code: "ROUTINE_NOT_FOUND" } });
    expect(store.getState().workspace).toBe(before.workspace);
    expect(store.getState().replay).toBeNull();
  });

  it("replaces variables and every old output while retaining final policy and example-only notes", () => {
    const { store } = demoCollaboration(); teach(store);
    const before = store.getState(); start(store);
    const after = store.getState(), w = after.workspace;
    expect(after.phase).toBe("replay");
    expect(after.replay?.status).toBe("running");
    expect(w.budget).toEqual({ amount: 18000, currency: "USD" });
    expect(w.candidates).toEqual([{ id: "northwind", name: "Northwind AI" }, { id: "orchid", name: "Orchid Systems" }]);
    expect(w.criteria).toEqual(before.teaching.routine!.policies.criteria.map(({ routineCriterionId, ...c }) => ({ id: routineCriterionId, ...c })));
    expect(w.approvalPolicy).toEqual({ requiredBeforeRecommendation: true });
    expect([w.evidence, w.scores, w.uncertainties]).toEqual([[], [], []]);
    expect(w.recommendation).toBeNull();
    expect(after.teaching).toBe(before.teaching);
    expect(after.teaching.compilerNotes).toHaveLength(2);
    for (const literal of ["Aegis Cloud", "BeaconStack", "24000", "Enterprise add-on"]) expect(JSON.stringify(w)).not.toContain(literal);
    expect(after.trace.at(-1)).toMatchObject({ command: { type: "START_REPLAY" }, actor: ACTORS.human, channel: "ui", phase: "teaching", replayRunId: after.replay?.runId });
  });

  it.each([
    { budget: -1 }, { budget: Infinity }, { currency: "EUR" }, { candidates: [] },
    { candidates: [{ candidateId: "n", name: " " }, { candidateId: "o", name: "O" }] },
    { candidates: [{ candidateId: "n", name: "N" }, { candidateId: "n", name: "O" }] },
    { candidates: [{ candidateId: "n", name: "N" }, { candidateId: "o", name: " n " }] },
    { routineId: "other" },
  ])("rejects invalid start inputs %j atomically", (inputs) => {
    const { store } = demoCollaboration(); teach(store);
    const before = store.getState();
    expect(start(store, inputs as Partial<CommandPayloads["START_REPLAY"]>).ok).toBe(false);
    expect(store.getState().workspace).toBe(before.workspace);
    expect(store.getState().teaching).toBe(before.teaching);
    expect(store.getState().replay).toBeNull();
  });

  it("accepts zero budget and four new candidates", () => {
    const { store } = demoCollaboration(); teach(store);
    expect(start(store, { budget: 0, candidates: Array.from({ length: 4 }, (_, i) => ({ candidateId: `new-${i}`, name: `Vendor ${i}` })) }).ok).toBe(true);
    expect(getReplayPlan(store.getState())).toMatchObject({ progress: { total: 12 }, bindings: { budget: { amount: 0 } } });
  });

  it("returns a detached read-only replay plan with work, policy, bindings and constraints", () => {
    const { store } = setup();
    const before = store.getState(), planTool = createToolDefinitions(store).find((t) => t.name === "get_replay_plan")!;
    expect(planTool.annotations?.readOnlyHint).toBe(true);
    const plan = planTool.execute({}) as ReturnType<typeof getReplayPlan>;
    expect(plan).toMatchObject({ active: true, phase: "replay", status: "running", routineName: "Vendor Security Review", currentStep: "collect_evidence", nextActions: ["attach_evidence", "flag_uncertainty"], progress: { total: 6, evidence: 0, scores: 0 }, approval: { decision: "pending" }, completionRequirements: ["evidence_exists_for_every_candidate_criterion_pair", "score_exists_for_every_candidate_criterion_pair", "human_approval_before_recommendation", "recommendation_exists"] });
    if (plan.active) { plan.bindings.candidates[0].name = "Tampered"; plan.fixedPolicy.criteria[0].required = false; }
    expect(store.getState()).toBe(before);
    expect(store.getState().workspace.candidates[0].name).toBe("Northwind AI");
    expect(store.getState().workspace.criteria[0].required).toBe(true);
  });

  it("rejects fixed-input, fixed-policy and human workspace changes during replay", () => {
    const { store } = setup(), before = store.getState().workspace;
    for (const action of [
      { type: "SET_BUDGET", payload: { amount: 1, currency: "USD" } },
      { type: "ADD_CANDIDATE", payload: { candidateId: "other", name: "Other" } },
      { type: "ADD_CRITERION", payload: { criterionId: "other", name: "Other", priority: 1, required: false } },
    ] satisfies Command[]) expect(command(store, action)).toMatchObject({ error: { code: "REPLAY_ACTION_NOT_ALLOWED" } });
    for (const action of [
      { type: "SET_APPROVAL_POLICY", payload: { requiredBeforeRecommendation: false } },
      { type: "SET_CRITERION_REQUIRED", payload: { criterionId: "criterion-1", required: false } },
      { type: "SET_CRITERION_PRIORITY", payload: { criterionId: "criterion-1", priority: 3 } },
      { type: "ATTACH_EVIDENCE", payload: { evidenceId: "human", candidateId: "northwind", criterionId: "criterion-1", summary: "Human work", sourceRef: "northwind-security", confidence: "high" } },
    ] satisfies Command[]) expect(command(store, action, "human")).toMatchObject({ error: { code: "REPLAY_LOCKED" } });
    expect(store.getState().workspace).toBe(before);
  });
});

describe("M5 progress and human approval enforcement", () => {
  it("counts distinct matrix pairs, not evidence records, and requires all six scores", () => {
    const { store } = setup(), evidence = evidenceItems(store);
    tool(store, "attach_evidence", { items: [...evidence.slice(0, 5), evidence[0]] });
    expect(getReplayPlan(store.getState())).toMatchObject({ currentStep: "collect_evidence", progress: { evidence: 5, total: 6 } });
    tool(store, "attach_evidence", { items: evidence.slice(5) });
    expect(getReplayPlan(store.getState())).toMatchObject({ currentStep: "score", progress: { evidence: 6 } });
    const scores = scoreItems(store);
    tool(store, "set_scores", { items: scores.slice(0, 5) });
    expect(store.getState().replay?.status).toBe("running");
    expect(getReplayPlan(store.getState())).toMatchObject({ progress: { scores: 5 } });
    const result = tool(store, "set_scores", { items: scores.slice(5) });
    expect(result).toMatchObject({ ok: true, replay: { status: "awaiting_approval" } });
    expect(store.getState().replay?.stepStatus.find((s) => s.stepId === "check_uncertainty")?.status).toBe("skipped");
    expect(store.getState().trace.at(-1)).toMatchObject({ actor: ACTORS.system, channel: "system", phase: "replay", outcome: "applied", command: { type: "REQUEST_APPROVAL" }, summary: "Replay paused: human approval required" });
    expect(getReplayPlan(store.getState())).toMatchObject({ nextActions: [], currentStep: "approval" });
  });

  it("requires evidence for the same pair and rolls back a partially valid score batch", () => {
    const { store } = setup();
    tool(store, "attach_evidence", { items: evidenceItems(store).slice(0, 1) });
    const before = store.getState();
    expect(tool(store, "set_scores", { items: scoreItems(store).slice(0, 2) })).toMatchObject({ error: { code: "EVIDENCE_REQUIRED" } });
    expect(store.getState().workspace).toBe(before.workspace);
    expect(store.getState().replay).toBe(before.replay);
    expect(store.getState().trace.slice(before.trace.length)).toHaveLength(1);
    expect(store.getState().trace.at(-1)?.outcome).toBe("rejected");
  });

  it("rolls back automatic approval if a later batch item fails", () => {
    const { store } = setup();
    tool(store, "attach_evidence", { items: evidenceItems(store) });
    const before = store.getState();
    expect(tool(store, "set_scores", { items: [...scoreItems(store), { ...scoreItems(store)[0], candidateId: "missing" }] }).ok).toBe(false);
    expect(store.getState().workspace).toBe(before.workspace);
    expect(store.getState().replay).toBe(before.replay);
    expect(store.getState().trace.slice(before.trace.length).map((e) => e.command.type)).toEqual(["SET_SCORE"]);
  });

  it("returns REQUIRED_CRITERION_FAILED before APPROVAL_REQUIRED and records unchanged-workspace rejections", () => {
    const { store } = setup(); finishWork(store);
    const before = store.getState();
    expect(recommend(store, "orchid")).toMatchObject({ ok: false, error: { code: "REQUIRED_CRITERION_FAILED" } });
    expect(recommend(store)).toMatchObject({ ok: false, error: { code: "APPROVAL_REQUIRED", message: "Human approval is required before setting the final recommendation." }, replay: { status: "awaiting_approval" } });
    expect(store.getState().workspace).toBe(before.workspace);
    expect(store.getState().replay).toBe(before.replay);
    expect(store.getState().trace.slice(-2).map((e) => [e.actor.kind, e.outcome, e.error?.code])).toEqual([["agent", "rejected", "REQUIRED_CRITERION_FAILED"], ["agent", "rejected", "APPROVAL_REQUIRED"]]);
  });

  it("blocks an early eligible recommendation even while matrices are incomplete", () => {
    const { store } = setup();
    tool(store, "attach_evidence", { items: evidenceItems(store).slice(0, 1) });
    tool(store, "set_scores", { items: scoreItems(store).slice(0, 1) });
    expect(recommend(store)).toMatchObject({ error: { code: "APPROVAL_REQUIRED" }, replay: { status: "running" } });
    expect(store.getState().workspace.recommendation).toBeNull();
    expect(store.getState().trace.some((e) => e.command.type === "REQUEST_APPROVAL")).toBe(false);
  });

  it("human approval resumes; only recommendation can change the reviewed workspace; completion is automatic", () => {
    const { store } = setup(); finishWork(store);
    const reviewed = store.getState().workspace;
    expect(decide(store, "approved")).toMatchObject({ ok: true, replay: { status: "running", next: "recommend" } });
    expect(store.getState().trace.at(-1)).toMatchObject({ actor: ACTORS.human, channel: "ui", command: { type: "RECORD_APPROVAL" }, summary: "Approved final recommendation · replay resumed" });
    expect(getReplayPlan(store.getState())).toMatchObject({ nextActions: ["set_recommendation"] });
    expect(tool(store, "set_scores", { items: [scoreItems(store)[0]] })).toMatchObject({ error: { code: "REPLAY_LOCKED" } });
    expect(tool(store, "attach_evidence", { items: [evidenceItems(store)[0]] })).toMatchObject({ error: { code: "REPLAY_LOCKED" } });
    expect(tool(store, "flag_uncertainty", { note: "Changed after approval" })).toMatchObject({ error: { code: "REPLAY_LOCKED" } });
    expect(store.getState().workspace).toBe(reviewed);
    expect(recommend(store, "orchid")).toMatchObject({ error: { code: "REQUIRED_CRITERION_FAILED" } });
    const notify = vi.fn(); store.subscribe(notify);
    expect(recommend(store)).toMatchObject({ ok: true, replay: { status: "completed" } });
    expect(notify).toHaveBeenCalledTimes(1);
    expect(store.getState().phase).toBe("complete");
    expect(store.getState().replay?.stepStatus.every((s) => s.status === "complete")).toBe(true);
    expect(store.getState().trace.slice(-2).map((e) => [e.command.type, e.actor.kind, e.phase])).toEqual([["SET_RECOMMENDATION", "agent", "replay"], ["COMPLETE_REPLAY", "system", "replay"]]);
    expect(recommend(store)).toMatchObject({ error: { code: "INVALID_REPLAY_STATE" } });
    expect(getReplayPlan(store.getState())).toMatchObject({ status: "completed", nextActions: [] });
  });

  it.each(["approved", "rejected"] as const)("does not let agent/system record %s", (decision) => {
    const { store } = setup(); finishWork(store);
    const before = store.getState(), run = before.replay!;
    for (const actor of ["agent", "system"] as const) expect(command(store, { type: "RECORD_APPROVAL", payload: { runId: run.runId, gateId: run.approval.gateId!, decision } }, actor)).toMatchObject({ error: { code: "UNAUTHORIZED" } });
    expect(store.getState()).toBe(before);
  });

  it("rejects premature, stale, and repeated human approval and premature system transitions", () => {
    const { store } = setup();
    expect(decide(store, "approved")).toMatchObject({ error: { code: "INVALID_REPLAY_STATE" } });
    const run = store.getState().replay!;
    expect(command(store, { type: "REQUEST_APPROVAL", payload: { runId: run.runId, gateId: run.approval.gateId!, message: "Too soon" } }, "system")).toMatchObject({ error: { code: "INVALID_REPLAY_STATE" } });
    expect(command(store, { type: "COMPLETE_REPLAY", payload: { runId: run.runId } }, "system")).toMatchObject({ error: { code: "INVALID_REPLAY_STATE" } });
    finishWork(store);
    for (const payload of [{ runId: "stale", gateId: run.approval.gateId!, decision: "approved" }, { runId: run.runId, gateId: "stale", decision: "approved" }] as const) expect(executeFromUI(store, { type: "RECORD_APPROVAL", payload })).toMatchObject({ error: { code: "INVALID_REPLAY_STATE" } });
    decide(store, "approved");
    expect(decide(store, "approved")).toMatchObject({ error: { code: "INVALID_REPLAY_STATE" } });
    expect(store.getState().trace.filter((e) => e.command.type === "REQUEST_APPROVAL" && e.outcome === "applied")).toHaveLength(1);
  });

  it("human rejection is terminal and blocks every agent mutation", () => {
    const { store } = setup(); finishWork(store);
    const before = store.getState().workspace;
    expect(decide(store, "rejected")).toMatchObject({ ok: true, replay: { status: "rejected" } });
    for (const [name, input] of [
      ["set_budget", { amount: 0, currency: "USD" }], ["add_candidates", { candidates: [{ name: "Another" }] }],
      ["add_criteria", { criteria: [{ name: "Other", priority: 4, required: false }] }],
      ["attach_evidence", { items: evidenceItems(store).slice(0, 1) }], ["set_scores", { items: scoreItems(store).slice(0, 1) }],
      ["flag_uncertainty", { note: "Try again" }], ["set_recommendation", { candidateId: "orchid", rationale: "Try again" }],
    ] as const) expect(tool(store, name, input)).toMatchObject({ error: { code: "INVALID_REPLAY_STATE" } });
    expect(decide(store, "approved").ok).toBe(false);
    expect(store.getState().workspace).toBe(before);
    expect(store.getState().workspace.recommendation).toBeNull();
    expect(getReplayPlan(store.getState())).toMatchObject({ status: "rejected", nextActions: [] });
  });

  it("requires learned pre-recommendation steps even without an approval policy", () => {
    const { store } = setup(false);
    tool(store, "attach_evidence", { items: evidenceItems(store).slice(0, 1) });
    tool(store, "set_scores", { items: scoreItems(store).slice(0, 1) });
    expect(recommend(store)).toMatchObject({ error: { code: "REPLAY_INCOMPLETE" } });
    finishWork(store);
    expect(store.getState().replay?.status).toBe("running");
    expect(recommend(store).ok).toBe(true);
    expect(store.getState().replay?.status).toBe("completed");
    expect(store.getState().trace.some((e) => e.command.type === "REQUEST_APPROVAL")).toBe(false);
  });

  it("keeps exactly ten tools with no human-only action schemas", () => {
    const { store } = setup();
    const tools = createToolDefinitions(store);
    expect(tools.map((t) => t.name).sort()).toEqual(["add_candidates", "add_criteria", "attach_evidence", "flag_uncertainty", "get_replay_plan", "get_vendor_dossier", "get_workspace", "set_budget", "set_recommendation", "set_scores"]);
    for (const t of tools) for (const field of ["actor", "channel", "decision", "routineId", "gateId", "runId"]) expect(JSON.stringify(t.inputSchema)).not.toContain(`"${field}"`);
  });
});

describe("M5 persistence and deterministic reset", () => {
  it.each(["running", "awaiting_approval", "approved", "rejected", "completed"])("restores %s with policy, outputs, progress, approval and trace", (stage) => {
    const { store, storage } = setup();
    if (stage !== "running") finishWork(store);
    if (stage === "approved" || stage === "completed") decide(store, "approved");
    if (stage === "rejected") decide(store, "rejected");
    if (stage === "completed") recommend(store);
    const before = store.getState();
    expect(deserializeSnapshot(serializeSnapshot(before))).toEqual(before);
    expect(testStore(storage).getState()).toEqual(before);
  });

  it("can resume after reloading at the gate without duplicate approval events", () => {
    const { store, storage } = setup(); finishWork(store);
    let next = 0;
    const restored = createOnceStore({ storage, newId: () => `reload-${++next}`, now: () => "2026-09-02T13:00:00.000Z" });
    expect(recommend(restored)).toMatchObject({ error: { code: "APPROVAL_REQUIRED" } });
    expect(decide(restored, "approved").ok).toBe(true);
    expect(recommend(restored).ok).toBe(true);
    expect(restored.getState().replay?.status).toBe("completed");
    expect(restored.getState().trace.filter((e) => e.command.type === "REQUEST_APPROVAL")).toHaveLength(1);
    expect(deserializeSnapshot(serializeSnapshot(restored.getState()))).toEqual(restored.getState());
  });

  it("rejects inconsistent or forged replay snapshots instead of restoring an approval bypass", () => {
    const { store } = setup(); finishWork(store);
    for (const mutate of [
      (s: AppState) => { s.replay!.approval.decision = "approved"; },
      (s: AppState) => { s.replay!.status = "running"; },
      (s: AppState) => { s.replay!.stepStatus[0].status = "pending"; },
      (s: AppState) => { s.replay!.bindings.budget.amount = 1; },
      (s: AppState) => { s.replay!.runId = "other"; },
      (s: AppState) => { s.workspace.criteria[0].required = false; },
      (s: AppState) => { s.workspace.evidence = []; },
      (s: AppState) => { s.teaching.routine!.steps.pop(); },
      (s: AppState) => { s.replay = null; },
      (s: AppState) => { s.trace.pop(); },
    ]) {
      const corrupted = structuredClone(store.getState()); mutate(corrupted);
      expect(deserializeSnapshot(JSON.stringify(corrupted))).toEqual(createDemoSeed());
    }
    decide(store, "approved");
    const forged = structuredClone(store.getState());
    const event = forged.trace.find((e) => e.command.type === "RECORD_APPROVAL")!;
    event.actor = ACTORS.agent; event.channel = "webmcp";
    expect(deserializeSnapshot(JSON.stringify(forged))).toEqual(createDemoSeed());
  });

  it("reset clears routine, replay, outputs and trace while preserving unrelated storage", () => {
    const { store, storage } = setup(); finishWork(store);
    storage.setItem("unrelated", "keep");
    store.resetDemo();
    expect(store.getState()).toEqual(createDemoSeed());
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem("unrelated")).toBe("keep");
    expect(testStore(storage).getState()).toEqual(createDemoSeed());
    expect(tool(store, "get_replay_plan", {})).toMatchObject({ active: false });
  });

  it("runs the complete deterministic loop twice from Reset", () => {
    const storage = memoryStorage();
    let first: AppState | undefined;
    for (let run = 0; run < 2; run++) {
      const { store } = demoCollaboration(storage); teach(store); start(store); finishWork(store); decide(store, "approved"); recommend(store);
      const state = store.getState();
      expect(state.replay?.status).toBe("completed");
      expect(state.trace.map((e) => e.sequence)).toEqual(state.trace.map((_, i) => i + 1));
      expect(state.trace.filter((e) => e.phase === "replay").every((e) => e.replayRunId === state.replay!.runId)).toBe(true);
      if (first) {
        // Tool-created entity IDs are metadata, not deterministic procedure outputs.
        const outputs = (s: AppState) => ({ ...s.workspace, evidence: s.workspace.evidence.map((e) => ({ ...e, id: "metadata" })), uncertainties: s.workspace.uncertainties.map((u) => ({ ...u, id: "metadata" })) });
        expect(outputs(state)).toEqual(outputs(first));
        expect(state.replay).toEqual(first.replay);
      }
      first = state;
      store.resetDemo();
    }
  });
});
