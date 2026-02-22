import { useEffect, useRef } from "react";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import { saveProjectData } from "@/actions/save-project-data";

const AUTO_SAVE_DELAY_MS = 2000;

export function useAutoSave(projectId?: string) {
  const { fileSystem, refreshTrigger } = useFileSystem();
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
      saveProjectData(projectId, data).catch((err) =>
        console.error("Auto-save failed:", err)
      );
    }, AUTO_SAVE_DELAY_MS);

    return () => clearTimeout(timerRef.current);
  }, [refreshTrigger, projectId, fileSystem]);
}
