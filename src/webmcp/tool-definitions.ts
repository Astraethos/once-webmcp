import { ACTORS } from "../core/domain/types";
import { isRecord, nonempty } from "../core/domain/validate-command";
import type { OnceStore } from "../core/store/once-store";
import type { NativeTool } from "../types/webmcp";
import { cancelled, invalidInput } from "./tool-results";

export function createToolDefinitions(store: OnceStore): NativeTool[] {
  return [
    {
      name: "get_workspace",
      title: "Get workspace",
      description: "Get the current ONCE vendor-evaluation workspace, including budget, candidates, criteria, evidence, scores, uncertainty, recommendation, phase, and replay status. Call this when you need the current shared state before deciding what to change.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute(input, options) {
        if (options?.signal?.aborted) return cancelled(store);
        if (!isRecord(input) || Object.keys(input).length !== 0) return invalidInput(store, "Get workspace takes an empty object.");
        const state = store.getState();
        const workspace = state.workspace;
        // Return a detached current snapshot, never the trace or a mutable store reference.
        return structuredClone({
          phase: state.phase, budget: workspace.budget, candidates: workspace.candidates,
          criteria: workspace.criteria, evidence: workspace.evidence, scores: workspace.scores,
          uncertainties: workspace.uncertainties, approvalPolicy: workspace.approvalPolicy,
          recommendation: workspace.recommendation, replay: state.replay, stateVersion: state.stateVersion,
        });
      },
    },
    {
      name: "add_candidates",
      title: "Add candidates",
      description: "Add one or more vendor candidates to the current collaboration workspace. Candidate identities become variable inputs when a routine is taught. Do not use this tool to change candidates after replay has started.",
      inputSchema: {
        type: "object",
        properties: {
          candidates: {
            type: "array", minItems: 1, maxItems: 4,
            items: { type: "object", properties: { name: { type: "string", minLength: 1 } }, required: ["name"], additionalProperties: false },
          },
        },
        required: ["candidates"], additionalProperties: false,
      },
      execute(input, options) {
        if (options?.signal?.aborted) return cancelled(store);
        if (!isRecord(input) || Object.keys(input).length !== 1 || !Array.isArray(input.candidates) || input.candidates.length < 1 || input.candidates.length > 4) {
          return invalidInput(store, "Provide 1–4 candidates, each with only a non-empty name.");
        }
        const names: string[] = [];
        for (const item of input.candidates) {
          if (!isRecord(item) || Object.keys(item).length !== 1 || !nonempty(item.name)) return invalidInput(store, "Every candidate must have only a non-empty name.");
          names.push(item.name);
        }
        const result = store.executeBatch(names.map((name) => ({
          id: crypto.randomUUID(), type: "ADD_CANDIDATE", payload: { candidateId: crypto.randomUUID(), name },
          actor: ACTORS.agent, channel: "webmcp", phase: store.getState().phase,
        })));
        return result.ok ? { ...result, summary: `Added ${names.length} candidate${names.length === 1 ? "" : "s"}.` } : result;
      },
    },
  ];
}
