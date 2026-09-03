import { useOnceState } from "../../core/store/once-provider";
import { getReplayPlan } from "../../core/replay/replay-engine";

const labels: Record<string, string> = { collect_evidence: "Collect evidence", score: "Score", check_uncertainty: "Check uncertainty (optional)", approval: "Human approval", recommend: "Recommend" };

export function ReplayStatus() {
  const plan = getReplayPlan(useOnceState());
  if (!plan.active) return null;
  return <section className="replay-status" aria-label="Replay progress">
    <p className="eyebrow">Learned routine · {plan.routineName}</p>
    <h3>{plan.status === "completed" ? "Replay complete" : plan.status === "rejected" ? "Replay rejected" : plan.status === "awaiting_approval" ? "Replay paused" : "Replay running"}</h3>
    <p role="status">{plan.message}</p>
    <p className="muted">New inputs are bound. Learned criteria, priority, required status, and approval policy are fixed.</p>
    <ol className="replay-steps">{plan.steps.map((step) => <li key={step.id} className={`step-${step.status}`} aria-current={step.status === "active" ? "step" : undefined}>
      <span>{labels[step.kind]}</span><strong>{step.kind === "collect_evidence" ? `${plan.progress.evidence}/${plan.progress.total} · ` : step.kind === "score" ? `${plan.progress.scores}/${plan.progress.total} · ` : ""}{step.status}</strong>
    </li>)}</ol>
    {plan.status === "running" && plan.approval.decision !== "approved" ? <p className="muted">Ask your agent to read the replay plan and perform the learned work through ONCE’s WebMCP tools. Flag optional uncertainty before the final required evidence or score completes.</p> : null}
  </section>;
}
