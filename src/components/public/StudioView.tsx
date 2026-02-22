"use client";

import { useState, useMemo, useEffect } from "react";
import { Monitor, Code2, ExternalLink, Download } from "lucide-react";
import { VirtualFileSystem } from "@/lib/file-system";
import {
  createImportMap,
  createPreviewHTML,
} from "@/lib/transform/jsx-transformer";
import { buildCompiledHtml } from "@/lib/export-zip";
import { MainContent } from "@/app/main-content";

type ViewMode = "app" | "code";

const POSSIBLE_ENTRIES = [
  "/App.jsx",
  "/App.tsx",
  "/index.jsx",
  "/index.tsx",
  "/src/App.jsx",
  "/src/App.tsx",
];

interface StudioViewProps {
  project: {
    id: string;
    name: string;
    messages: any[];
    data: any;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function StudioView({ project }: StudioViewProps) {
  const [mode, setMode] = useState<ViewMode>("app");

  const fileSystem = useMemo(() => {
    const fs = new VirtualFileSystem();
    if (project.data) {
      fs.deserializeFromNodes(project.data);
    }
    return fs;
  }, [project.data]);

  const files = useMemo(() => fileSystem.getAllFiles(), [fileSystem]);

  const [previewHTML, setPreviewHTML] = useState<string | null>(null);

  useEffect(() => {
    if (files.size === 0) {
      setPreviewHTML(null);
      return;
    }

    let entryPoint = POSSIBLE_ENTRIES.find((p) => files.has(p));
    if (!entryPoint) {
      entryPoint = Array.from(files.keys()).find(
        (p) => p.endsWith(".jsx") || p.endsWith(".tsx")
      );
    }

    if (entryPoint) {
      const { importMap, styles, errors } = createImportMap(files);
      setPreviewHTML(createPreviewHTML(entryPoint, importMap, styles, errors, project.name));
    }
  }, [files]);

  const handleDownload = () => {
    const html = buildCompiledHtml(fileSystem);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const modes: { id: ViewMode; label: string; icon: typeof Monitor }[] = [
    { id: "app", label: "App", icon: Monitor },
    { id: "code", label: "Code", icon: Code2 },
  ];

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="h-11 border-b border-neutral-200 bg-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-neutral-900 tracking-tight">
            {project.name}
          </span>
          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
            PUBLIC
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 gap-0.5">
            {modes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === id
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-1 border-l border-neutral-200 pl-2">
            <a
              href={`/s/${project.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
              title="Open standalone app in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Standalone
            </a>
            <button
              onClick={handleDownload}
              className="flex items-center p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
              title="Download as HTML file"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {mode === "code" ? (
          <MainContent
            project={{ ...project, published: true, messageCount: 0, totalInputTokens: 0, totalOutputTokens: 0, dataSize: 0 }}
            readOnly
          />
        ) : previewHTML ? (
          <iframe
            srcDoc={previewHTML}
            sandbox="allow-scripts allow-same-origin allow-forms"
            className="w-full h-full border-0 bg-white"
            title={`${project.name} preview`}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-neutral-500">No content to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
