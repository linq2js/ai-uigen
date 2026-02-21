"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "artifex-api-key";

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState("");

  // Hydrate from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setApiKeyState(stored);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const clearApiKey = useCallback(() => {
    setApiKeyState("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  return { apiKey, setApiKey, clearApiKey };
}
