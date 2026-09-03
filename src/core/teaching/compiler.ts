import type { AppState, CommandError } from "../domain/types";
import type { CompilerNote, Routine, RoutineStep } from "./routine-types";
import { validateTeaching } from "./validate-teaching";
import { TEACHING_POLICIES } from "./teaching-policy";

export type TeachingSource = Pick<AppState, "workspace" | "trace" | "sessionId">;
export type RoutineMetadata = Pick<Routine, "id" | "name" | "createdAt">;

export function collaborationEvents(source: TeachingSource) {
  return source.trace.filter((event) => event.sessionId === source.sessionId && event.phase === "collaboration" && event.outcome === "applied");
}

// Pure compilation: the bus supplies identity/time metadata. No clock, random
// values, source labels, or generated output values control the procedure.
export function compileRoutine(source: TeachingSource, metadata: RoutineMetadata): { ok: true; routine: Routine } | { ok: false; error: CommandError } {
  const error = validateTeaching(source, metadata.name);
  if (error) return { ok: false, error };
  const events = collaborationEvents(source);
  const observed = new Set(events.flatMap((event) => {
    const step = TEACHING_POLICIES[event.command.type].step;
    return step ? [step] : [];
  }));
  const steps: RoutineStep[] = [];
  if (observed.has("collect_evidence")) steps.push({ id: "collect_evidence", kind: "collect_evidence", forEach: ["candidate", "criterion"], completion: "evidence_exists_for_every_candidate_criterion_pair" });
  if (observed.has("score")) steps.push({ id: "score", kind: "score", forEach: ["candidate", "criterion"], completion: "score_exists_for_every_candidate_criterion_pair" });
  if (observed.has("check_uncertainty")) steps.push({ id: "check_uncertainty", kind: "check_uncertainty", optional: true });
  if (observed.has("recommend")) {
    if (source.workspace.approvalPolicy.requiredBeforeRecommendation) steps.push({ id: "approval", kind: "approval", requiredActor: "human", before: "recommend" });
    steps.push({ id: "recommend", kind: "recommend", completion: "recommendation_exists" });
  }
  const compilerNotes: CompilerNote[] = [];
  if (events.some((event) => event.command.type === "REPLACE_EVIDENCE" && event.actor.kind === "human")) compilerNotes.push({ kind: "example_only", message: "Manual evidence correction — Example only — not generalized. Replacement text does not become a rule." });
  if (events.some((event) => event.command.type === "SET_SCORE" && event.actor.kind === "human" && event.teaching.disposition === "example_only")) compilerNotes.push({ kind: "example_only", message: "Manual score correction — Example only — not generalized. The corrected score and rationale do not become a rule." });
  const routine: Routine = {
    schemaVersion: 1,
    id: metadata.id,
    name: metadata.name.trim(),
    domain: "vendor_evaluation",
    sourceSessionId: source.sessionId,
    createdAt: metadata.createdAt,
    inputs: [
      { key: "budget", type: "money", required: true },
      { key: "candidates", type: "candidate_list", minItems: 2, maxItems: 4, required: true },
    ],
    policies: {
      criteria: [...source.workspace.criteria].sort((a, b) => a.priority - b.priority).map((criterion, index) => ({
        routineCriterionId: `criterion-${index + 1}`,
        name: criterion.name,
        ...(criterion.description !== undefined ? { description: criterion.description } : {}),
        priority: criterion.priority,
        required: criterion.required,
      })),
      approval: { ...source.workspace.approvalPolicy },
    },
    steps,
    compilerNotes,
  };
  return { ok: true, routine };
}
