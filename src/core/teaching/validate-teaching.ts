import type { CommandError } from "../domain/types";
import type { TeachingSource } from "./compiler";
import { TEACHING_POLICIES } from "./teaching-policy";

// The M4 Vendor Evaluation precondition; it does not require a full matrix
// or every procedure. Conditional compilation is intentional.
export function validateTeaching(source: TeachingSource, routineName: string): CommandError | null {
  if (typeof routineName !== "string" || !routineName.trim()) return { code: "INVALID_PAYLOAD", message: "Check the command fields and try again." };
  const w = source.workspace;
  if (w.budget.currency !== "USD" || (w.budget.amount !== null && (typeof w.budget.amount !== "number" || !Number.isFinite(w.budget.amount) || w.budget.amount < 0))) return { code: "INVALID_PAYLOAD", message: "Check the command fields and try again." };
  const observed = source.trace.some((event) => event.sessionId === source.sessionId && event.phase === "collaboration" && event.outcome === "applied" && TEACHING_POLICIES[event.command.type].step);
  if (w.budget.amount === null || w.candidates.length < 2 || w.candidates.length > 4 || w.criteria.length < 1 || !observed) return {
    code: "TEACHING_INCOMPLETE",
    message: "To teach, set a budget, add 2–4 candidates and at least one criterion, then collect evidence, score, flag uncertainty, or recommend.",
  };
  return null;
}
