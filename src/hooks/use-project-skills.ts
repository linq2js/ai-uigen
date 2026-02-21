"use client";

import { useState, useEffect, useCallback } from "react";
import type { Skill } from "@/lib/types/skill";
import { getProjectSkills } from "@/actions/get-project-skills";
import { saveProjectSkills } from "@/actions/save-project-skills";

function generateId() {
  return `sk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useProjectSkills(projectId?: string) {
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    if (!projectId) {
      setSkills([]);
      return;
    }
    getProjectSkills(projectId)
      .then(setSkills)
      .catch(() => setSkills([]));
  }, [projectId]);

  const persist = useCallback(
    (next: Skill[]) => {
      if (!projectId) return;
      saveProjectSkills(projectId, next).catch(console.error);
    },
    [projectId],
  );

  const addSkill = useCallback(
    (skill: Omit<Skill, "id">) => {
      setSkills((prev) => {
        const next = [...prev, { ...skill, id: generateId() }];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const updateSkill = useCallback(
    (id: string, updates: Partial<Omit<Skill, "id">>) => {
      setSkills((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const deleteSkill = useCallback(
    (id: string) => {
      setSkills((prev) => {
        const next = prev.filter((s) => s.id !== id);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const toggleSkill = useCallback(
    (id: string) => {
      setSkills((prev) => {
        const next = prev.map((s) =>
          s.id === id ? { ...s, enabled: !s.enabled } : s,
        );
        persist(next);
        return next;
      });
    },
    [persist],
  );

  return { skills, addSkill, updateSkill, deleteSkill, toggleSkill };
}
