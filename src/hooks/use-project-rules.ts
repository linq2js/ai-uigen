"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useProjectStore } from "@/lib/project-store/context";

export function useProjectRules(projectId?: string) {
  const store = useProjectStore();
  const [projectRules, setProjectRulesState] = useState("");

  useEffect(() => {
    if (!projectId) {
      setProjectRulesState("");
      return;
    }
    store.getProjectRules(projectId)
      .then(setProjectRulesState)
      .catch(() => setProjectRulesState(""));
  }, [projectId, store]);

  const setProjectRules = useCallback(
    async (rules: string) => {
      if (!projectId) return;
      setProjectRulesState(rules);
      try {
        await store.saveProjectRules(projectId, rules);
      } catch {
        toast.error("Failed to save project rules");
      }
    },
    [projectId, store],
  );

  return { projectRules, setProjectRules };
}
