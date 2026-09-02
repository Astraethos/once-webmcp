import { useOnceState } from "../../core/store/once-provider";

const labels = { human: "HUMAN", agent: "AGENT", system: "ONCE" } as const;

export function CollaborationTrace() {
  const { trace } = useOnceState();
  return (
    <section className="panel trace" aria-labelledby="trace-heading">
      <div className="section-heading">
        <div><p className="eyebrow">One semantic history</p><h2 id="trace-heading">Collaboration Trace</h2></div>
        <span className="count">{trace.length}</span>
      </div>
      <p className="muted">What changed, and who changed it.</p>
      <div role="log" aria-label="Semantic activity" aria-live="polite" aria-relevant="additions">
        {trace.length === 0 ? <p className="trace-empty">No actions yet. Your first change will appear here.</p> : (
          <ol className="trace-list">
            {trace.map((event) => (
              <li key={event.eventId} className={event.outcome === "rejected" ? "rejected" : ""}>
                <div className="event-meta"><span className={`actor actor-${event.actor.kind}`}>{labels[event.actor.kind]}</span><span className="event-sequence">#{event.sequence}</span></div>
                <p>{event.summary}</p>
                {event.outcome === "rejected" ? <span className="rejection-label">Not applied</span> : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
