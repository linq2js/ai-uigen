"use client";

import { useEffect, useState } from "react";
import { MainContent } from "./main-content";
import { ProjectStoreProvider } from "@/lib/project-store/context";
import { localGetProject } from "@/lib/local-db";
import { Loader2 } from "lucide-react";

interface GuestProjectLoaderProps {
  localProjectId?: string;
}

export function GuestProjectLoader({ localProjectId }: GuestProjectLoaderProps) {
  const [project, setProject] = useState<any>(undefined); // undefined = loading, null = not found
  const [loading, setLoading] = useState(!!localProjectId);

  useEffect(() => {
    if (!localProjectId) {
      setProject(undefined);
      setLoading(false);
      return;
    }

    setLoading(true);
    localGetProject(localProjectId)
      .then((p) => {
        setProject(p);
        setLoading(false);
      })
      .catch(() => {
        setProject(null);
        setLoading(false);
      });
  }, [localProjectId]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-neutral-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          <span className="text-sm text-neutral-400">Loading project...</span>
        </div>
      </div>
    );
  }

  return (
    <ProjectStoreProvider isAuthenticated={false}>
      <MainContent
        user={null}
        project={project ?? undefined}
      />
    </ProjectStoreProvider>
  );
}
