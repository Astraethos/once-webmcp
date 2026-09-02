import type { AppState } from "./types";

export function createInitialState(): AppState {
  return {
    schemaVersion: 1,
    stateVersion: 0,
    sessionId: "once-demo-session",
    phase: "collaboration",
    workspace: {
      title: "Vendor Evaluation",
      budget: { amount: null, currency: "USD" },
      candidates: [], criteria: [], evidence: [], scores: [], uncertainties: [],
      approvalPolicy: { requiredBeforeRecommendation: false },
      recommendation: null,
    },
    trace: [],
    teaching: { status: "idle", routine: null, compilerNotes: [] },
    replay: null,
  };
}
