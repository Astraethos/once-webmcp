import type { Actor, Channel, Confidence, Phase } from "./types";

export type CommandPayloads = {
  SET_BUDGET: { amount: number; currency: "USD" };
  ADD_CANDIDATE: { candidateId: string; name: string };
  ADD_CRITERION: { criterionId: string; name: string; description?: string; priority: number; required: boolean };
  SET_CRITERION_PRIORITY: { criterionId: string; priority: number };
  SET_CRITERION_REQUIRED: { criterionId: string; required: boolean };
  ATTACH_EVIDENCE: { evidenceId: string; candidateId: string; criterionId: string; summary: string; sourceRef: string; confidence: Confidence };
  REPLACE_EVIDENCE: { evidenceId: string; summary: string; sourceRef: string; confidence: Confidence; reason?: string };
  SET_SCORE: { candidateId: string; criterionId: string; score: number; rationale: string };
  FLAG_UNCERTAINTY: { uncertaintyId: string; candidateId?: string; criterionId?: string; note: string };
  SET_APPROVAL_POLICY: { requiredBeforeRecommendation: boolean };
  SET_RECOMMENDATION: { candidateId: string; rationale: string };
  TEACH_ROUTINE: { routineName: string };
  START_REPLAY: { routineId: string; budget: number; currency: "USD"; candidates: { candidateId: string; name: string }[] };
  REQUEST_APPROVAL: { runId: string; gateId: string; message: string };
  RECORD_APPROVAL: { runId: string; gateId: string; decision: "approved" | "rejected" };
  COMPLETE_REPLAY: { runId: string };
};
export type CommandType = keyof CommandPayloads;
export type Command = { [K in CommandType]: { type: K; payload: CommandPayloads[K] } }[CommandType];
export type CommandRequest = Command & {
  id: string;
  actor: Actor;
  channel: Channel;
  phase: Phase;
  causationId?: string;
  replayRunId?: string;
};

export const HUMAN_ONLY: readonly CommandType[] = [
  "SET_CRITERION_PRIORITY", "SET_CRITERION_REQUIRED", "REPLACE_EVIDENCE",
  "SET_APPROVAL_POLICY", "TEACH_ROUTINE", "START_REPLAY", "RECORD_APPROVAL",
];
export const SYSTEM_ONLY: readonly CommandType[] = ["REQUEST_APPROVAL", "COMPLETE_REPLAY"];
export const LIFECYCLE: readonly CommandType[] = [
  "TEACH_ROUTINE", "START_REPLAY", "REQUEST_APPROVAL", "RECORD_APPROVAL", "COMPLETE_REPLAY",
];
