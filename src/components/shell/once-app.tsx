"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { OnceProvider, useOnceState, useOnceStore } from "../../core/store/once-provider";
import { registerTools, type WebMCPStatus } from "../../webmcp/register-tools";
import { EvaluationWorkspace } from "../workspace/evaluation-workspace";
import { RoutinePanel } from "../routine/routine-panel";
import { CollaborationTrace } from "../trace/collaboration-trace";

const capabilityText: Record<WebMCPStatus, string> = {
  checking: "Checking native WebMCP…",
  ready: "Native WebMCP registered · 10 tools",
  unavailable: "WebMCP is unavailable in this browser. You can still use the human workspace.",
  failed: "WebMCP registration failed. Reload in a supported browser; the human workspace remains available.",
  cancelled: "WebMCP registration ended.",
};

function WorkspaceShell() {
  const store = useOnceStore();
  const { sessionId, stateVersion, phase, replay } = useOnceState();
  const [webmcp, setWebmcp] = useState<WebMCPStatus>("checking");
  const [resetCount, setResetCount] = useState(0);
  const persistenceError = useSyncExternalStore(store.subscribe, store.getPersistenceError, () => null);

  useEffect(() => {
    let active = true;
    const registration = registerTools(store);
    registration.ready.then((status) => { if (active) setWebmcp(status); });
    return () => { active = false; registration.dispose(); };
  }, [store]);

  function resetDemo() {
    if (!window.confirm("Reset the demo? This clears the workspace, collaboration trace, learned routine, and replay saved in this browser.")) return;
    store.resetDemo();
    setResetCount((count) => count + 1);
  }

  return (
    <main className="once-app">
      <header className="app-header">
        <div><h1 className="wordmark">ONCE<span aria-hidden="true">.</span></h1><p className="tagline">Teach an agent by working with it once.</p></div>
        <button className="secondary" onClick={resetDemo}>Reset demo</button>
      </header>
      <nav className="phase-bar" aria-label="Evaluation phases">{["Collaborate", "Teach", "Replay", "Approve", "Complete"].map((label) => {
        const current = phase === "complete" ? "Complete" : replay?.status === "awaiting_approval" ? "Approve" : phase === "replay" ? "Replay" : phase === "teaching" ? "Teach" : "Collaborate";
        return <span key={label} className={label === current ? "phase" : "muted"} aria-current={label === current ? "step" : undefined}>{label}</span>;
      })}</nav>
      <p className={`capability capability-${webmcp}`} role="status">{capabilityText[webmcp]}</p>
      {persistenceError ? <p className="storage-warning" role="alert">{persistenceError}</p> : null}
      <div className="workspace-layout">
        <EvaluationWorkspace key={`${sessionId}-${resetCount}-${replay?.runId ?? "collaboration"}`} />
        <aside className="memory-rail" aria-label="Memory Rail">
          <CollaborationTrace />
          <RoutinePanel key={`${sessionId}-${resetCount}`} />
        </aside>
      </div>
      <footer><span>Local demo · no account or external research</span><span>Snapshot {stateVersion}</span></footer>
    </main>
  );
}

export function OnceApp() {
  return <OnceProvider><WorkspaceShell /></OnceProvider>;
}
