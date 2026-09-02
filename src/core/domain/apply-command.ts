import type { Command } from "./commands";
import type { Criterion, EvaluationWorkspace } from "./types";

function positionCriterion(criteria: Criterion[], criterion: Criterion): Criterion[] {
  const ordered = criteria.filter((c) => c.id !== criterion.id).sort((a, b) => a.priority - b.priority);
  ordered.splice(Math.min(criterion.priority - 1, ordered.length), 0, criterion);
  return ordered.map((c, index) => ({ ...c, priority: index + 1 }));
}

// Called only after validation by the semantic command bus.
export function applyCommand(workspace: EvaluationWorkspace, command: Command): EvaluationWorkspace {
  const w = workspace;
  switch (command.type) {
    case "SET_BUDGET": return { ...w, budget: { ...command.payload } };
    case "ADD_CANDIDATE": return { ...w, candidates: [...w.candidates, { id: command.payload.candidateId, name: command.payload.name.trim() }] };
    case "ADD_CRITERION": {
      const { criterionId, name, ...fields } = command.payload;
      return { ...w, criteria: positionCriterion(w.criteria, { id: criterionId, name: name.trim(), ...fields }) };
    }
    case "SET_CRITERION_PRIORITY": {
      const criterion = w.criteria.find((c) => c.id === command.payload.criterionId)!;
      return { ...w, criteria: positionCriterion(w.criteria, { ...criterion, priority: command.payload.priority }) };
    }
    case "SET_CRITERION_REQUIRED": return { ...w, criteria: w.criteria.map((c) => c.id === command.payload.criterionId ? { ...c, required: command.payload.required } : c) };
    case "ATTACH_EVIDENCE": {
      const { evidenceId, ...fields } = command.payload;
      return { ...w, evidence: [...w.evidence, { id: evidenceId, ...fields }] };
    }
    case "REPLACE_EVIDENCE": {
      const { evidenceId, summary, sourceRef, confidence } = command.payload;
      return { ...w, evidence: w.evidence.map((e) => e.id === evidenceId ? { ...e, summary, sourceRef, confidence } : e) };
    }
    case "SET_SCORE": return { ...w, scores: [...w.scores.filter((s) => s.candidateId !== command.payload.candidateId || s.criterionId !== command.payload.criterionId), { ...command.payload }] };
    case "FLAG_UNCERTAINTY": {
      const { uncertaintyId, ...fields } = command.payload;
      return { ...w, uncertainties: [...w.uncertainties, { id: uncertaintyId, ...fields }] };
    }
    case "SET_APPROVAL_POLICY": return { ...w, approvalPolicy: { ...command.payload } };
    case "SET_RECOMMENDATION": return { ...w, recommendation: { ...command.payload } };
    default: throw new Error("Lifecycle execution is deferred; validate commands before applying them.");
  }
}
