"use client";

import { useState, useEffect, useCallback } from "react";
import type { Skill } from "@/lib/types/skill";

const STORAGE_KEY = "uigen-global-skills";

function generateId() {
  return `sk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadFromStorage(): Skill[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore parse errors
  }
  return [];
}

function saveToStorage(skills: Skill[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
  } catch {
    // Ignore storage errors
  }
}

export function useGlobalSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    setSkills(loadFromStorage());
  }, []);

  const addSkill = useCallback(
    (skill: Omit<Skill, "id">) => {
      setSkills((prev) => {
        const next = [...prev, { ...skill, id: generateId() }];
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const updateSkill = useCallback(
    (id: string, updates: Partial<Omit<Skill, "id">>) => {
      setSkills((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const deleteSkill = useCallback((id: string) => {
    setSkills((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  const toggleSkill = useCallback((id: string) => {
    setSkills((prev) => {
      const next = prev.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s,
      );
      saveToStorage(next);
      return next;
    });
  }, []);

  return { skills, addSkill, updateSkill, deleteSkill, toggleSkill };
}
