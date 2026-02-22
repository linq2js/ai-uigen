import { useEffect, useRef } from "react";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import { useProjectStore } from "@/lib/project-store/context";

const AUTO_SAVE_DELAY_MS = 2000;

export function useAutoSave(projectId?: string) {
  const { fileSystem, refreshTrigger } = useFileSystem();
  const store = useProjectStore();
  const initialRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!projectId) return;

    if (initialRef.current) {
      initialRef.current = false;
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const data = JSON.stringify(fileSystem.serialize());
      store.saveProjectData(projectId, data).catch((err) =>
        console.error("Auto-save failed:", err)
      );
    }, AUTO_SAVE_DELAY_MS);

    return () => clearTimeout(timerRef.current);
  }, [refreshTrigger, projectId, fileSystem, store]);
}
