"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PanelLeftClose,
  Search,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Loader2,
  X,
  MoreHorizontal,
  FolderOpen,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { CloneProjectDialog } from "./CloneProjectDialog";
import { useProjectStore } from "@/lib/project-store/context";
import { subscribe, isProjectGenerating } from "@/lib/generation-tracker";

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

const TIME_GROUP_ORDER = [
  "Today",
  "Yesterday",
  "Previous 7 days",
  "Previous 30 days",
  "Older",
] as const;

type TimeGroup = (typeof TIME_GROUP_ORDER)[number];

function getTimeGroup(date: Date): TimeGroup {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const week = new Date(today);
  week.setDate(week.getDate() - 7);
  const month = new Date(today);
  month.setDate(month.getDate() - 30);

  const d = new Date(date);
  if (d >= today) return "Today";
  if (d >= yesterday) return "Yesterday";
  if (d >= week) return "Previous 7 days";
  if (d >= month) return "Previous 30 days";
  return "Older";
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ProjectSidebar({
  currentProjectId,
  onClose,
  onProjectRenamed,
  onNavigating,
}: ProjectSidebarProps) {
  const router = useRouter();
  const store = useProjectStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cloneTarget, setCloneTarget] = useState<Project | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [, forceUpdate] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    return subscribe(() => forceUpdate((n) => n + 1));
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const p = await store.getProjects();
      setProjects(p);
    } catch (err) {
      console.error("[ProjectSidebar] Failed to load projects:", err);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredProjects = useMemo(
    () =>
      projects.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [projects, searchQuery]
  );

  const groupedProjects = useMemo(() => {
    const groups: Partial<Record<TimeGroup, Project[]>> = {};
    for (const project of filteredProjects) {
      const group = getTimeGroup(project.updatedAt);
      (groups[group] ??= []).push(project);
    }
    return TIME_GROUP_ORDER.filter((g) => groups[g]?.length).map((g) => ({
      label: g,
      projects: groups[g]!,
    }));
  }, [filteredProjects]);

  const navigateToProject = useCallback(
    (projectId: string) => {
      if (store.isLocal) {
        router.push(`/?project=${projectId}`);
      } else {
        router.push(`/${projectId}`);
      }
    },
    [store.isLocal, router]
  );

  const handleNewProject = async () => {
    setCreating(true);
    if (currentProjectId) onNavigating?.(true);
    try {
      const project = await store.createProject({
        name: `Project #${~~(Math.random() * 100000)}`,
        messages: [],
        data: {},
      });
      await loadProjects();
      navigateToProject(project.id);
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
      const newName = await store.renameProject(renamingId, trimmed);
      setProjects((prev) =>
        prev.map((p) => (p.id === renamingId ? { ...p, name: newName } : p))
      );
      if (renamingId === currentProjectId) {
        document.title = newName;
        onProjectRenamed?.(newName);
      }
    } catch {
      toast.error("Failed to rename project");
    } finally {
      setIsRenaming(false);
    }
    setRenamingId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await store.deleteProject(deleteTarget.id);
      const remaining = projects.filter((p) => p.id !== deleteTarget.id);
      setProjects(remaining);

      if (deleteTarget.id === currentProjectId) {
        onNavigating?.(true);
        try {
          if (remaining.length > 0) {
            navigateToProject(remaining[0].id);
          } else {
            const newProject = await store.createProject({
              name: `Project #${~~(Math.random() * 100000)}`,
              messages: [],
              data: {},
            });
            await loadProjects();
            navigateToProject(newProject.id);
          }
        } catch {
          onNavigating?.(false);
          toast.error("Failed to create replacement project");
        }
      }
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleClone = async (options: {
    name: string;
    includeSourceCode: boolean;
    includeMessages: boolean;
    includeSkills: boolean;
    includeRules: boolean;
    fromMessageIndex?: number;
  }) => {
    if (!cloneTarget) return;
    setIsCloning(true);
    try {
      const newProject = await store.cloneProject({
        sourceProjectId: cloneTarget.id,
        ...options,
      });
      await loadProjects();
      onNavigating?.(true);
      navigateToProject(newProject.id);
    } catch {
      toast.error("Failed to clone project");
    } finally {
      setIsCloning(false);
      setCloneTarget(null);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col bg-neutral-900 border-r border-neutral-800">
        {/* Header */}
        <div className="h-[41px] flex items-center justify-between px-3 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-200">
              Projects
            </span>
            {!loading && projects.length > 0 && (
              <span className="text-[11px] tabular-nums text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded-md">
                {projects.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleNewProject}
              disabled={creating}
              className="h-7 w-7 flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/70 rounded-md transition-colors disabled:opacity-50"
              title="New project"
              aria-label="Create new project"
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="h-7 w-7 flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/70 rounded-md transition-colors"
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-2.5 py-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-8 pl-8 pr-8 text-sm bg-neutral-800/50 border border-neutral-700/40 rounded-lg text-neutral-200 placeholder:text-neutral-500 outline-none focus:border-neutral-600 focus:bg-neutral-800 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Project list */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="px-1.5 pb-3">
            {loading ? (
              <div className="flex flex-col gap-1.5 px-1.5 pt-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-9 rounded-lg bg-neutral-800/40 animate-pulse"
                    style={{ animationDelay: `${i * 75}ms` }}
                  />
                ))}
              </div>
            ) : groupedProjects.length > 0 ? (
              groupedProjects.map((group) => (
                <div key={group.label}>
                  <div className="px-3 pt-3.5 pb-1">
                    <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider select-none">
                      {group.label}
                    </span>
                  </div>
                  {group.projects.map((project) => {
                    const isActive = project.id === currentProjectId;
                    const generating = isProjectGenerating(project.id);
                    const isBeingRenamed = renamingId === project.id;
                    const menuOpen = openMenuId === project.id;

                    return (
                      <div
                        key={project.id}
                        className={`group relative flex items-center mx-1 rounded-lg cursor-pointer transition-all duration-150 ${
                          isActive
                            ? "bg-neutral-800 text-neutral-100"
                            : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                        }`}
                        onClick={() => {
                          if (isBeingRenamed || isActive) return;
                          onNavigating?.(true);
                          navigateToProject(project.id);
                        }}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-blue-500 rounded-r-full" />
                        )}

                        <div className="flex-1 min-w-0 flex items-center gap-2 pl-3 pr-3 py-2">
                          {isBeingRenamed ? (
                            <input
                              ref={renameInputRef}
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={commitRename}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitRename();
                                if (e.key === "Escape" && !isRenaming)
                                  setRenamingId(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={isRenaming}
                              className="flex-1 min-w-0 h-6 px-1.5 text-sm bg-neutral-700/80 border border-neutral-600 rounded-md text-neutral-100 outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40 disabled:opacity-50 transition-colors"
                            />
                          ) : (
                            <>
                              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                {generating && (
                                  <Loader2 className="h-3 w-3 animate-spin text-blue-400 shrink-0" />
                                )}
                                <span className="text-[13px] truncate leading-tight">
                                  {project.name}
                                </span>
                              </div>

                              <div className="relative shrink-0 flex items-center">
                                <span
                                  className={`text-[11px] text-neutral-600 tabular-nums transition-opacity duration-150 pointer-events-none ${
                                    menuOpen
                                      ? "opacity-0"
                                      : "group-hover:opacity-0"
                                  }`}
                                >
                                  {formatRelativeTime(project.updatedAt)}
                                </span>

                                <Popover
                                  open={menuOpen}
                                  onOpenChange={(open) =>
                                    setOpenMenuId(open ? project.id : null)
                                  }
                                >
                                  <PopoverTrigger asChild>
                                    <button
                                      onClick={(e) => e.stopPropagation()}
                                      className={`absolute inset-0 flex items-center justify-center rounded-md transition-opacity duration-150 ${
                                        menuOpen
                                          ? "opacity-100 text-neutral-300"
                                          : "opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-neutral-300"
                                      }`}
                                      aria-label={`Actions for ${project.name}`}
                                    >
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </button>
                                  </PopoverTrigger>
                                <PopoverContent
                                  align="start"
                                  side="right"
                                  sideOffset={8}
                                  className="w-36 p-1"
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      startRenaming(project);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] text-neutral-300 hover:bg-neutral-700/60 rounded-md transition-colors"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-neutral-400" />
                                    Rename
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      setCloneTarget(project);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] text-neutral-300 hover:bg-neutral-700/60 rounded-md transition-colors"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-neutral-400" />
                                    Clone
                                  </button>
                                  <div className="h-px bg-neutral-700/50 my-1 mx-1" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      setDeleteTarget(project);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                </PopoverContent>
                              </Popover>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="h-10 w-10 rounded-xl bg-neutral-800/80 flex items-center justify-center mb-3">
                  <FolderOpen className="h-5 w-5 text-neutral-600" />
                </div>
                <p className="text-[13px] text-neutral-500 text-center">
                  {searchQuery ? "No matches found" : "No projects yet"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleNewProject}
                    disabled={creating}
                    className="mt-2 text-[13px] text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                  >
                    Create your first project
                  </button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
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

      <CloneProjectDialog
        open={!!cloneTarget}
        onOpenChange={(open) => {
          if (!open) setCloneTarget(null);
        }}
        projectName={cloneTarget?.name ?? ""}
        onConfirm={handleClone}
        isCloning={isCloning}
      />
    </>
  );
}
