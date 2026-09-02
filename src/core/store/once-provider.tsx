"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import { createOnceStore, type OnceStore } from "./once-store";
import type { StoragePort } from "../persistence/local-storage";

const StoreContext = createContext<OnceStore | null>(null);

function browserStorage(): StoragePort | undefined {
  if (typeof window === "undefined") return undefined;
  // Resolve localStorage on access so privacy-mode SecurityErrors reach the store.
  return {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: (key) => window.localStorage.removeItem(key),
  };
}

export function OnceProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createOnceStore({ storage: browserStorage() }));
  return <StoreContext value={store}>{children}</StoreContext>;
}

export function useOnceStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("ONCE components require OnceProvider.");
  return store;
}

export function useOnceState() {
  const store = useOnceStore();
  return useSyncExternalStore(store.subscribe, store.getState, store.getServerSnapshot);
}
