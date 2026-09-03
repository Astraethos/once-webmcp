import { type CommandRequest, type CommandType } from "../domain/commands";
import type { EvaluationWorkspace } from "../domain/types";
import type { SemanticEvent } from "../events/types";
import type { RoutineStep } from "./routine-types";

type FieldRole = "variable" | "invariant" | "generated" | "structural" | "excluded";
type TeachingPolicy = {
  disposition: SemanticEvent["teaching"]["disposition"];
  fields: Record<string, FieldRole>;
  step?: RoutineStep["kind"];
};
const lifecycle = { disposition: "lifecycle", fields: {} } as const;

// Explicit Vendor Evaluation semantics. Neither summaries nor free text infer rules.
export const TEACHING_POLICIES: Record<CommandType, TeachingPolicy> = {
  SET_BUDGET: { disposition: "variable", fields: { amount: "variable", currency: "invariant" } },
  ADD_CANDIDATE: { disposition: "variable", fields: { candidateId: "variable", name: "variable" } },
  ADD_CRITERION: { disposition: "policy", fields: { criterionId: "structural", name: "invariant", description: "invariant", priority: "invariant", required: "invariant" } },
  SET_CRITERION_PRIORITY: { disposition: "policy", fields: { criterionId: "structural", priority: "invariant" } },
  SET_CRITERION_REQUIRED: { disposition: "policy", fields: { criterionId: "structural", required: "invariant" } },
  SET_APPROVAL_POLICY: { disposition: "policy", fields: { requiredBeforeRecommendation: "invariant" } },
  ATTACH_EVIDENCE: { disposition: "procedure", step: "collect_evidence", fields: { evidenceId: "excluded", candidateId: "structural", criterionId: "structural", summary: "generated", sourceRef: "generated", confidence: "generated" } },
  REPLACE_EVIDENCE: { disposition: "example_only", fields: { evidenceId: "excluded", summary: "excluded", sourceRef: "excluded", confidence: "excluded", reason: "excluded" } },
  SET_SCORE: { disposition: "procedure", step: "score", fields: { candidateId: "structural", criterionId: "structural", score: "generated", rationale: "generated" } },
  FLAG_UNCERTAINTY: { disposition: "procedure", step: "check_uncertainty", fields: { uncertaintyId: "excluded", candidateId: "structural", criterionId: "structural", note: "generated" } },
  SET_RECOMMENDATION: { disposition: "procedure", step: "recommend", fields: { candidateId: "generated", rationale: "generated" } },
  TEACH_ROUTINE: lifecycle,
  START_REPLAY: lifecycle,
  REQUEST_APPROVAL: lifecycle,
  RECORD_APPROVAL: lifecycle,
  COMPLETE_REPLAY: lifecycle,
};

export function teachingPolicy(command: CommandRequest, before: EvaluationWorkspace): SemanticEvent["teaching"] {
  let disposition = TEACHING_POLICIES[command.type].disposition;
  if (command.type === "SET_SCORE" && command.actor.kind === "human" && before.scores.some((s) => s.candidateId === command.payload.candidateId && s.criterionId === command.payload.criterionId)) disposition = "example_only";
  const reasons = {
    lifecycle: "Lifecycle actions are not reusable work.",
    variable: "Input values change between evaluations.",
    policy: "Final evaluation policy can be reused.",
    example_only: "A one-off correction is not a durable rule.",
    procedure: "The action pattern is reusable; literal outputs are not.",
    excluded: "This action is not reusable work.",
  };
  return { disposition, reason: reasons[disposition] };
}
