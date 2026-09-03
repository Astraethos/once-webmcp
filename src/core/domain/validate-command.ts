import { HUMAN_ONLY, LIFECYCLE, SYSTEM_ONLY, type CommandRequest, type CommandType } from "./commands";
import { validateTeaching } from "../teaching/validate-teaching";
import { ACTORS, type AppState, type CommandError } from "./types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
export const nonempty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const text = (value: unknown) => typeof value === "string";
const boolean = (value: unknown) => typeof value === "boolean";
const money = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const priority = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
const confidence = (value: unknown) => typeof value === "string" && ["high", "medium", "low"].includes(value);
type Rule = (value: unknown) => boolean;
type Shape = { required: Record<string, Rule>; optional?: Record<string, Rule> };

const shapes: Record<CommandType, Shape> = {
  SET_BUDGET: { required: { amount: money, currency: (v) => v === "USD" } },
  ADD_CANDIDATE: { required: { candidateId: nonempty, name: nonempty } },
  ADD_CRITERION: { required: { criterionId: nonempty, name: nonempty, priority, required: boolean }, optional: { description: text } },
  SET_CRITERION_PRIORITY: { required: { criterionId: nonempty, priority } },
  SET_CRITERION_REQUIRED: { required: { criterionId: nonempty, required: boolean } },
  ATTACH_EVIDENCE: { required: { evidenceId: nonempty, candidateId: nonempty, criterionId: nonempty, summary: nonempty, sourceRef: nonempty, confidence } },
  REPLACE_EVIDENCE: { required: { evidenceId: nonempty, summary: nonempty, sourceRef: nonempty, confidence }, optional: { reason: text } },
  SET_SCORE: { required: { candidateId: nonempty, criterionId: nonempty, score: (v) => priority(v) && Number(v) <= 5, rationale: nonempty } },
  FLAG_UNCERTAINTY: { required: { uncertaintyId: nonempty, note: nonempty }, optional: { candidateId: nonempty, criterionId: nonempty } },
  SET_APPROVAL_POLICY: { required: { requiredBeforeRecommendation: boolean } },
  SET_RECOMMENDATION: { required: { candidateId: nonempty, rationale: nonempty } },
  TEACH_ROUTINE: { required: { routineName: nonempty } },
  START_REPLAY: { required: {
    routineId: nonempty, budget: money, currency: (v) => v === "USD",
    candidates: (v) => Array.isArray(v) && v.length >= 2 && v.length <= 4 && v.every((item) => matchesShape(item, shapes.ADD_CANDIDATE)),
  } },
  REQUEST_APPROVAL: { required: { runId: nonempty, gateId: nonempty, message: nonempty } },
  RECORD_APPROVAL: { required: { runId: nonempty, gateId: nonempty, decision: (v) => v === "approved" || v === "rejected" } },
  COMPLETE_REPLAY: { required: { runId: nonempty } },
};

function matchesShape(value: unknown, shape: Shape): boolean {
  if (!isRecord(value)) return false;
  const rules = { ...shape.required, ...shape.optional };
  return Object.entries(shape.required).every(([key, rule]) => rule(value[key])) &&
    Object.entries(value).every(([key, item]) => Object.hasOwn(rules, key) && rules[key](item));
}

export function isCommandType(value: unknown): value is CommandType {
  return typeof value === "string" && Object.hasOwn(shapes, value);
}

export function validPayload(type: CommandType, payload: unknown): boolean {
  return matchesShape(payload, shapes[type]);
}

const error = (code: string, message: string): CommandError => ({ code, message });
const normalized = (name: string) => name.trim().toLowerCase();

export function validateCommand(state: AppState, request: CommandRequest): CommandError | null {
  if (!isRecord(request) || !isCommandType(request.type)) return error("INVALID_COMMAND", "Unknown semantic command.");
  const actor = request.actor;
  if (!isRecord(actor) || !Object.hasOwn(ACTORS, actor.kind)) return error("UNAUTHORIZED", "A canonical actor is required.");
  const canonical = ACTORS[actor.kind];
  const channel = { human: "ui", agent: "webmcp", system: "system" }[actor.kind];
  if (actor.id !== canonical.id || actor.label !== canonical.label || request.channel !== channel ||
      (HUMAN_ONLY.includes(request.type) && actor.kind !== "human") ||
      (SYSTEM_ONLY.includes(request.type) && actor.kind !== "system") ||
      (actor.kind === "system" && !SYSTEM_ONLY.includes(request.type))) {
    return error("UNAUTHORIZED", "This actor and channel cannot perform this command.");
  }
  if (!nonempty(request.id) || !validPayload(request.type, request.payload) ||
      (request.causationId !== undefined && !nonempty(request.causationId)) ||
      (request.replayRunId !== undefined && !nonempty(request.replayRunId))) {
    return error("INVALID_PAYLOAD", "Check the command fields and try again.");
  }
  const w = state.workspace;
  const p = request.payload;
  if ("candidateId" in p && request.type !== "ADD_CANDIDATE" && p.candidateId !== undefined && !w.candidates.some((c) => c.id === p.candidateId)) {
    return error("CANDIDATE_NOT_FOUND", "The referenced candidate does not exist.");
  }
  if ("criterionId" in p && request.type !== "ADD_CRITERION" && p.criterionId !== undefined && !w.criteria.some((c) => c.id === p.criterionId)) {
    return error("CRITERION_NOT_FOUND", "The referenced criterion does not exist.");
  }
  switch (request.type) {
    case "ADD_CANDIDATE":
      if (w.candidates.some((c) => c.id === request.payload.candidateId || normalized(c.name) === normalized(request.payload.name))) return error("DUPLICATE_CANDIDATE", "A candidate with this name or ID already exists.");
      break;
    case "ADD_CRITERION":
      if (w.criteria.some((c) => c.id === request.payload.criterionId || normalized(c.name) === normalized(request.payload.name))) return error("DUPLICATE_CRITERION", "A criterion with this name or ID already exists.");
      break;
    case "ATTACH_EVIDENCE":
      if (w.evidence.some((e) => e.id === request.payload.evidenceId)) return error("DUPLICATE_EVIDENCE", "Evidence with this ID already exists.");
      break;
    case "REPLACE_EVIDENCE":
      if (!w.evidence.some((e) => e.id === request.payload.evidenceId)) return error("EVIDENCE_NOT_FOUND", "The evidence to correct does not exist.");
      break;
    case "FLAG_UNCERTAINTY":
      if (w.uncertainties.some((u) => u.id === request.payload.uncertaintyId)) return error("DUPLICATE_UNCERTAINTY", "Uncertainty with this ID already exists.");
      break;
    case "SET_RECOMMENDATION":
      if (w.criteria.some((c) => c.required && !w.scores.some((s) => s.candidateId === request.payload.candidateId && s.criterionId === c.id && s.score >= 3))) return error("REQUIRED_CRITERION_FAILED", "The candidate must score at least 3 on every required criterion.");
      break;
  }
  if (request.phase !== state.phase) return error("INVALID_PHASE", "The command phase does not match the current workspace.");
  if (LIFECYCLE.includes(request.type) && request.type !== "TEACH_ROUTINE") return error("NOT_IMPLEMENTED", "Replay and approval execution are not available in this milestone.");
  if (state.phase !== "collaboration" || request.replayRunId !== undefined) return error("INVALID_PHASE", "This command requires an active collaboration workspace.");
  if (request.type === "TEACH_ROUTINE") return validateTeaching(state, request.payload.routineName);
  return null;
}
