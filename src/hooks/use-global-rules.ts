"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "uigen-global-rules";

export function useGlobalRules() {
  const [globalRules, setGlobalRulesState] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setGlobalRulesState(stored);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setGlobalRules = useCallback((rules: string) => {
    setGlobalRulesState(rules);
    try {
      localStorage.setItem(STORAGE_KEY, rules);
    } catch {
      // Ignore storage errors
    }
  }, []);

  return { globalRules, setGlobalRules };
}
