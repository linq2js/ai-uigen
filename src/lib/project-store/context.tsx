"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";
import type { ProjectStore } from "./types";
import { createLocalStore } from "./local-store";
import { createSyncedStore, type SyncedProjectStore } from "./synced-store";

const ProjectStoreContext = createContext<ProjectStore | undefined>(undefined);

interface ProjectStoreProviderProps {
  isAuthenticated: boolean;
  children: ReactNode;
}

function isSyncedStore(store: ProjectStore): store is SyncedProjectStore {
  return "startSync" in store;
}

export function ProjectStoreProvider({
  isAuthenticated,
  children,
}: ProjectStoreProviderProps) {
  const store = useMemo(
    () => (isAuthenticated ? createSyncedStore() : createLocalStore()),
    [isAuthenticated]
  );

  const [initialSyncing, setInitialSyncing] = useState(
    () => isAuthenticated // only block for authenticated users
  );

  useEffect(() => {
    if (!isSyncedStore(store)) return;

    let cancelled = false;

    store.startSync().finally(() => {
      if (!cancelled) setInitialSyncing(false);
    });

    return () => {
      cancelled = true;
      store.destroySync();
    };
  }, [store]);

  return (
    <ProjectStoreContext.Provider value={store}>
      {initialSyncing ? (
        <div className="h-screen w-screen bg-neutral-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            <span className="text-sm text-neutral-400">Syncing projects...</span>
          </div>
        </div>
      ) : (
        children
      )}
    </ProjectStoreContext.Provider>
  );
}

export function useProjectStore(): ProjectStore {
  const context = useContext(ProjectStoreContext);
  if (!context) {
    throw new Error(
      "useProjectStore must be used within a ProjectStoreProvider"
    );
  }
  return context;
}
