import { compileRoutine } from "../teaching/compiler";
import { createDemoSeed } from "../demo/seed";
import { ACTORS, type AppState } from "../domain/types";
import { isCommandType, isRecord, nonempty, validPayload } from "../domain/validate-command";

export const STORAGE_KEY = "once:v1:state";
export type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const natural = (v: unknown) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const unique = (values: string[]) => new Set(values).size === values.length;

function validSnapshot(value: unknown): value is AppState {
  if (!isRecord(value) || value.schemaVersion !== 1 || !natural(value.stateVersion) || !nonempty(value.sessionId) || (value.phase !== "collaboration" && value.phase !== "teaching") || value.replay !== null) return false;
  if (!isRecord(value.teaching) || !Array.isArray(value.teaching.compilerNotes)) return false;
  const w = value.workspace;
  if (!isRecord(w) || !nonempty(w.title) || !isRecord(w.budget) || w.budget.currency !== "USD" || (w.budget.amount !== null && !validPayload("SET_BUDGET", w.budget))) return false;
  if (!Array.isArray(w.candidates) || !Array.isArray(w.criteria) || !Array.isArray(w.evidence) || !Array.isArray(w.scores) || !Array.isArray(w.uncertainties)) return false;
  if (!w.candidates.every((c) => isRecord(c) && validPayload("ADD_CANDIDATE", { candidateId: c.id, name: c.name }))) return false;
  if (!w.criteria.every((c) => isRecord(c) && validPayload("ADD_CRITERION", { criterionId: c.id, name: c.name, priority: c.priority, required: c.required, ...(c.description !== undefined ? { description: c.description } : {}) }))) return false;
  const candidateIds = w.candidates.map((c) => c.id as string);
  const criterionIds = w.criteria.map((c) => c.id as string);
  const candidateExists = (id: unknown) => typeof id === "string" && candidateIds.includes(id);
  const criterionExists = (id: unknown) => typeof id === "string" && criterionIds.includes(id);
  if (!unique(candidateIds) || !unique(criterionIds) || !unique(w.candidates.map((c) => c.name.trim().toLowerCase())) || !unique(w.criteria.map((c) => c.name.trim().toLowerCase()))) return false;
  if (!w.criteria.every((c, index) => c.priority === index + 1)) return false;
  if (!w.evidence.every((e) => {
    if (!isRecord(e)) return false;
    const { id, ...fields } = e;
    return validPayload("ATTACH_EVIDENCE", { evidenceId: id, ...fields }) && candidateExists(e.candidateId) && criterionExists(e.criterionId);
  }) || !unique(w.evidence.map((e) => e.id))) return false;
  if (!w.scores.every((s) => isRecord(s) && validPayload("SET_SCORE", s) && candidateExists(s.candidateId) && criterionExists(s.criterionId)) || !unique(w.scores.map((s) => JSON.stringify([s.candidateId, s.criterionId])))) return false;
  if (!w.uncertainties.every((u) => {
    if (!isRecord(u)) return false;
    const { id, ...fields } = u;
    return validPayload("FLAG_UNCERTAINTY", { uncertaintyId: id, ...fields }) && (u.candidateId === undefined || candidateExists(u.candidateId)) && (u.criterionId === undefined || criterionExists(u.criterionId));
  }) || !unique(w.uncertainties.map((u) => u.id))) return false;
  if (!validPayload("SET_APPROVAL_POLICY", w.approvalPolicy)) return false;
  if (w.recommendation !== null && (!isRecord(w.recommendation) || !validPayload("SET_RECOMMENDATION", w.recommendation) || !candidateExists(w.recommendation.candidateId))) return false;
  if (!Array.isArray(value.trace)) return false;
  const phases = ["collaboration", "teaching", "replay_setup", "replay", "complete"];
  const dispositions = ["variable", "policy", "procedure", "example_only", "lifecycle", "excluded"];
  return value.trace.every((e, index) => {
    if (!isRecord(e) || e.schemaVersion !== 1 || e.sequence !== index + 1 || !nonempty(e.eventId) || !nonempty(e.timestamp) || !Number.isFinite(Date.parse(e.timestamp)) || e.sessionId !== value.sessionId || typeof e.phase !== "string" || !phases.includes(e.phase)) return false;
    if (!isRecord(e.actor) || typeof e.actor.kind !== "string" || !Object.hasOwn(ACTORS, e.actor.kind)) return false;
    const actor = ACTORS[e.actor.kind as keyof typeof ACTORS];
    if (e.actor.id !== actor.id || e.actor.label !== actor.label || e.channel !== { human: "ui", agent: "webmcp", system: "system" }[actor.kind]) return false;
    if (!isRecord(e.command) || !nonempty(e.command.id) || !isCommandType(e.command.type) || !Object.hasOwn(e.command, "payload")) return false;
    if (e.replayRunId !== undefined && !nonempty(e.replayRunId)) return false;
    if (!nonempty(e.summary) || !isRecord(e.teaching) || typeof e.teaching.disposition !== "string" || !dispositions.includes(e.teaching.disposition) || !nonempty(e.teaching.reason)) return false;
    return e.outcome === "applied"
      ? validPayload(e.command.type, e.command.payload) && e.error === undefined
      : e.outcome === "rejected" && isRecord(e.error) && nonempty(e.error.code) && nonempty(e.error.message);
  }) && unique(value.trace.map((e) => e.eventId)) && validTeachingSnapshot(value);
}

function validTeachingSnapshot(value: Record<string, unknown>): boolean {
  const teaching = value.teaching as Record<string, unknown>;
  if (teaching.status === "idle") return value.phase === "collaboration" && teaching.routine === null && (teaching.compilerNotes as unknown[]).length === 0;
  if (teaching.status !== "compiled" || value.phase !== "teaching" || !isRecord(teaching.routine)) return false;
  const routine = teaching.routine;
  if (!nonempty(routine.id) || !nonempty(routine.name) || !nonempty(routine.createdAt) || !Number.isFinite(Date.parse(routine.createdAt))) return false;
  // The source workspace and trace above are validated. Recompilation checks
  // every nested routine field and prevents stored literals becoming rules.
  const compiled = compileRoutine(value as AppState, { id: routine.id, name: routine.name, createdAt: routine.createdAt });
  return compiled.ok && JSON.stringify(compiled.routine) === JSON.stringify(routine) && JSON.stringify(compiled.routine.compilerNotes) === JSON.stringify(teaching.compilerNotes);
}

export function serializeSnapshot(state: AppState): string {
  return JSON.stringify(state);
}

export function deserializeSnapshot(raw: string | null): AppState {
  if (raw === null) return createDemoSeed();
  try {
    const value: unknown = JSON.parse(raw);
    return validSnapshot(value) ? value : createDemoSeed();
  } catch {
    return createDemoSeed();
  }
}

export function loadSnapshot(storage?: StoragePort): { state: AppState; error: string | null } {
  if (!storage) return { state: createDemoSeed(), error: null };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const state = deserializeSnapshot(raw);
    if (raw !== null && state.stateVersion === 0 && state.trace.length === 0 && raw !== serializeSnapshot(state)) storage.removeItem(STORAGE_KEY);
    return { state, error: null };
  } catch {
    return { state: createDemoSeed(), error: "Saved state is unavailable. Changes will remain in this tab until storage is available." };
  }
}
