"use client";

import { useMemo, useEffect } from "react";
import { VirtualFileSystem } from "@/lib/file-system";
import {
  createImportMap,
  createPreviewHTML,
} from "@/lib/transform/jsx-transformer";

const POSSIBLE_ENTRIES = [
  "/App.jsx",
  "/App.tsx",
  "/index.jsx",
  "/index.tsx",
  "/src/App.jsx",
  "/src/App.tsx",
];

interface StandaloneViewProps {
  project: {
    id: string;
    name: string;
    messages: any[];
    data: any;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function StandaloneView({ project }: StandaloneViewProps) {
  const files = useMemo(() => {
    const fs = new VirtualFileSystem();
    if (project.data) {
      fs.deserializeFromNodes(project.data);
    }
    return fs.getAllFiles();
  }, [project.data]);

  useEffect(() => {
    if (files.size === 0) return;

    let entryPoint = POSSIBLE_ENTRIES.find((p) => files.has(p));
    if (!entryPoint) {
      entryPoint = Array.from(files.keys()).find(
        (p) => p.endsWith(".jsx") || p.endsWith(".tsx")
      );
    }
    if (!entryPoint) return;

    const { importMap, styles, errors } = createImportMap(files);
    const html = createPreviewHTML(entryPoint, importMap, styles, errors, project.name);

    // Replace the entire document so the app runs natively in the browser
    // with full access to window.location, history, query params, etc.
    document.open();
    document.write(html);
    document.close();
  }, [files]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
      <p className="text-sm text-neutral-400">Loading...</p>
    </div>
  );
}
