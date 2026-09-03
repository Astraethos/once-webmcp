import { useEffect, useRef } from "react";
import { useOnceState } from "../../core/store/once-provider";
import { CommandForm } from "../workspace/command-form";

export function ApprovalBanner() {
  const { replay, workspace: w } = useOnceState();
  const heading = useRef<HTMLHeadingElement>(null);
  const waiting = replay?.status === "awaiting_approval";
  useEffect(() => { if (waiting) heading.current?.focus(); }, [waiting]);
  if (!replay || !waiting) return null;
  return <section className="approval-banner" aria-labelledby="approval-heading">
    <p className="eyebrow">Human checkpoint · agent paused</p>
    <h3 id="approval-heading" tabIndex={-1} ref={heading}>Human review required</h3>
    <p>The learned routine requires your approval before final recommendation. Review the evidence, scores, required criteria, and uncertainty below. The reviewed workspace is locked.</p>
    <ul>{w.candidates.map((candidate) => {
      const eligible = w.criteria.every((c) => !c.required || w.scores.some((s) => s.candidateId === candidate.id && s.criterionId === c.id && s.score >= 3));
      return <li key={candidate.id}><strong>{candidate.name}</strong> — {eligible ? "meets all required criteria" : "fails a required criterion; cannot be recommended"}</li>;
    })}</ul>
    <p>Approve lets the agent choose an eligible vendor and write its recommendation; it does not select a vendor for you. Reject ends this run without a recommendation. Use Reset demo to begin again.</p>
    <div className="approval-actions">{(["approved", "rejected"] as const).map((decision) => <CommandForm key={decision} label={decision === "approved" ? "Approve replay" : "Reject replay"} command={() => ({ type: "RECORD_APPROVAL", payload: { runId: replay.runId, gateId: replay.approval.gateId!, decision } })}>
      <button className={decision === "rejected" ? "secondary" : undefined} type="submit">{decision === "approved" ? "Approve" : "Reject"}</button>
    </CommandForm>)}</div>
  </section>;
}
