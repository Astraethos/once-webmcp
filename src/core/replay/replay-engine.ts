import type { Command, CommandPayloads, CommandRequest } from "../domain/commands";
import { createInitialState } from "../domain/initial-state";
import type { AppState, CommandError } from "../domain/types";
import type { Routine } from "../teaching/routine-types";
import type { ReplayState } from "./replay-types";

const error = (code: string, message: string): CommandError => ({ code, message });

export function validateReplayReadiness(routine: Routine): CommandError | null {
  const learned = new Set(routine.steps.map((step) => step.kind));
  if (learned.has("score") && !learned.has("collect_evidence")) return error("REPLAY_ROUTINE_INCOMPLETE", "Replay can’t start because scoring was learned without evidence collection.");
  if (learned.has("recommend") && routine.policies.criteria.some((c) => c.required) && !learned.has("score")) return error("REPLAY_ROUTINE_INCOMPLETE", "Replay can’t start because recommendation requires scoring to evaluate required criteria.");
  return null;
}

export function replayMatrix(state: AppState) {
  const w = state.workspace;
  const pairs = w.candidates.flatMap((candidate) => w.criteria.map((criterion) => ({ candidateId: candidate.id, criterionId: criterion.id })));
  const missingEvidence = pairs.filter((pair) => !w.evidence.some((e) => e.candidateId === pair.candidateId && e.criterionId === pair.criterionId));
  const missingScores = pairs.filter((pair) => !w.scores.some((s) => s.candidateId === pair.candidateId && s.criterionId === pair.criterionId));
  return { total: pairs.length, evidence: pairs.length - missingEvidence.length, scores: pairs.length - missingScores.length, missingEvidence, missingScores };
}

// Derived progress, never a second state machine. The command bus calls this
// after each semantic action; only lifecycle commands change replay status.
export function updateReplayProgress(state: AppState): AppState {
  const run = state.replay, routine = state.teaching.routine;
  if (!run || !routine) return state;
  const matrix = replayMatrix(state);
  let earlierIncomplete = false;
  const stepStatus: ReplayState["stepStatus"] = routine.steps.map((step) => {
    const done = step.kind === "collect_evidence" ? matrix.missingEvidence.length === 0
      : step.kind === "score" ? matrix.missingScores.length === 0
      : step.kind === "approval" ? run.approval.decision === "approved"
      : step.kind === "recommend" ? state.workspace.recommendation !== null
      : state.workspace.uncertainties.length > 0;
    if (done) return { stepId: step.id, status: "complete" };
    if (step.kind === "check_uncertainty" && !earlierIncomplete) return { stepId: step.id, status: "skipped" };
    const status = earlierIncomplete ? "pending" : "active";
    earlierIncomplete = true;
    return { stepId: step.id, status };
  });
  return { ...state, replay: { ...run, stepStatus } };
}

export function startReplay(state: AppState, payload: CommandPayloads["START_REPLAY"], runId: string): AppState {
  const routine = state.teaching.routine!;
  const budget = { amount: payload.budget, currency: payload.currency };
  const candidates = payload.candidates.map((c) => ({ id: c.candidateId, name: c.name.trim() }));
  const gateId = routine.steps.find((step) => step.kind === "approval")?.id ?? null;
  return updateReplayProgress({
    ...state, phase: "replay",
    workspace: {
      ...createInitialState().workspace, budget, candidates,
      criteria: routine.policies.criteria.map(({ routineCriterionId, ...criterion }) => ({ id: routineCriterionId, ...criterion })),
      approvalPolicy: { ...routine.policies.approval },
    },
    replay: {
      runId, routineId: routine.id, status: "running", bindings: { budget, candidates },
      stepStatus: [], approval: { gateId, decision: gateId ? "pending" : null },
    },
  });
}

export function nextReplayCommand(state: AppState): Command | null {
  const run = state.replay, routine = state.teaching.routine;
  if (!run || !routine || run.status !== "running") return null;
  const active = run.stepStatus.find((step) => step.status === "active");
  if (active?.stepId === run.approval.gateId && run.approval.decision === "pending") return {
    type: "REQUEST_APPROVAL", payload: { runId: run.runId, gateId: run.approval.gateId!, message: "Review the evidence, scores, required criteria, and uncertainty before allowing the final recommendation." },
  };
  if (run.stepStatus.every((step) => step.status === "complete" || step.status === "skipped")) return { type: "COMPLETE_REPLAY", payload: { runId: run.runId } };
  return null;
}

