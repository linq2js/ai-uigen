"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ProjectStore } from "./types";
import { createLocalStore } from "./local-store";
import { createSyncedStore } from "./synced-store";

const ProjectStoreContext = createContext<ProjectStore | undefined>(undefined);

interface ProjectStoreProviderProps {
  isAuthenticated: boolean;
  children: ReactNode;
}

export function ProjectStoreProvider({ isAuthenticated, children }: ProjectStoreProviderProps) {
  // Always use IndexedDB as primary storage. For authenticated users, wrap
  // with SyncedStore which pushes changes to PostgreSQL in the background.
  const store = useMemo(
    () => (isAuthenticated ? createSyncedStore() : createLocalStore()),
    [isAuthenticated]
  );

  return (
    <ProjectStoreContext.Provider value={store}>
      {children}
    </ProjectStoreContext.Provider>
  );
}

export function useProjectStore(): ProjectStore {
  const context = useContext(ProjectStoreContext);
  if (!context) {
    throw new Error("useProjectStore must be used within a ProjectStoreProvider");
  }
  return context;
}
