"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getProjectRules } from "@/actions/get-project-rules";
import { saveProjectRules } from "@/actions/save-project-rules";

export function useProjectRules(projectId?: string) {
  const [projectRules, setProjectRulesState] = useState("");

  useEffect(() => {
    if (!projectId) {
      setProjectRulesState("");
      return;
    }
    getProjectRules(projectId)
      .then(setProjectRulesState)
      .catch(() => setProjectRulesState(""));
  }, [projectId]);

  const setProjectRules = useCallback(
    async (rules: string) => {
      if (!projectId) return;
      setProjectRulesState(rules);
      try {
        await saveProjectRules(projectId, rules);
      } catch {
        toast.error("Failed to save project rules");
      }
    },
    [projectId],
  );

  return { projectRules, setProjectRules };
}
