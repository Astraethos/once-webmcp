import { afterEach, describe, expect, it, vi } from "vitest";
import { createToolDefinitions } from "../src/webmcp/tool-definitions";
import { registerTools } from "../src/webmcp/register-tools";
import { addCandidateFromUI } from "../src/core/store/ui-commands";
import type { NativeTool } from "../src/types/webmcp";
import { memoryStorage, testStore } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

// Isolated contract double, not a browser polyfill or native discovery claim.
function registrationDouble() {
  const tools = new Map<string, NativeTool>();
  const signals: AbortSignal[] = [];
  const registerTool = vi.fn(async (tool: NativeTool, options: { signal: AbortSignal }) => {
    if (options.signal.aborted) throw new DOMException("Aborted", "AbortError");
    if (tools.has(tool.name)) throw new Error("Duplicate tool");
    tools.set(tool.name, tool);
    signals.push(options.signal);
    options.signal.addEventListener("abort", () => tools.delete(tool.name), { once: true });
  });
  vi.stubGlobal("document", { modelContext: { registerTool } });
  return { tools, signals, registerTool };
}

describe("M2 shared adapter path", () => {
  it("routes human UI adapter and registered tool handler into the same state and trace", async () => {
    const storage = memoryStorage();
    const store = testStore(storage);
    const native = registrationDouble();
    const registration = registerTools(store);
    expect(await registration.ready).toBe("ready");
    expect(addCandidateFromUI(store, "Aegis Cloud").ok).toBe(true);
    const result = native.tools.get("add_candidates")!.execute({ candidates: [{ name: "BeaconStack" }] });
    expect(result).toMatchObject({ ok: true, summary: "Added 1 candidate.", stateVersion: 2 });
    expect(store.getState().workspace.candidates.map((c) => c.name)).toEqual(["Aegis Cloud", "BeaconStack"]);
    expect(store.getState().trace.map((e) => [e.command.type, e.actor.kind, e.channel, e.outcome])).toEqual([
      ["ADD_CANDIDATE", "human", "ui", "applied"],
      ["ADD_CANDIDATE", "agent", "webmcp", "applied"],
    ]);
    expect(testStore(storage).getState()).toEqual(store.getState());
    registration.dispose();
  });

  it("get_workspace reads the latest detached snapshot without state, event, or storage writes", () => {
    const store = testStore();
    const [read] = createToolDefinitions(store);
    const notify = vi.fn();
    store.subscribe(notify);
    const before = store.getState();
    expect(read.annotations).toEqual({ readOnlyHint: true });
    expect(read.execute({})).toMatchObject({ candidates: [], stateVersion: 0 });
    expect(store.getState()).toBe(before);
    expect(notify).not.toHaveBeenCalled();
    addCandidateFromUI(store, "Aegis Cloud");
    const snapshot = read.execute({}) as { candidates: { name: string }[]; trace?: unknown; stateVersion: number };
    expect(snapshot.stateVersion).toBe(1);
    expect(snapshot.trace).toBeUndefined();
    snapshot.candidates[0].name = "Changed";
    expect(store.getState().workspace.candidates[0].name).toBe("Aegis Cloud");
    expect(store.getState().trace).toHaveLength(1);
  });

  it("accepts one to four names and creates granular agent events in one commit", () => {
    const store = testStore();
    const tool = createToolDefinitions(store)[1];
    const result = tool.execute({ candidates: ["A", "B", "C", "D"].map((name) => ({ name })) });
    expect(result).toMatchObject({ ok: true, eventIds: expect.any(Array), stateVersion: 1 });
    expect(store.getState().trace).toHaveLength(4);
    expect(store.getState().trace.every((e) => e.actor.id === "webmcp-agent")).toBe(true);
    expect(new Set(store.getState().workspace.candidates.map((c) => c.id)).size).toBe(4);
  });

  it.each([
    null, {}, { candidates: [] }, { candidates: ["A"] },
    { candidates: [{ name: "A" }, { name: " " }] },
    { candidates: [{ name: "A" }], actor: "human" },
    { candidates: [{ name: "A" }], actorId: "local-human" },
    { candidates: [{ name: "A" }], channel: "ui" },
    { candidates: [{ name: "A", actor: "human" }] },
    { candidates: [{ name: "A", candidateId: "provided-id" }] },
    { candidates: ["A", "B", "C", "D", "E"].map((name) => ({ name })) },
  ])("rejects malformed or identity-bearing inputs atomically: %j", (input) => {
    const store = testStore();
    const before = store.getState();
    expect(createToolDefinitions(store)[1].execute(input)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(store.getState()).toBe(before);
  });

  it("does not partially add candidates on a business rejection", () => {
    const store = testStore();
    addCandidateFromUI(store, "Aegis Cloud");
    const before = store.getState().workspace;
    const result = createToolDefinitions(store)[1].execute({ candidates: [{ name: "BeaconStack" }, { name: "aegis cloud" }] });
    expect(result).toMatchObject({ ok: false, error: { code: "DUPLICATE_CANDIDATE" } });
    expect(store.getState().workspace).toBe(before);
    expect(store.getState().trace.at(-1)).toMatchObject({ actor: { kind: "agent" }, outcome: "rejected" });
  });

  it("checks read input and cancellation without applying actions", () => {
    const store = testStore();
    const [read, add] = createToolDefinitions(store);
    expect(read.execute({ actor: "human" })).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    const signal = AbortSignal.abort();
    expect(add.execute({ candidates: [{ name: "A" }] }, { signal })).toMatchObject({ ok: false, error: { code: "ABORTED" } });
    expect(read.execute({}, { signal })).toMatchObject({ ok: false, error: { code: "ABORTED" } });
    expect(store.getState().trace).toEqual([]);
  });

  it("keeps handlers current across rapid calls and reset", () => {
    const store = testStore();
    const [read, add] = createToolDefinitions(store);
    add.execute({ candidates: [{ name: "A" }] });
    add.execute({ candidates: [{ name: "B" }] });
    expect(read.execute({})).toMatchObject({ stateVersion: 2, candidates: [{ name: "A" }, { name: "B" }] });
    store.resetDemo();
    add.execute({ candidates: [{ name: "A" }] });
    expect(read.execute({})).toMatchObject({ stateVersion: 1, candidates: [{ name: "A" }] });
  });
});

describe("native registration lifecycle (contract double)", () => {
  it("registers only the two M2 tools with one shared abort signal and no identity schema", async () => {
    const native = registrationDouble();
    const registration = registerTools(testStore());
    expect(await registration.ready).toBe("ready");
    expect([...native.tools.keys()]).toEqual(["get_workspace", "add_candidates"]);
    expect(native.signals[0]).toBe(native.signals[1]);
    for (const tool of native.tools.values()) {
      expect(JSON.stringify(tool.inputSchema)).not.toMatch(/actor|channel/);
      expect(tool.inputSchema.additionalProperties).toBe(false);
    }
    registration.dispose();
    registration.dispose();
    expect(native.signals.every((signal) => signal.aborted)).toBe(true);
    expect(native.tools.size).toBe(0);
  });

  it("can clean up and remount without duplicate registrations", async () => {
    const native = registrationDouble();
    const store = testStore();
    const first = registerTools(store);
    await first.ready;
    first.dispose();
    const second = registerTools(store);
    expect(await second.ready).toBe("ready");
    expect(native.tools.size).toBe(2);
    second.dispose();
  });

  it("handles immediate cleanup during asynchronous registration", async () => {
    const native = registrationDouble();
    const store = testStore();
    const first = registerTools(store);
    first.dispose();
    const second = registerTools(store);
    expect(await first.ready).toBe("cancelled");
    expect(await second.ready).toBe("ready");
    expect(native.tools.size).toBe(2);
    second.dispose();
  });

  it("rolls back partial registration when the native promise rejects", async () => {
    const native = registrationDouble();
    native.registerTool.mockImplementationOnce(async (tool, options) => {
      native.tools.set(tool.name, tool);
      options.signal.addEventListener("abort", () => native.tools.delete(tool.name));
    }).mockRejectedValueOnce(new Error("Native registration failure"));
    const registration = registerTools(testStore());
    expect(await registration.ready).toBe("failed");
    expect(native.tools.size).toBe(0);
  });

  it("handles synchronous registration failure without uncaught errors", async () => {
    vi.stubGlobal("document", { modelContext: { registerTool() { throw new Error("Denied"); } } });
    expect(await registerTools(testStore()).ready).toBe("failed");
  });

  it.each([undefined, {}, { modelContext: {} }])("reports unsupported environments without installing a fallback: %j", async (document) => {
    vi.stubGlobal("document", document);
    const store = testStore();
    expect(await registerTools(store).ready).toBe("unavailable");
    expect(addCandidateFromUI(store, "Aegis Cloud").ok).toBe(true);
    expect(globalThis.document).toBe(document);
  });
});
