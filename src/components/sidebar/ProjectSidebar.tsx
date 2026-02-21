"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PanelLeftClose, Search, Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import { renameProject } from "@/actions/rename-project";
import { deleteProject } from "@/actions/delete-project";

interface Project {
  id: string;
  name: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectSidebarProps {
  currentProjectId?: string;
  onClose: () => void;
  onProjectRenamed?: (newName: string) => void;
  onNavigating?: (navigating: boolean) => void;
}

export function ProjectSidebar({ currentProjectId, onClose, onProjectRenamed, onNavigating }: ProjectSidebarProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const p = await getProjects();
      setProjects(p);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewProject = async () => {
    setCreating(true);
    if (currentProjectId) onNavigating?.(true);
    try {
      const project = await createProject({
        name: `Project #${~~(Math.random() * 100000)}`,
        messages: [],
        data: {},
      });
      await loadProjects();
      router.push(`/${project.id}`);
    } catch {
      onNavigating?.(false);
      setCreating(false);
    }
  };

  const startRenaming = (project: Project) => {
    setRenamingId(project.id);
    setRenameValue(project.name);
    setTimeout(() => renameInputRef.current?.select(), 0);
  };

  const commitRename = async () => {
    const trimmed = renameValue.trim();
    const target = projects.find((p) => p.id === renamingId);
    if (!trimmed || !renamingId || trimmed === target?.name) {
      setRenamingId(null);
      return;
    }
    setIsRenaming(true);
    try {
      const newName = await renameProject(renamingId, trimmed);
      setProjects((prev) =>
        prev.map((p) => (p.id === renamingId ? { ...p, name: newName } : p))
      );
      if (renamingId === currentProjectId) {
        document.title = newName;
        onProjectRenamed?.(newName);
      }
    } catch (err) {
      console.error("Failed to rename:", err);
    } finally {
      setIsRenaming(false);
    }
    setRenamingId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      const remaining = projects.filter((p) => p.id !== deleteTarget.id);
      setProjects(remaining);

      if (deleteTarget.id === currentProjectId) {
        onNavigating?.(true);
        if (remaining.length > 0) {
          router.push(`/${remaining[0].id}`);
        } else {
          const newProject = await createProject({
            name: `Project #${~~(Math.random() * 100000)}`,
            messages: [],
            data: {},
          });
          router.push(`/${newProject.id}`);
        }
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col bg-neutral-900 border-r border-neutral-700/60">
        {/* Header */}
        <div className="h-10 flex items-center justify-between px-3 border-b border-neutral-700/60 shrink-0">
          <span className="text-sm font-semibold text-neutral-200">Projects</span>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 rounded-md transition-colors"
            title="Close sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full h-8 pl-8 pr-8 text-sm bg-neutral-800 border border-neutral-700 rounded-md text-neutral-200 placeholder:text-neutral-500 outline-none focus:ring-1 focus:ring-neutral-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Project list */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="px-2 py-1">
            {loading ? (
              <div className="flex flex-col gap-1 px-2 py-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 rounded-md bg-neutral-800 animate-pulse" />
                ))}
              </div>
            ) : filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                  project.id === currentProjectId
                    ? "bg-neutral-700/50 text-neutral-100"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                }`}
                onClick={() => {
                  if (renamingId !== project.id) {
                    router.push(`/${project.id}`);
                  }
                }}
              >
                {renamingId === project.id ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape" && !isRenaming) setRenamingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isRenaming}
                    className="flex-1 min-w-0 h-6 px-1.5 text-sm bg-neutral-800 border border-neutral-600 rounded text-neutral-100 outline-none focus:ring-1 focus:ring-neutral-500 disabled:opacity-50"
                  />
                ) : (
                  <span className="flex-1 min-w-0 text-sm truncate">
                    {project.name}
                  </span>
                )}

                {renamingId !== project.id && (
                  <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRenaming(project);
                      }}
                      className="h-6 w-6 flex items-center justify-center text-neutral-500 hover:text-neutral-300 rounded transition-colors"
                      title="Rename"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(project);
                      }}
                      className="h-6 w-6 flex items-center justify-center text-neutral-500 hover:text-red-400 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!loading && filteredProjects.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-4">
                {searchQuery ? "No projects found." : "No projects yet."}
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-neutral-700/60 shrink-0">
          <Button
            variant="outline"
            className="w-full h-8 gap-2 text-sm"
            onClick={handleNewProject}
            disabled={creating}
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {creating ? "Creating..." : "New Project"}
          </Button>
        </div>
      </div>

      <DeleteProjectDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        projectName={deleteTarget?.name ?? ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
