import { getVendorDossier } from "../core/demo/vendor-dossiers";
import type { Command, CommandType } from "../core/domain/commands";
import { ACTORS } from "../core/domain/types";
import { isRecord, nonempty, validPayload } from "../core/domain/validate-command";
import type { OnceStore } from "../core/store/once-store";
import type { NativeTool } from "../types/webmcp";
import { toolContracts } from "./tool-contracts";
import { cancelled, invalidInput } from "./tool-results";

export function createToolDefinitions(store: OnceStore): NativeTool[] {
  return toolContracts.map((contract) => ({
    ...contract,
    execute(input, options) {
      if (options?.signal?.aborted) return cancelled(store);
      if (!isRecord(input)) return invalidInput(store, "Provide an object with the documented tool fields.");
      const state = store.getState();
      const name = contract.name;
      if (name === "get_workspace" || name === "get_replay_plan") {
        if (Object.keys(input).length) return invalidInput(store, "This tool takes an empty object.");
        if (name === "get_replay_plan") return { active: false, message: "Continue the collaboration. Teaching and replay are not available yet." };
        const w = state.workspace;
        return structuredClone({ budget: w.budget, candidates: w.candidates, criteria: [...w.criteria].sort((a, b) => a.priority - b.priority), evidence: w.evidence, scores: w.scores, uncertainties: w.uncertainties, approvalPolicy: w.approvalPolicy, recommendation: w.recommendation, phase: state.phase, replay: state.replay, stateVersion: state.stateVersion });
      }
      if (name === "get_vendor_dossier") {
        if (Object.keys(input).length !== 1 || !Array.isArray(input.vendorNames) || input.vendorNames.length < 1 || input.vendorNames.length > 4 || !input.vendorNames.every(nonempty)) {
          return invalidInput(store, "Provide 1–4 non-empty vendor names.");
        }
        return { vendors: input.vendorNames.map(getVendorDossier) };
      }

      // Shape checks are adapter-only. Entity, policy, and phase validation stays
      // in executeBatch, which commits nothing until every command is valid.
      let type: CommandType;
      let items: Record<string, unknown>[];
      let idField: string | undefined;
      const batch = name === "add_candidates" ? { key: "candidates", max: 4, type: "ADD_CANDIDATE" as const, id: "candidateId" }
        : name === "add_criteria" ? { key: "criteria", max: 6, type: "ADD_CRITERION" as const, id: "criterionId" }
        : name === "attach_evidence" ? { key: "items", max: 12, type: "ATTACH_EVIDENCE" as const, id: "evidenceId" }
        : name === "set_scores" ? { key: "items", max: 12, type: "SET_SCORE" as const, id: undefined } : null;
      if (batch) {
        const values = input[batch.key];
        if (Object.keys(input).length !== 1 || !Array.isArray(values) || values.length < 1 || values.length > batch.max || !values.every(isRecord)) {
          return invalidInput(store, `Provide 1–${batch.max} ${batch.key} with the documented fields.`);
        }
        type = batch.type;
        items = values;
        idField = batch.id;
      } else {
        type = name === "set_budget" ? "SET_BUDGET" : name === "flag_uncertainty" ? "FLAG_UNCERTAINTY" : "SET_RECOMMENDATION";
        items = [input];
        idField = name === "flag_uncertainty" ? "uncertaintyId" : undefined;
      }
      if (idField && items.some((item) => Object.hasOwn(item, idField!))) return invalidInput(store, "Entity IDs for new items are assigned by ONCE.");
      const commands = items.map((item) => ({ type, payload: { ...item, ...(idField ? { [idField]: crypto.randomUUID() } : {}) } }));
      if (commands.some((command) => !validPayload(command.type, command.payload))) return invalidInput(store, "Check the documented fields, text, and numeric ranges for every item.");
      const result = store.executeBatch(commands.map((command) => ({
        ...command as Command, id: crypto.randomUUID(), actor: ACTORS.agent, channel: "webmcp", phase: state.phase,
      })));
      return result.ok && name === "add_candidates" ? { ...result, summary: `Added ${items.length} candidate${items.length === 1 ? "" : "s"}.` } : result;
    },
  }));
}
