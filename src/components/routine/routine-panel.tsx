import { useEffect, useRef } from "react";
import { useOnceState } from "../../core/store/once-provider";
import { validateTeaching } from "../../core/teaching/validate-teaching";
import { CommandForm, field } from "../workspace/command-form";
import { RoutineStep } from "./routine-step";
import { ReplayLauncher } from "../replay/replay-launcher";

export function RoutinePanel() {
  const state = useOnceState();
  const routine = state.teaching.routine;
  const heading = useRef<HTMLHeadingElement>(null);
  const previous = useRef(routine);
  useEffect(() => {
    if (routine && !previous.current && state.phase === "teaching") heading.current?.focus();
    previous.current = routine;
  }, [routine, state.phase]);
  const readiness = validateTeaching(state, "Vendor Security Review");
  return <section className={`panel routine-panel ${routine ? "routine-learned" : "routine-empty"}`} aria-labelledby="routine-heading">
    <p className="eyebrow">Memory Rail · {routine ? "Learned routine" : "Teach"}</p>
    <h2 id="routine-heading" ref={heading} tabIndex={-1}>{routine?.name ?? "Routine"}</h2>
    {!routine ? <>
      <CommandForm label="Teach this routine" command={(data) => ({ type: "TEACH_ROUTINE", payload: { routineName: field(data, "routineName") } })}>
        <label>Routine name<input name="routineName" required defaultValue="Vendor Security Review" /></label>
        <button type="submit">Teach this routine</button>
      </CommandForm>
      <p className="muted teaching-readiness">{readiness?.message ?? "Ready to teach the procedures observed in this collaboration."}</p>
      <p className="muted">Turn this collaboration into a Vendor Evaluation routine. Inputs change, policies stay fixed, and observed work becomes a procedure.</p>
      <p className="teaching-boundary">One-off corrections are example only — not generalized. ONCE uses defined Vendor Evaluation rules; it does not infer arbitrary workflows.</p>
    </> : <>
      <p className="form-success" role="status">Routine learned. Review what changes and what stays fixed.</p>
      <ReplayLauncher />
      <div className="routine-group">
        <h3><span className="routine-label variable-label">Variable</span> Inputs</h3>
        <ul className="routine-inputs">{routine.inputs.map((input) => <li key={input.key}><strong>{input.key === "budget" ? "Budget" : "Candidates"}</strong><span>{input.type === "money" ? "New amount in USD each run" : `${input.minItems}–${input.maxItems} new candidates each run`}</span></li>)}</ul>
      </div>
      <div className="routine-group">
        <h3><span className="routine-label policy-label">Fixed</span> Policies</h3>
        <ol className="routine-policies">{routine.policies.criteria.map((criterion) => <li key={criterion.routineCriterionId} value={criterion.priority}><strong>{criterion.name}</strong> <span className={criterion.required ? "required-badge" : "muted"}>{criterion.required ? "Required · score ≥ 3" : "Optional"}</span>{criterion.description ? <p>{criterion.description}</p> : null}</li>)}</ol>
        <p className="muted">Priority order and required status carry forward.</p>
      </div>
      <div className="routine-group">
        <h3><span className="routine-label procedure-label">Repeat</span> Agent procedure</h3>
        <ol className="routine-steps">{routine.steps.map((step) => <li key={step.id} className={step.kind === "approval" ? "routine-gate-step" : ""}><RoutineStep step={step} /></li>)}</ol>
        <p className="muted">Only observed procedure types are included.</p>
      </div>
      <div className="routine-group human-checkpoint">
        <h3>Human checkpoint</h3>
        <p>{routine.policies.approval.requiredBeforeRecommendation ? "Human approval is required before final recommendation." : "No human approval boundary was required in this collaboration."}</p>
        {routine.policies.approval.requiredBeforeRecommendation && !routine.steps.some((step) => step.kind === "recommend") ? <p className="muted">Approval policy is saved. No recommendation procedure was observed, so no gate step was added.</p> : null}
      </div>
      <div className="routine-group">
        <h3>Generated each run</h3>
        <p>Evidence text, sources and confidence; scores and rationales; uncertainty notes; recommendation choice and text.</p>
        <p className="muted">These session values are excluded from the routine.</p>
      </div>
      <div className="routine-group example-only">
        <h3>Example only — not generalized</h3>
        {routine.compilerNotes.filter((note) => note.kind === "example_only").length ? <ul>{routine.compilerNotes.filter((note) => note.kind === "example_only").map((note) => <li key={note.message}>{note.message}</li>)}</ul> : <p>No one-off human evidence or score corrections were observed.</p>}
        <p className="muted">ONCE does not infer new business rules from correction text.</p>
      </div>
      <p className="scope-note">Saved in this browser. Replay repeats only these learned Vendor Evaluation procedures with new inputs. Example-only corrections remain historical context.</p>
    </>}
  </section>;
}
