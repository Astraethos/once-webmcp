import type { CommandType } from "../domain/commands";
import type { Actor, Channel, CommandError, Phase } from "../domain/types";

export type TeachingDisposition = "variable" | "policy" | "procedure" | "example_only" | "lifecycle" | "excluded";
export type SemanticEvent = {
  schemaVersion: 1;
  eventId: string;
  sequence: number;
  timestamp: string;
  sessionId: string;
  replayRunId?: string;
  actor: Actor;
  channel: Channel;
  phase: Phase;
  command: { id: string; type: CommandType; payload: unknown };
  outcome: "applied" | "rejected";
  summary: string;
  teaching: { disposition: TeachingDisposition; reason: string };
  error?: CommandError;
};
