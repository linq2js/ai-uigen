"use client";

import { useState, useEffect, useCallback } from "react";
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
      await saveProjectRules(projectId, rules);
    },
    [projectId],
  );

  return { projectRules, setProjectRules };
}
