import { afterEach, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { OnceApp } from "../src/components/shell/once-app";
import { createDemoSeed } from "../src/core/demo/seed";
import { serializeSnapshot, STORAGE_KEY } from "../src/core/persistence/local-storage";
import { memoryStorage } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

it("keeps server markup identical when browser storage restores different data", () => {
  const server = renderToString(createElement(OnceApp));
  const state = createDemoSeed();
  state.workspace.candidates.push({ id: "a", name: "Saved candidate" });
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, serializeSnapshot(state));
  vi.stubGlobal("window", { localStorage: storage });
  expect(renderToString(createElement(OnceApp))).toBe(server);
});

it("keeps initial storage-failure warnings out of the hydration server snapshot", () => {
  const server = renderToString(createElement(OnceApp));
  vi.stubGlobal("window", { get localStorage() { throw new DOMException("Denied", "SecurityError"); } });
  expect(renderToString(createElement(OnceApp))).toBe(server);
  expect(server).not.toContain("Saved state is unavailable");
});
