import { createDemoSeed } from "../demo/seed";
import type { CommandRequest } from "../domain/commands";
import { applyStateCommand } from "../domain/apply-state-command";
import { ACTORS, type AppState, type CommandError, type CommandResult } from "../domain/types";
import { validateCommand } from "../domain/validate-command";
import type { SemanticEvent } from "../events/types";
import { summarizeEvent } from "../events/summarize-event";
import { loadSnapshot, serializeSnapshot, STORAGE_KEY, type StoragePort } from "../persistence/local-storage";
import { teachingPolicy } from "../teaching/teaching-policy";
import { nextReplayCommand } from "../replay/replay-engine";

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
}

export function createOnceStore(options: {
  storage?: StoragePort;
  newId?: () => string;
  now?: () => string;
} = {}) {
  const { storage, newId = () => crypto.randomUUID(), now = () => new Date().toISOString() } = options;
  const loaded = loadSnapshot(storage);
  let state = freeze(loaded.state);
  let persistenceError = loaded.error;
  const serverSnapshot = freeze(createDemoSeed());
  const listeners = new Set<() => void>();

  function commit(next: AppState, reset = false) {
    state = freeze(next);
    try {
      if (reset) storage?.removeItem(STORAGE_KEY);
      else storage?.setItem(STORAGE_KEY, serializeSnapshot(state));
      persistenceError = null;
    } catch {
      persistenceError = reset
        ? "The demo was reset in this tab, but saved state could not be cleared. Reload may restore the previous session."
        : "Changes are visible in this tab but could not be saved. Reload may lose them.";
    }
    listeners.forEach((listener) => listener());
  }

  function eventFor(request: CommandRequest, before: AppState, after: AppState, error?: CommandError): SemanticEvent {
    return {
      schemaVersion: 1, eventId: newId(), sequence: before.trace.length + 1,
      timestamp: now(), sessionId: before.sessionId,
      ...((after.replay ?? before.replay) ? { replayRunId: (after.replay ?? before.replay)!.runId } : {}),
      actor: { ...request.actor }, channel: request.channel, phase: before.phase,
      command: { id: request.id, type: request.type, payload: structuredClone(request.payload) },
      outcome: error ? "rejected" : "applied",
      summary: error ? `Blocked: ${error.message}` : summarizeEvent(request, after.workspace),
      teaching: error ? { disposition: "excluded", reason: "Rejected commands are not teaching examples." } : teachingPolicy(request, before.workspace),
      ...(error ? { error } : {}),
    };
  }

  function replayResult() {
    const run = state.replay;
    if (!run) return {};
    const next = run.status === "running" ? run.stepStatus.find((step) => step.status === "active")?.stepId : undefined;
    return { replay: { status: run.status, ...(next ? { next } : {}) } };
  }

  function executeBatch(requests: readonly CommandRequest[]): CommandResult {
    if (!Array.isArray(requests) || requests.length === 0) return { ok: false, error: { code: "INVALID_BATCH", message: "Provide at least one command." }, stateVersion: state.stateVersion };
    let working = state;
    const events: SemanticEvent[] = [];
    for (const input of requests) {
      const error = validateCommand(working, input);
      if (error) {
        // Malformed envelopes and spoofed identities are not semantic activity.
        if (error.code !== "INVALID_COMMAND" && error.code !== "UNAUTHORIZED" && error.code !== "INVALID_PAYLOAD") {
          const event = eventFor(input, state, state, error);
          commit({ ...state, stateVersion: state.stateVersion + 1, trace: [...state.trace, event] });
        }
        return { ok: false, error, stateVersion: state.stateVersion, ...replayResult() };
      }
      const request = structuredClone(input);
      const next = applyStateCommand(working, request, { id: request.type === "TEACH_ROUTINE" || request.type === "START_REPLAY" ? newId() : request.id, timestamp: now() });
      const event = eventFor(request, working, next);
      events.push(event);
      working = { ...next, trace: [...working.trace, event] };
      // System progression stays in the same atomic command/event pipeline.
      // A later invalid batch item rolls back these lifecycle events too.
      let automatic = nextReplayCommand(working);
      while (automatic) {
        const systemRequest: CommandRequest = { ...automatic, id: newId(), actor: ACTORS.system, channel: "system", phase: working.phase, replayRunId: working.replay!.runId, causationId: request.id };
        const invalid = validateCommand(working, systemRequest);
        if (invalid) throw new Error(`Invalid automatic replay transition: ${invalid.code}`);
        const progressed = applyStateCommand(working, systemRequest, { id: systemRequest.id, timestamp: now() });
        const systemEvent = eventFor(systemRequest, working, progressed);
        events.push(systemEvent);
        working = { ...progressed, trace: [...working.trace, systemEvent] };
        automatic = nextReplayCommand(working);
      }
    }
    commit({ ...working, stateVersion: state.stateVersion + 1 });
    return { ok: true, eventIds: events.map((e) => e.eventId), summary: events.length === 1 ? events[0].summary : `Applied ${events.length} semantic actions.`, stateVersion: state.stateVersion, ...replayResult() };
  }

  return {
    getState: () => state,
    getServerSnapshot: () => serverSnapshot,
    getPersistenceError: () => persistenceError,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    execute: (request: CommandRequest) => executeBatch([request]),
    executeBatch,
    resetDemo: () => commit(createDemoSeed(), true),
  };
}

export type OnceStore = ReturnType<typeof createOnceStore>;
