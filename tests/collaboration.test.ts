import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createToolDefinitions } from "../src/webmcp/tool-definitions";
import { executeFromUI } from "../src/core/store/ui-commands";
import { memoryStorage, testStore } from "./helpers";

function session(storage = memoryStorage()) {
  const store = testStore(storage);
  const tools = createToolDefinitions(store);
  const call = (name: string, input: unknown) => tools.find((tool) => tool.name === name)!.execute(input);
  call("set_budget", { amount: 24000, currency: "USD" });
  call("add_candidates", { candidates: [{ name: "Aegis Cloud" }, { name: "BeaconStack" }] });
  call("add_criteria", { criteria: ["Security", "Integration", "Cost"].map((name, i) => ({ name, priority: i + 1, required: false })) });
  const w = store.getState().workspace;
  const pairs = w.candidates.flatMap((candidate) => w.criteria.map((criterion) => ({ candidateId: candidate.id, criterionId: criterion.id })));
  return { store, tools, call, pairs, storage };
}

describe("M3 complete collaboration", () => {
  it("matches every approved schema and description exactly", () => {
    const doc = readFileSync("docs/WEBMCP.md", "utf8");
    for (const tool of createToolDefinitions(testStore())) {
      const section = doc.split(`\u0060${tool.name}\u0060`)[1].split("\n### ")[0];
      const schema = JSON.parse(section.match(/```json\n([\s\S]*?)\n```/)![1]);
      expect(tool.inputSchema).toEqual(schema);
      expect(section).toContain(`> ${tool.description}`);
    }
  });

  it("completes the demo through tools and human corrections with persistence and reset", () => {
    const { store, call, pairs, storage } = session();
    const w = store.getState().workspace;
    const dossierResult = call("get_vendor_dossier", { vendorNames: w.candidates.map((c) => c.name) }) as { vendors: { ok: true; dossier: { facts: { sourceRef: string; statement: string }[] } }[] };
    const items = pairs.map((pair, i) => ({ ...pair, summary: dossierResult.vendors[Math.floor(i / 3)].dossier.facts[i % 3].statement, sourceRef: dossierResult.vendors[Math.floor(i / 3)].dossier.facts[i % 3].sourceRef, confidence: "high" }));
    const notify = vi.fn(); store.subscribe(notify);
    expect(call("attach_evidence", { items })).toMatchObject({ ok: true, eventIds: expect.any(Array) });
    expect(notify).toHaveBeenCalledTimes(1);
    expect(store.getState().trace.slice(-6).every((e) => e.command.type === "ATTACH_EVIDENCE" && e.actor.kind === "agent")).toBe(true);
    expect(call("set_scores", { items: pairs.map((pair) => ({ ...pair, score: 4, rationale: "Strong fit with the demo facts." })) })).toMatchObject({ ok: true });
    expect(call("flag_uncertainty", { note: "Confirm add-on scope before purchase." })).toMatchObject({ ok: true });
    expect(call("set_recommendation", { candidateId: w.candidates[0].id, rationale: "Included security and provisioning capabilities." })).toMatchObject({ ok: true });
    const security = w.criteria[0].id;
    const evidence = store.getState().workspace.evidence[3];
    const corrections = [
      { type: "SET_CRITERION_REQUIRED", payload: { criterionId: security, required: true } },
      { type: "SET_CRITERION_PRIORITY", payload: { criterionId: security, priority: 2 } },
      { type: "SET_CRITERION_PRIORITY", payload: { criterionId: security, priority: 1 } },
      { type: "SET_APPROVAL_POLICY", payload: { requiredBeforeRecommendation: true } },
      { type: "REPLACE_EVIDENCE", payload: { evidenceId: evidence.id, summary: "SAML SSO requires the Enterprise add-on.", sourceRef: "beacon-security", confidence: "high" } },
      { type: "SET_SCORE", payload: { ...pairs[3], score: 3, rationale: "Meets with the Enterprise add-on." } },
    ] as const;
    for (const correction of corrections) expect(executeFromUI(store, correction).ok).toBe(true);
    expect(store.getState().trace.slice(-6).every((e) => e.actor.kind === "human" && e.channel === "ui")).toBe(true);
    expect(store.getState().workspace.scores).toHaveLength(6);
    expect(store.getState().workspace.evidence).toHaveLength(6);
    expect(store.getState().workspace.evidence[3].summary).toContain("Enterprise add-on");
    expect(store.getState().trace.slice(-2).map((e) => e.teaching.disposition)).toEqual(["example_only", "example_only"]);
    expect(call("set_recommendation", { candidateId: w.candidates[0].id, rationale: "Updated initial recommendation." })).toMatchObject({ ok: true });
    expect(store.getState().replay).toBeNull();
    expect(testStore(storage).getState()).toEqual(store.getState());
    expect(call("get_replay_plan", {})).toMatchObject({ active: false });
    store.resetDemo();
    expect(testStore(storage).getState().workspace.candidates).toEqual([]);
    expect(call("get_workspace", {})).toMatchObject({ budget: { amount: null }, candidates: [], evidence: [], scores: [] });
  });

  it.each([undefined, 1, 2, 3, 4, 5])("enforces required criteria through the actual tool for score %s", (score) => {
    const { store, call, pairs } = session();
    executeFromUI(store, { type: "SET_CRITERION_REQUIRED", payload: { criterionId: pairs[0].criterionId, required: true } });
    if (score !== undefined) call("set_scores", { items: [{ ...pairs[0], score, rationale: "Assessment" }] });
    const before = store.getState().workspace;
    const result = call("set_recommendation", { candidateId: pairs[0].candidateId, rationale: "Recommendation" });
    if (score === undefined || score < 3) {
      expect(result).toMatchObject({ ok: false, error: { code: "REQUIRED_CRITERION_FAILED" } });
      expect(store.getState().workspace).toBe(before);
      expect(store.getState().trace.at(-1)).toMatchObject({ outcome: "rejected", actor: { kind: "agent" } });
    } else expect(result).toMatchObject({ ok: true });
  });

  it("normalizes conflicting criterion priorities deterministically and rejects duplicate names atomically", () => {
    const store = testStore();
    const tool = createToolDefinitions(store).find((t) => t.name === "add_criteria")!;
    tool.execute({ criteria: ["Security", "Integration", "Cost"].map((name) => ({ name, priority: 1, required: false })) });
    expect(store.getState().workspace.criteria.map((c) => [c.name, c.priority])).toEqual([["Cost", 1], ["Integration", 2], ["Security", 3]]);
    const before = store.getState().workspace;
    expect(tool.execute({ criteria: ["Support", " security "].map((name) => ({ name, priority: 2, required: false })) })).toMatchObject({ ok: false, error: { code: "DUPLICATE_CRITERION" } });
    expect(store.getState().workspace).toBe(before);
  });

  it.each(["attach_evidence", "set_scores"])("rolls back %s when a later reference is invalid", (name) => {
    const { store, call, pairs } = session();
    const details = name === "attach_evidence" ? { summary: "Fact", sourceRef: "aegis-security", confidence: "high" } : { score: 4, rationale: "Assessment" };
    const before = store.getState();
    expect(call(name, { items: [{ ...pairs[0], ...details }, { ...pairs[1], ...details, criterionId: "missing" }] })).toMatchObject({ ok: false, error: { code: "CRITERION_NOT_FOUND" } });
    expect(store.getState().workspace).toBe(before.workspace);
    expect(store.getState().trace.slice(before.trace.length)).toEqual([expect.objectContaining({ outcome: "rejected" })]);
  });

  it("keeps dossier reads detached, deterministic, and explicit about unknown vendors", () => {
    const store = testStore(); const tool = createToolDefinitions(store).find((t) => t.name === "get_vendor_dossier")!;
    const input = { vendorNames: ["aegis cloud", "BeaconStack", "Northwind AI", "Orchid Systems"] };
    const before = store.getState();
    expect(tool.execute(input)).toEqual(tool.execute(input));
    expect(JSON.stringify(tool.execute(input))).toContain("SOC 2 Type II is not listed");
    expect(tool.execute({ vendorNames: ["Unknown"] })).toMatchObject({ vendors: [{ ok: false, error: { code: "VENDOR_NOT_FOUND" } }] });
    expect(store.getState()).toBe(before);
  });
});

