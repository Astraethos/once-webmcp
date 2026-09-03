import { useOnceState } from "../../core/store/once-provider";
import { CandidateMatrix } from "./candidate-matrix";
import { CommandForm, field } from "./command-form";

export function EvaluationWorkspace() {
  const { workspace: w } = useOnceState();
  const recommendation = w.recommendation;
  const recommended = w.candidates.find((c) => c.id === recommendation?.candidateId);
  const unmet = recommendation && w.criteria.some((c) => c.required && !w.scores.some((s) => s.candidateId === recommendation.candidateId && s.criterionId === c.id && s.score >= 3));
  return <section className="panel workspace" aria-labelledby="workspace-heading">
    <div className="section-heading"><div><p className="eyebrow">Shared workspace</p><h2 id="workspace-heading">{w.title}</h2></div><span className="count">{w.candidates.length} candidates · {w.criteria.length} criteria</span></div>
    <p className="muted">Compare fictional vendors using ONCE’s first-party dossiers. You and your agent share the evidence and decisions.</p>
    <div className="budget-heading"><h3>Annual budget</h3><strong>{w.budget.amount === null ? "Not set" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(w.budget.amount)}</strong></div>
    <CommandForm key={w.budget.amount} label="Set budget" command={(data) => ({ type: "SET_BUDGET", payload: { amount: Number(field(data, "amount")), currency: "USD" } })}>
      <label>Budget (USD)<input type="number" name="amount" min="0" step="any" defaultValue={w.budget.amount ?? ""} required placeholder="24000" /></label><button type="submit">Save budget</button>
    </CommandForm>
    <div className="setup-controls">
      <details><summary>Add candidates</summary><CommandForm label="Add candidate" reset command={(data) => ({ type: "ADD_CANDIDATE", payload: { candidateId: crypto.randomUUID(), name: field(data, "name") } })}><label>Vendor name<input name="name" required placeholder="e.g. Aegis Cloud" /></label><button type="submit">Add candidate</button></CommandForm></details>
      <details><summary>Add criteria</summary><CommandForm label="Add criterion" reset command={(data) => ({ type: "ADD_CRITERION", payload: { criterionId: crypto.randomUUID(), name: field(data, "name"), description: field(data, "description"), priority: Number(field(data, "priority")), required: data.has("required") } })}><label>Criterion name<input name="name" required placeholder="e.g. Security" /></label><label>Description (optional)<input name="description" /></label><label>Initial priority<input name="priority" type="number" min="1" step="1" defaultValue={w.criteria.length + 1} required /></label><label className="checkbox-label"><input name="required" type="checkbox" />Required (score at least 3)</label><button type="submit">Add criterion</button></CommandForm></details>
    </div>
    <p className="score-guide">Scores: 1 does not meet · 2 materially below · 3 meets · 4 strong · 5 excellent. Required criteria must score at least 3.</p>
    <CandidateMatrix />
    <section className="workspace-section" aria-labelledby="uncertainty-heading"><h3 id="uncertainty-heading">Uncertainty</h3>
      {!w.uncertainties.length ? <p className="muted">No uncertainty flagged yet.</p> : <ul className="uncertainty-list">{w.uncertainties.map((u) => <li key={u.id}><strong>{[w.candidates.find((c) => c.id === u.candidateId)?.name, w.criteria.find((c) => c.id === u.criterionId)?.name].filter(Boolean).join(" → ") || "Evaluation"}</strong><p>{u.note}</p></li>)}</ul>}
      <details><summary>Flag uncertainty</summary><CommandForm label="Flag uncertainty" reset command={(data) => ({ type: "FLAG_UNCERTAINTY", payload: { uncertaintyId: crypto.randomUUID(), note: field(data, "note"), ...(field(data, "candidateId") ? { candidateId: field(data, "candidateId") } : {}), ...(field(data, "criterionId") ? { criterionId: field(data, "criterionId") } : {}) } })}>
        <label>Candidate (optional)<select name="candidateId"><option value="">Whole evaluation</option>{w.candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Criterion (optional)<select name="criterionId"><option value="">All criteria</option>{w.criteria.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Uncertainty note<textarea name="note" required rows={2} /></label><button type="submit">Flag uncertainty</button>
      </CommandForm></details>
    </section>
    <section className="workspace-section recommendation" aria-labelledby="recommendation-heading"><p className="eyebrow">Current collaboration</p><h3 id="recommendation-heading">Initial recommendation</h3>
      {recommendation ? <><h4>{recommended?.name}</h4><p>{recommendation.rationale}</p>{unmet ? <p className="error" role="status">This earlier recommendation no longer meets the required criteria. Review the scores and update the recommendation.</p> : null}</> : <p className="muted">No recommendation yet.</p>}
      {!!w.candidates.length && <details><summary>{recommendation ? "Update recommendation" : "Set recommendation"}</summary><CommandForm key={JSON.stringify(recommendation)} label="Set recommendation" command={(data) => ({ type: "SET_RECOMMENDATION", payload: { candidateId: field(data, "candidateId"), rationale: field(data, "rationale") } })}>
        <label>Recommended candidate<select name="candidateId" defaultValue={recommendation?.candidateId}>{w.candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Recommendation rationale<textarea name="rationale" defaultValue={recommendation?.rationale} required rows={3} /></label><button type="submit">Save recommendation</button>
      </CommandForm></details>}
    </section>
    <section className="workspace-section approval-policy"><h3>Human approval policy</h3><p className="muted">Save a policy for a future routine. Approval will be enforced during replay; this collaboration keeps its initial recommendation.</p>
      <CommandForm key={String(w.approvalPolicy.requiredBeforeRecommendation)} label="Human approval policy" command={(data) => ({ type: "SET_APPROVAL_POLICY", payload: { requiredBeforeRecommendation: data.has("required") } })}><label className="checkbox-label"><input type="checkbox" name="required" defaultChecked={w.approvalPolicy.requiredBeforeRecommendation} />Require human approval before final recommendation</label><button type="submit" className="secondary">Save approval policy</button></CommandForm>
    </section>
  </section>;
}
