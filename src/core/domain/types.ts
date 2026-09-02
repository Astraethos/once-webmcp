import type { SemanticEvent } from "../events/types";

export type ActorKind = "human" | "agent" | "system";
export type Channel = "ui" | "webmcp" | "system";
export type Phase = "collaboration" | "teaching" | "replay_setup" | "replay" | "complete";
export type Actor = { kind: ActorKind; id: string; label: string };

export const ACTORS = {
  human: { kind: "human", id: "local-human", label: "Human" },
  agent: { kind: "agent", id: "webmcp-agent", label: "Agent" },
  system: { kind: "system", id: "once", label: "ONCE" },
} as const satisfies Record<ActorKind, Actor>;

export type Candidate = { id: string; name: string };
export type Criterion = {
  id: string;
  name: string;
  description?: string;
  priority: number;
  required: boolean;
};
export type Confidence = "high" | "medium" | "low";
export type Evidence = {
  id: string;
  candidateId: string;
  criterionId: string;
  summary: string;
  sourceRef: string;
  confidence: Confidence;
};
export type Score = {
  candidateId: string;
  criterionId: string;
  score: number;
  rationale: string;
};
export type Uncertainty = {
  id: string;
  candidateId?: string;
  criterionId?: string;
  note: string;
};
export type Recommendation = { candidateId: string; rationale: string };
export type EvaluationWorkspace = {
  title: string;
  budget: { amount: number | null; currency: "USD" };
  candidates: Candidate[];
  criteria: Criterion[];
  evidence: Evidence[];
  scores: Score[];
  uncertainties: Uncertainty[];
  approvalPolicy: { requiredBeforeRecommendation: boolean };
  recommendation: Recommendation | null;
};

export type AppState = {
  schemaVersion: 1;
  stateVersion: number;
  sessionId: string;
  phase: Phase;
  workspace: EvaluationWorkspace;
  trace: SemanticEvent[];
  // Lifecycle state remains inactive until the compiler and replay milestones.
  teaching: { status: "idle"; routine: null; compilerNotes: [] };
  replay: null;
};

export type CommandError = { code: string; message: string };
export type CommandResult =
  | { ok: true; eventIds: string[]; summary: string; stateVersion: number }
  | { ok: false; error: CommandError; stateVersion: number };
