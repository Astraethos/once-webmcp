import type { Candidate } from "../domain/types";

export type ReplayState = {
  runId: string;
  routineId: string;
  status: "running" | "awaiting_approval" | "rejected" | "completed" | "failed";
  bindings: {
    budget: { amount: number; currency: "USD" };
    candidates: Candidate[];
  };
  stepStatus: { stepId: string; status: "pending" | "active" | "complete" | "skipped" }[];
  approval: { gateId: string | null; decision: "pending" | "approved" | "rejected" | null };
  error?: { code: string; message: string };
};
