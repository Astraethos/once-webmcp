import { LIFECYCLE, type CommandRequest, type CommandType } from "../domain/commands";
import type { EvaluationWorkspace } from "../domain/types";
import type { SemanticEvent } from "../events/types";

// Semantic annotations only. The routine compiler is intentionally deferred to M4.
export function teachingPolicy(command: CommandRequest, before: EvaluationWorkspace): SemanticEvent["teaching"] {
  const type = command.type;
  if (LIFECYCLE.includes(type)) return { disposition: "lifecycle", reason: "Lifecycle actions are not reusable work." };
  if (type === "SET_BUDGET" || type === "ADD_CANDIDATE") return { disposition: "variable", reason: "Input values change between evaluations." };
  const policies: CommandType[] = ["ADD_CRITERION", "SET_CRITERION_PRIORITY", "SET_CRITERION_REQUIRED", "SET_APPROVAL_POLICY"];
  if (policies.includes(type)) return { disposition: "policy", reason: "Final evaluation policy can be reused." };
  if (type === "REPLACE_EVIDENCE" || (command.type === "SET_SCORE" && command.actor.kind === "human" && before.scores.some((s) => s.candidateId === command.payload.candidateId && s.criterionId === command.payload.criterionId))) {
    return { disposition: "example_only", reason: "A one-off correction is not a durable rule." };
  }
  return { disposition: "procedure", reason: "The action pattern is reusable; literal outputs are not." };
}
