import type { ActorKind } from "../../src/core/domain/types";
import { ACTORS } from "../../src/core/domain/types";
import type { Command } from "../../src/core/domain/commands";
import { getVendorDossier } from "../../src/core/demo/vendor-dossiers";
import { testStore, memoryStorage } from "../helpers";

// Exact DEMO.md first-session vendors, budget, criteria and human teaching
// actions. Scores are fixed interpretations of the fictional dossier facts.
export function demoCollaboration(storage = memoryStorage()) {
  const store = testStore(storage);
  let sequence = 0;
  function apply(command: Command, actor: ActorKind = "agent") {
    const result = store.execute({ ...command, id: `demo-command-${++sequence}`, actor: ACTORS[actor], channel: actor === "human" ? "ui" : "webmcp", phase: "collaboration" });
    if (!result.ok) throw new Error(result.error.message);
  }
  apply({ type: "SET_BUDGET", payload: { amount: 24000, currency: "USD" } });
  for (const [candidateId, name] of [["aegis", "Aegis Cloud"], ["beacon", "BeaconStack"]]) apply({ type: "ADD_CANDIDATE", payload: { candidateId, name } });
  for (const [index, name] of ["Security", "Integration", "Cost"].entries()) apply({ type: "ADD_CRITERION", payload: { criterionId: name.toLowerCase(), name, priority: index + 1, required: false } });
  for (const candidate of store.getState().workspace.candidates) {
    const dossier = getVendorDossier(candidate.name);
    if (!dossier.ok) throw new Error("Missing demo dossier");
    for (const [index, criterion] of store.getState().workspace.criteria.entries()) {
      const fact = dossier.dossier.facts[index];
      apply({ type: "ATTACH_EVIDENCE", payload: { evidenceId: `${candidate.id}-${criterion.id}`, candidateId: candidate.id, criterionId: criterion.id, summary: fact.statement, sourceRef: fact.sourceRef, confidence: "high" } });
      apply({ type: "SET_SCORE", payload: { candidateId: candidate.id, criterionId: criterion.id, score: 4, rationale: `Strong ${criterion.name.toLowerCase()} fit in the demo dossier.` } });
    }
  }
  apply({ type: "FLAG_UNCERTAINTY", payload: { uncertaintyId: "scope", note: "Confirm Enterprise add-on scope before purchase." } });
  apply({ type: "SET_RECOMMENDATION", payload: { candidateId: "aegis", rationale: "Included SSO and SCIM within the annual budget." } });
  apply({ type: "SET_CRITERION_REQUIRED", payload: { criterionId: "security", required: true } }, "human");
  apply({ type: "SET_CRITERION_PRIORITY", payload: { criterionId: "security", priority: 1 } }, "human");
  apply({ type: "SET_APPROVAL_POLICY", payload: { requiredBeforeRecommendation: true } }, "human");
  apply({ type: "REPLACE_EVIDENCE", payload: { evidenceId: "beacon-security", summary: "SAML SSO requires the Enterprise add-on.", sourceRef: "beacon-security", confidence: "high", reason: "Clarify the add-on dependency." } }, "human");
  apply({ type: "SET_SCORE", payload: { candidateId: "beacon", criterionId: "security", score: 3, rationale: "Meets with the Enterprise add-on." } }, "human");
  return { store, storage, apply };
}