const validInputs = [
  ["get_workspace", {}], ["get_replay_plan", {}], ["get_vendor_dossier", { vendorNames: ["Aegis Cloud"] }],
  ["set_budget", { amount: 0, currency: "USD" }],
  ["add_candidates", { candidates: [{ name: "New vendor" }] }],
  ["add_criteria", { criteria: [{ name: "Support", priority: 4, required: false }] }],
  ["attach_evidence", { items: [{ candidateId: "missing", criterionId: "missing", summary: "Fact", sourceRef: "ref", confidence: "high" }] }],
  ["set_scores", { items: [{ candidateId: "missing", criterionId: "missing", score: 3, rationale: "Assessment" }] }],
  ["flag_uncertainty", { note: "Check scope" }], ["set_recommendation", { candidateId: "missing", rationale: "Assessment" }],
] as const;

describe.each(validInputs)("%s input boundary", (name, input) => {
  it("rejects spoofing and cancellation without side effects", () => {
    const store = testStore(); const tool = createToolDefinitions(store).find((t) => t.name === name)!;
    const before = store.getState();
    for (const extra of [{ actor: "human" }, { channel: "ui" }, { actorId: "local-human" }]) expect(tool.execute({ ...input, ...extra })).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(tool.execute(input, { signal: AbortSignal.abort() })).toMatchObject({ ok: false, error: { code: "ABORTED" } });
    expect(store.getState()).toBe(before);
  });
  it("tolerates omitted options and an options object without signal", () => {
    for (const options of [undefined, {}]) {
      const tool = createToolDefinitions(testStore()).find((t) => t.name === name)!;
      expect(() => Reflect.apply(tool.execute, tool, [input, options])).not.toThrow();
    }
  });
});

