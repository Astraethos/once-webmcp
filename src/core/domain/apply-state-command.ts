import { applyCommand } from "./apply-command";
import type { Command } from "./commands";
import type { AppState } from "./types";
import { compileRoutine } from "../teaching/compiler";
import { startReplay, updateReplayProgress } from "../replay/replay-engine";

// Pure application of a validated command. The bus supplies identity/time;
// persistence uses recorded metadata to validate the complete saved snapshot.
export function applyStateCommand(state: AppState, command: Command, metadata: { id: string; timestamp: string }): AppState {
  let next: AppState;
  switch (command.type) {
    case "TEACH_ROUTINE": {
      const result = compileRoutine(state, { id: metadata.id, name: command.payload.routineName, createdAt: metadata.timestamp });
      if (!result.ok) throw new Error("Teach must be validated before application.");
      return { ...state, phase: "teaching", teaching: { status: "compiled", routine: result.routine, compilerNotes: result.routine.compilerNotes } };
    }
    case "START_REPLAY": return startReplay(state, command.payload, metadata.id);
    case "REQUEST_APPROVAL": next = { ...state, replay: { ...state.replay!, status: "awaiting_approval" } }; break;
    case "RECORD_APPROVAL": next = { ...state, replay: { ...state.replay!, status: command.payload.decision === "approved" ? "running" : "rejected", approval: { ...state.replay!.approval, decision: command.payload.decision } } }; break;
    case "COMPLETE_REPLAY": next = { ...state, phase: "complete", replay: { ...state.replay!, status: "completed" } }; break;
    default: next = { ...state, workspace: applyCommand(state.workspace, command) };
  }
  return updateReplayProgress(next);
}
