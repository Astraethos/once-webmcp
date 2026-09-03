import { useOnceState } from "../../core/store/once-provider";
import { validateReplayReadiness } from "../../core/replay/replay-engine";
import { CommandForm, field } from "../workspace/command-form";

export function ReplayLauncher() {
  const { teaching, phase } = useOnceState();
  const routine = teaching.routine;
  if (!routine || phase !== "teaching") return null;
  const readiness = validateReplayReadiness(routine);
  return <div className="replay-launcher">
    <details>
      <summary>Replay with new inputs</summary>
      <p>Keep the learned policy. Start with a new budget and 2–4 vendors; evidence, scores, uncertainty, and recommendation start empty.</p>
      {readiness ? <p className="readiness-note">{readiness.message} The routine is still learned and saved; no missing procedure will be added.</p> : null}
      <CommandForm label="Start replay" command={(data) => ({ type: "START_REPLAY", payload: {
        routineId: routine.id, budget: Number(field(data, "budget")), currency: "USD",
        candidates: [1, 2, 3, 4].map((i) => field(data, `candidate${i}`)).filter((name, i) => i < 2 || name.trim()).map((name) => ({ candidateId: crypto.randomUUID(), name })),
      } })}>
        <label>New budget (USD)<input type="number" name="budget" min="0" step="any" required defaultValue="18000" /></label>
        {[1, 2, 3, 4].map((i) => <label key={i}>New vendor {i}{i > 2 ? " (optional)" : ""}<input name={`candidate${i}`} required={i <= 2} defaultValue={i === 1 ? "Northwind AI" : i === 2 ? "Orchid Systems" : ""} /></label>)}
        <button type="submit">Start replay</button>
      </CommandForm>
    </details>
  </div>;
}