describe("M3 malformed batches", () => {
  it.each([
    ["set_budget", { amount: Infinity, currency: "USD" }], ["set_budget", { amount: -1, currency: "USD" }],
    ["get_vendor_dossier", { vendorNames: [" "] }], ["get_vendor_dossier", { vendorNames: Array(5).fill("A") }],
    ["add_criteria", { criteria: [{ name: "Valid", priority: 1, required: false }, { name: " ", priority: 2, required: false }] }],
    ["add_criteria", { criteria: [{ name: "Valid", priority: 1.5, required: false }] }],
    ["add_criteria", { criteria: Array(7).fill({ name: "A", priority: 1, required: false }) }],
    ["add_criteria", { criteria: [{ name: "A", priority: 1, required: false, actor: "human" }] }],
    ["attach_evidence", { items: [{ candidateId: "a", criterionId: "b", summary: "fact", sourceRef: "ref", confidence: "certain" }] }],
    ["set_scores", { items: [{ candidateId: "a", criterionId: "b", score: 6, rationale: "assessment" }] }],
    ["set_scores", { items: [{ candidateId: "a", criterionId: "b", score: 3.5, rationale: "assessment" }] }],
    ["set_scores", { items: [] }], ["attach_evidence", { items: [] }], ["flag_uncertainty", { note: " " }],
    ["flag_uncertainty", { note: "x", uncertaintyId: "forged" }],
  ])("rejects %s with zero domain or trace mutations", (name, input) => {
    const store = testStore(); const before = store.getState();
    expect(createToolDefinitions(store).find((t) => t.name === name)!.execute(input)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(store.getState()).toBe(before);
  });
});
