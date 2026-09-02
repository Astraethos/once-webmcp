import { createDemoSeed } from "../demo/seed";
import type { CommandRequest } from "../domain/commands";
import { applyCommand } from "../domain/apply-command";
import type { AppState, CommandError, CommandResult } from "../domain/types";
import { validateCommand } from "../domain/validate-command";
import type { SemanticEvent } from "../events/types";
import { summarizeEvent } from "../events/summarize-event";
import { loadSnapshot, serializeSnapshot, STORAGE_KEY, type StoragePort } from "../persistence/local-storage";
import { teachingPolicy } from "../teaching/teaching-policy";

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
      ...(request.replayRunId ? { replayRunId: request.replayRunId } : {}),
      actor: { ...request.actor }, channel: request.channel, phase: before.phase,
      command: { id: request.id, type: request.type, payload: structuredClone(request.payload) },
      outcome: error ? "rejected" : "applied",
      summary: error ? `Blocked: ${error.message}` : summarizeEvent(request, after.workspace),
      teaching: error ? { disposition: "excluded", reason: "Rejected commands are not teaching examples." } : teachingPolicy(request, before.workspace),
      ...(error ? { error } : {}),
    };
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
        return { ok: false, error, stateVersion: state.stateVersion };
      }
      const request = structuredClone(input);
      const next = { ...working, workspace: applyCommand(working.workspace, request) };
      const event = eventFor(request, working, next);
      events.push(event);
      working = { ...next, trace: [...working.trace, event] };
    }
    commit({ ...working, stateVersion: state.stateVersion + 1 });
    return { ok: true, eventIds: events.map((e) => e.eventId), summary: events.length === 1 ? events[0].summary : `Applied ${events.length} semantic actions.`, stateVersion: state.stateVersion };
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