export function validateReplayCommand(state: AppState, request: CommandRequest): CommandError | null {
  const run = state.replay, routine = state.teaching.routine;
  if (request.type === "START_REPLAY") {
    if (!routine || request.payload.routineId !== routine.id) return error("ROUTINE_NOT_FOUND", "Teach a routine before starting replay.");
    if (state.phase !== "teaching") return error("INVALID_PHASE", "Start replay from the learned routine review. Reset demo to begin another collaboration.");
    const candidates = request.payload.candidates;
    if (new Set(candidates.map((c) => c.candidateId)).size !== candidates.length || new Set(candidates.map((c) => c.name.trim().toLowerCase())).size !== candidates.length) return error("DUPLICATE_CANDIDATE", "Replay candidates must have distinct names and IDs.");
    return validateReplayReadiness(routine);
  }
  if (!run || !routine || (request.replayRunId !== undefined && request.replayRunId !== run.runId)) return error("INVALID_REPLAY_STATE", "This command requires the current replay run.");
  if (request.type === "REQUEST_APPROVAL" || request.type === "COMPLETE_REPLAY") {
    const expected = nextReplayCommand(state);
    if (request.payload.runId !== run.runId || expected?.type !== request.type || (request.type === "REQUEST_APPROVAL" && request.payload.gateId !== run.approval.gateId)) return error("INVALID_REPLAY_STATE", "The replay has not reached this lifecycle boundary.");
    return null;
  }
  if (request.type === "RECORD_APPROVAL") {
    if (run.status !== "awaiting_approval" || request.payload.runId !== run.runId || request.payload.gateId !== run.approval.gateId || run.approval.decision !== "pending") return error("INVALID_REPLAY_STATE", "There is no pending human approval for this run and gate.");
    return null;
  }
  if (run.status === "rejected" || run.status === "completed" || run.status === "failed") return error("INVALID_REPLAY_STATE", "This replay has ended. Further workspace changes are blocked.");
  if (request.actor.kind !== "agent") return error("REPLAY_LOCKED", "Replay workspace editing is locked. Human actions are limited to approval or rejection.");
  const kind = request.type === "ATTACH_EVIDENCE" ? "collect_evidence"
    : request.type === "SET_SCORE" ? "score"
    : request.type === "FLAG_UNCERTAINTY" ? "check_uncertainty"
    : request.type === "SET_RECOMMENDATION" ? "recommend" : null;
  if (!kind || !routine.steps.some((step) => step.kind === kind)) return error("REPLAY_ACTION_NOT_ALLOWED", "This action is not part of the learned replay procedure. Inputs and policies are fixed.");
  if (request.type === "SET_RECOMMENDATION") {
    if (routine.policies.approval.requiredBeforeRecommendation && run.approval.decision !== "approved") return error("APPROVAL_REQUIRED", "Human approval is required before setting the final recommendation.");
    if (run.stepStatus.some((step) => step.stepId !== "recommend" && step.status !== "complete" && step.status !== "skipped")) return error("REPLAY_INCOMPLETE", "Complete the learned evidence and scoring steps before recommending.");
    return null;
  }
  if (run.status === "awaiting_approval" || run.approval.decision === "approved") return error("REPLAY_LOCKED", "The reviewed workspace is locked at the approval boundary. Only the human decision and approved recommendation may follow.");
  if (request.type === "SET_SCORE" && !state.workspace.evidence.some((e) => e.candidateId === request.payload.candidateId && e.criterionId === request.payload.criterionId)) return error("EVIDENCE_REQUIRED", "Attach evidence for this candidate and criterion before scoring.");
  return null;
}

export function getReplayPlan(state: AppState) {
  const run = state.replay, routine = state.teaching.routine;
  if (!run || !routine) return { active: false as const, message: routine ? "Use Replay with new inputs in the human UI to start this learned routine." : "Collaborate and teach a routine, then start replay in the human UI." };
  const matrix = replayMatrix(state);
  const nextActions: string[] = [];
  if (run.status === "running") {
    if (run.approval.decision !== "approved") {
      if (routine.steps.some((s) => s.kind === "collect_evidence")) nextActions.push("attach_evidence");
      if (routine.steps.some((s) => s.kind === "score") && matrix.evidence > 0) nextActions.push("set_scores");
      if (routine.steps.some((s) => s.kind === "check_uncertainty")) nextActions.push("flag_uncertainty");
    }
    if (run.stepStatus.some((s) => s.stepId === "recommend" && s.status === "active") && (!routine.policies.approval.requiredBeforeRecommendation || run.approval.decision === "approved")) nextActions.push("set_recommendation");
  }
  return structuredClone({
    active: true as const, phase: state.phase, status: run.status, runId: run.runId, routineId: routine.id, routineName: routine.name,
    bindings: run.bindings, fixedPolicy: routine.policies,
    steps: routine.steps.map((step, i) => ({ ...step, status: run.stepStatus[i].status })),
    currentStep: run.stepStatus.find((step) => step.status === "active")?.stepId ?? null,
    approval: run.approval, nextActions, progress: matrix,
    completionRequirements: routine.steps.flatMap((s) => "completion" in s ? [s.completion] : s.kind === "approval" ? ["human_approval_before_recommendation"] : []),
    constraints: ["Inputs and learned policies are fixed.", "Score only pairs with evidence; use the 1–5 scale.", "Recommended candidates must score at least 3 on every required criterion.", "Flag optional uncertainty before completing pre-approval work; approval locks the reviewed workspace.", "Only a human can approve or reject in the UI."],
    message: run.status === "awaiting_approval" ? "Replay paused. Wait for the human to approve or reject in the UI."
      : run.status === "rejected" ? "The human rejected this replay. It cannot resume; use Reset demo to begin again."
      : run.status === "completed" ? "Replay complete."
      : run.approval.decision === "approved" ? "Human approval granted. Set the final recommendation using the reviewed scores."
      : "Use current dossier facts to perform only the learned procedures with these new inputs.",
  });
}
