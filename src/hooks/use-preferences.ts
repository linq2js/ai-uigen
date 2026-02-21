"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GenerationPreferences,
  DEFAULT_PREFERENCES,
} from "@/lib/types/preferences";

const STORAGE_KEY = "artifex-preferences";

export function usePreferences() {
  const [preferences, setPreferences] =
    useState<GenerationPreferences>(DEFAULT_PREFERENCES);

  // Hydrate from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch {
      // Ignore parse errors, use defaults
    }
  }, []);

  const setPreference = useCallback(
    <K extends keyof GenerationPreferences>(
      key: K,
      value: GenerationPreferences[K]
    ) => {
      setPreferences((prev) => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage errors
        }
        return next;
      });
    },
    []
  );

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const isDefault = useCallback(
    <K extends keyof GenerationPreferences>(key: K) => {
      return preferences[key] === DEFAULT_PREFERENCES[key];
    },
    [preferences]
  );

  return { preferences, setPreference, resetPreferences, isDefault };
}
