import type { CommandRequest } from "../domain/commands";
import type { EvaluationWorkspace } from "../domain/types";

export function summarizeEvent(command: CommandRequest, w: EvaluationWorkspace): string {
  const candidate = (id: string) => w.candidates.find((c) => c.id === id)?.name ?? "candidate";
  const criterion = (id: string) => w.criteria.find((c) => c.id === id)?.name ?? "criterion";
  switch (command.type) {
    case "SET_BUDGET": return `Set budget: $${command.payload.amount.toLocaleString("en-US")} USD`;
    case "ADD_CANDIDATE": return `Added candidate: ${command.payload.name.trim()}`;
    case "ADD_CRITERION": return `Added criterion: ${command.payload.name.trim()}`;
    case "SET_CRITERION_PRIORITY": return `Set ${criterion(command.payload.criterionId)} priority to ${w.criteria.find((c) => c.id === command.payload.criterionId)?.priority}`;
    case "SET_CRITERION_REQUIRED": return `Made ${criterion(command.payload.criterionId)} ${command.payload.required ? "required" : "optional"}`;
    case "ATTACH_EVIDENCE": return `Attached evidence: ${candidate(command.payload.candidateId)} → ${criterion(command.payload.criterionId)}`;
    case "REPLACE_EVIDENCE": {
      const evidence = w.evidence.find((e) => e.id === command.payload.evidenceId)!;
      return `Corrected evidence: ${candidate(evidence.candidateId)} → ${criterion(evidence.criterionId)}`;
    }
    case "SET_SCORE": return `Scored ${candidate(command.payload.candidateId)} → ${criterion(command.payload.criterionId)}: ${command.payload.score}/5`;
    case "FLAG_UNCERTAINTY": return `Flagged uncertainty: ${command.payload.note}`;
    case "SET_APPROVAL_POLICY": return command.payload.requiredBeforeRecommendation ? "Required approval before final recommendation" : "Disabled approval-before-recommendation policy";
    case "SET_RECOMMENDATION": return `Recommended ${candidate(command.payload.candidateId)}`;
    case "TEACH_ROUTINE": return `Taught routine: ${command.payload.routineName.trim()}`;
    default: return "Lifecycle action unavailable";
  }
}
