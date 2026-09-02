import { useState, type SubmitEvent } from "react";
import { useOnceState, useOnceStore } from "../../core/store/once-provider";
import { addCandidateFromUI } from "../../core/store/ui-commands";

export function EvaluationWorkspace() {
  const store = useOnceStore();
  const { workspace } = useOnceState();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addCandidate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = addCandidateFromUI(store, name);
    if (result.ok) {
      setName("");
      setError(null);
    } else setError(result.error.message);
  }

  return (
    <section className="panel workspace" aria-labelledby="workspace-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Shared workspace</p>
          <h2 id="workspace-heading">{workspace.title}</h2>
        </div>
        <span className="count">{workspace.candidates.length} candidate{workspace.candidates.length === 1 ? "" : "s"}</span>
      </div>
      <p className="muted">Start with the vendors you want to compare. You and your agent work on the same list.</p>
      <form onSubmit={addCandidate} className="candidate-form">
        <label htmlFor="candidate-name">Vendor name</label>
        <div className="input-row">
          <input id="candidate-name" name="candidate" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Aegis Cloud" required aria-describedby={error ? "candidate-error" : undefined} aria-invalid={error ? true : undefined} />
          <button type="submit">Add candidate</button>
        </div>
        {error ? <p id="candidate-error" className="error" role="alert">{error}</p> : null}
      </form>
      {workspace.candidates.length === 0 ? (
        <div className="empty-state">
          <h3>A shared starting point</h3>
          <p>Add your first candidate above. In a supported browser, your agent can add another through WebMCP.</p>
        </div>
      ) : (
        <ul className="candidate-list" aria-label="Vendor candidates">
          {workspace.candidates.map((candidate, index) => (
            <li key={candidate.id}><span className="candidate-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><h3>{candidate.name}</h3></li>
          ))}
        </ul>
      )}
      <p className="scope-note">M2 · Candidate entry only. Evaluation, teaching, and replay are not available yet.</p>
    </section>
  );
}
