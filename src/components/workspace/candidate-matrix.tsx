import type { Candidate, Criterion, Evidence, Score } from "../../core/domain/types";
import { getVendorDossier } from "../../core/demo/vendor-dossiers";
import { useOnceState } from "../../core/store/once-provider";
import { CommandForm, field } from "./command-form";

function EvidenceFields({ evidence }: { evidence?: Evidence }) {
  return <>
    <label>Evidence summary<textarea name="summary" defaultValue={evidence?.summary} required rows={3} /></label>
    <label>Source reference<input name="sourceRef" defaultValue={evidence?.sourceRef} required placeholder="e.g. aegis-security" /></label>
    <label>Confidence<select name="confidence" defaultValue={evidence?.confidence ?? "high"}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
  </>;
}

function EvidenceEditor({ evidence }: { evidence: Evidence }) {
  return <details className="cell-editor"><summary>Correct evidence</summary>
    <CommandForm key={JSON.stringify(evidence)} label="Correct evidence" command={(data) => ({ type: "REPLACE_EVIDENCE", payload: { evidenceId: evidence.id, summary: field(data, "summary"), sourceRef: field(data, "sourceRef"), confidence: field(data, "confidence") as Evidence["confidence"], reason: field(data, "reason") } })}>
      <EvidenceFields evidence={evidence} />
      <label>Reason (optional)<input name="reason" /></label><button type="submit">Save correction</button>
    </CommandForm>
  </details>;
}

function ComparisonCell({ candidate, criterion, evidence, score }: { candidate: Candidate; criterion: Criterion; evidence: Evidence[]; score?: Score }) {
  return <td>
    {evidence.length ? evidence.map((item) => <article className="evidence" key={item.id}><p>{item.summary}</p><p className="source">{item.sourceRef} · {item.confidence} confidence</p><EvidenceEditor evidence={item} /></article>) : <p className="muted">No evidence yet</p>}
    <details className="cell-editor"><summary>Attach evidence</summary>
      <CommandForm label={`Attach evidence for ${candidate.name} ${criterion.name}`} reset command={(data) => ({ type: "ATTACH_EVIDENCE", payload: { evidenceId: crypto.randomUUID(), candidateId: candidate.id, criterionId: criterion.id, summary: field(data, "summary"), sourceRef: field(data, "sourceRef"), confidence: field(data, "confidence") as Evidence["confidence"] } })}>
        <EvidenceFields /><button type="submit">Attach evidence</button>
      </CommandForm>
    </details>
    <div className="score-line"><span className="score-badge">{score ? `${score.score} / 5` : "Unscored"}</span>{criterion.required ? <span className={score && score.score >= 3 ? "form-success" : "error"}>{score && score.score >= 3 ? "Meets requirement" : "Requirement unmet"}</span> : null}</div>
    {score ? <p className="score-rationale">{score.rationale}</p> : null}
    <details className="cell-editor"><summary>{score ? "Change score" : "Set score"}</summary>
      <CommandForm key={JSON.stringify(score)} label={`Score ${candidate.name} ${criterion.name}`} command={(data) => ({ type: "SET_SCORE", payload: { candidateId: candidate.id, criterionId: criterion.id, score: Number(field(data, "score")), rationale: field(data, "rationale") } })}>
        <label>Score<select name="score" defaultValue={score?.score ?? 3}>{["Does not meet", "Materially below", "Meets", "Strong", "Excellent"].map((label, i) => <option key={label} value={i + 1}>{i + 1} — {label}</option>)}</select></label>
        <label>Score rationale<textarea name="rationale" defaultValue={score?.rationale} required rows={2} /></label><button type="submit">Save score</button>
      </CommandForm>
    </details>
  </td>;
}

export function CandidateMatrix() {
  const { workspace: w } = useOnceState();
  if (!w.candidates.length) return <div className="empty-state"><h3>A shared starting point</h3><p>Add candidates and criteria to begin comparing evidence together.</p></div>;
  return <div className="matrix-scroll" role="region" aria-label="Vendor comparison" tabIndex={0}>
    <table className="comparison-matrix">
      <caption>Vendor comparison · criteria ordered by priority</caption>
      <thead><tr><th scope="col">Evaluation policy</th>{w.candidates.map((candidate) => {
        const result = getVendorDossier(candidate.name);
        return <th scope="col" key={candidate.id}><h3>{candidate.name}</h3><details className="dossier"><summary>View demo dossier</summary>{result.ok ? <><p className="source">Fictional first-party facts</p>{result.dossier.facts.map((fact) => <p key={fact.sourceRef}><strong>{fact.category}</strong><br />{fact.statement}<br /><span className="source">{fact.sourceRef}</span></p>)}</> : <p className="muted">{result.error.message}</p>}</details></th>;
      })}</tr></thead>
      <tbody>{w.criteria.map((criterion) => <tr key={criterion.id}>
        <th scope="row"><h3>{criterion.priority}. {criterion.name}</h3>{criterion.required ? <span className="required-badge">Required</span> : null}{criterion.description ? <p className="source">{criterion.description}</p> : null}
          <CommandForm key={criterion.priority} label={`Priority for ${criterion.name}`} command={(data) => ({ type: "SET_CRITERION_PRIORITY", payload: { criterionId: criterion.id, priority: Number(field(data, "priority")) } })}>
            <label>Priority<select name="priority" defaultValue={criterion.priority}>{w.criteria.map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label><button type="submit" className="secondary">Save priority</button>
          </CommandForm>
          <CommandForm key={String(criterion.required)} label={`Required status for ${criterion.name}`} command={() => ({ type: "SET_CRITERION_REQUIRED", payload: { criterionId: criterion.id, required: !criterion.required } })}><button type="submit" className="secondary">{criterion.required ? "Make optional" : "Make required"}</button></CommandForm>
        </th>
        {w.candidates.map((candidate) => <ComparisonCell key={candidate.id} candidate={candidate} criterion={criterion} evidence={w.evidence.filter((e) => e.candidateId === candidate.id && e.criterionId === criterion.id)} score={w.scores.find((s) => s.candidateId === candidate.id && s.criterionId === criterion.id)} />)}
      </tr>)}</tbody>
    </table>
    {!w.criteria.length ? <p className="muted">Add criteria to build the comparison matrix.</p> : null}
  </div>;
}
