import type { OnceStore } from "../core/store/once-store";
import { createToolDefinitions } from "./tool-definitions";

export type WebMCPStatus = "checking" | "ready" | "unavailable" | "failed" | "cancelled";

export function registerTools(store: OnceStore) {
  const controller = new AbortController();
  const { signal } = controller;
  const ready = (async (): Promise<WebMCPStatus> => {
    if (typeof document === "undefined" || typeof document.modelContext?.registerTool !== "function") return "unavailable";
    try {
      for (const tool of createToolDefinitions(store)) {
        if (signal.aborted) return "cancelled";
        await document.modelContext.registerTool(tool, { signal });
      }
      return signal.aborted ? "cancelled" : "ready";
    } catch {
      if (signal.aborted) return "cancelled";
      // A partial registration must not leave a misleading half-available surface.
      controller.abort();
      return "failed";
    }
  })();
  return { ready, dispose: () => controller.abort() };
}
