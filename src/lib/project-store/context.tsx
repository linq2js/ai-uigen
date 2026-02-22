"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ProjectStore } from "./types";
import { createServerStore } from "./server-store";
import { createLocalStore } from "./local-store";

const ProjectStoreContext = createContext<ProjectStore | undefined>(undefined);

interface ProjectStoreProviderProps {
  isAuthenticated: boolean;
  children: ReactNode;
}

export function ProjectStoreProvider({ isAuthenticated, children }: ProjectStoreProviderProps) {
  const store = useMemo(
    () => (isAuthenticated ? createServerStore() : createLocalStore()),
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
