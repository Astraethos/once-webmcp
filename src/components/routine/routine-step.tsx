import type { RoutineStep as Step } from "../../core/teaching/routine-types";

export function RoutineStep({ step }: { step: Step }) {
  switch (step.kind) {
    case "collect_evidence": return <><strong>Collect evidence</strong><span>For each candidate × criterion.</span></>;
    case "score": return <><strong>Score 1–5</strong><span>For each candidate × criterion, with a fresh rationale.</span></>;
    case "check_uncertainty": return <><strong>Check uncertainty <small>Optional</small></strong><span>Flag concerns that matter in the new evaluation.</span></>;
    case "approval": return <><strong>Human approval</strong><span>Before final recommendation.</span></>;
    case "recommend": return <><strong>Recommend</strong><span>Choose an eligible candidate and explain why.</span></>;
  }
}
