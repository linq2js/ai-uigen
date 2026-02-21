"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Plus,
  LogOut,
  FolderOpen,
  ChevronDown,
  Download,
  FileCode,
  Globe,
  Check,
  Copy,
  GlobeLock,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { signOut } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import { togglePublish } from "@/actions/toggle-publish";
import { renameProject } from "@/actions/rename-project";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import { exportAsZip, exportCompiledHtml } from "@/lib/export-zip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface HeaderActionsProps {
  user?: {
    id: string;
    email: string;
  } | null;
  projectId?: string;
  published?: boolean;
}

interface Project {
  id: string;
  name: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function HeaderActions({ user, projectId, published: initialPublished }: HeaderActionsProps) {
  const router = useRouter();
  const { fileSystem, getAllFiles } = useFileSystem();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(initialPublished ?? false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copiedStandalone, setCopiedStandalone] = useState(false);
  const [copiedStudio, setCopiedStudio] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Load projects initially and set document title
  useEffect(() => {
    if (user && projectId) {
      getProjects()
        .then((p) => {
          setProjects(p);
          const current = p.find((proj) => proj.id === projectId);
          if (current) document.title = current.name;
        })
        .catch(console.error)
        .finally(() => setInitialLoading(false));
    }
  }, [user, projectId]);

  // Refresh projects when popover opens
  useEffect(() => {
    if (user && projectsOpen) {
      getProjects().then(setProjects).catch(console.error);
    }
  }, [projectsOpen, user]);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentProject = projects.find((p) => p.id === projectId);

  const handleSignInClick = () => {
    setAuthMode("signin");
    setAuthDialogOpen(true);
  };

  const handleSignUpClick = () => {
    setAuthMode("signup");
    setAuthDialogOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNewDesign = async () => {
    const project = await createProject({
      name: `Design #${~~(Math.random() * 100000)}`,
      messages: [],
      data: {},
    });
    router.push(`/${project.id}`);
  };

  const safeName = () => {
    const name = currentProject?.name ?? "project";
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
  };

  const handleExportSource = async () => {
    setExporting(true);
    setExportOpen(false);
    try {
      await exportAsZip(fileSystem, `${safeName()}-source.zip`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportCompiled = () => {
    setExporting(true);
    setExportOpen(false);
    try {
      exportCompiledHtml(fileSystem, `${safeName()}.html`);
    } finally {
      setExporting(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!projectId) return;
    setPublishing(true);
    try {
      const newState = await togglePublish(projectId);
      setIsPublished(newState);
      if (!newState) setPublishOpen(false);
    } catch (err) {
      console.error("Failed to toggle publish:", err);
    } finally {
      setPublishing(false);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const standaloneUrl = `${origin}/s/${projectId}`;
  const studioUrl = `${origin}/p/${projectId}`;

  const handleCopy = async (url: string, type: "standalone" | "studio") => {
    await navigator.clipboard.writeText(url);
    const setter = type === "standalone" ? setCopiedStandalone : setCopiedStudio;
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const startRenaming = () => {
    if (!currentProject) return;
    setRenameValue(currentProject.name);
    setRenaming(true);
    setTimeout(() => renameInputRef.current?.select(), 0);
  };

  const commitRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || !projectId || trimmed === currentProject?.name) {
      setRenaming(false);
      return;
    }
    try {
      const newName = await renameProject(projectId, trimmed);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, name: newName } : p))
      );
      document.title = newName;
    } catch (err) {
      console.error("Failed to rename:", err);
    }
    setRenaming(false);
  };

  const hasFiles = getAllFiles().size > 0;

  const exportDropdown = hasFiles ? (
    <Popover open={exportOpen} onOpenChange={setExportOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-8 gap-2"
          disabled={exporting}
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exporting..." : "Export"}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1.5">
        <button
          onClick={handleExportSource}
          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-neutral-700 transition-colors text-left"
        >
          <FileCode className="h-4 w-4 mt-0.5 shrink-0 text-neutral-500" />
          <div>
            <div className="font-medium text-neutral-200">Source Code</div>
            <div className="text-xs text-neutral-500 mt-0.5">
              Raw JSX/TSX files as .zip
            </div>
          </div>
        </button>
        <button
          onClick={handleExportCompiled}
          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-neutral-700 transition-colors text-left"
        >
          <Globe className="h-4 w-4 mt-0.5 shrink-0 text-neutral-500" />
          <div>
            <div className="font-medium text-neutral-200">Standalone App</div>
            <div className="text-xs text-neutral-500 mt-0.5">
              Self-contained HTML file
            </div>
          </div>
        </button>
      </PopoverContent>
    </Popover>
  ) : null;

  if (!user) {
    return (
      <>
        <div className="flex gap-2">
          {exportDropdown}
          <Button variant="outline" className="h-8" onClick={handleSignInClick}>
            Sign In
          </Button>
          <Button className="h-8" onClick={handleSignUpClick}>
            Sign Up
          </Button>
        </div>
        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          defaultMode={authMode}
        />
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!initialLoading && (
        <div className="flex items-center gap-1">
          {renaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              className="h-8 px-3 text-sm border border-neutral-600 rounded-md outline-none focus:ring-2 focus:ring-neutral-500 w-[200px] bg-neutral-800 text-neutral-100"
            />
          ) : (
            <>
              <Popover open={projectsOpen} onOpenChange={setProjectsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 gap-2" role="combobox">
                    <FolderOpen className="h-4 w-4" />
                    {currentProject ? currentProject.name : "Select Project"}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="end">
                  <Command>
                    <CommandInput
                      placeholder="Search projects..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No projects found.</CommandEmpty>
                      <CommandGroup>
                        {filteredProjects.map((project) => (
                          <CommandItem
                            key={project.id}
                            value={project.name}
                            onSelect={() => {
                              router.push(`/${project.id}`);
                              setProjectsOpen(false);
                              setSearchQuery("");
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{project.name}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {currentProject && (
                <button
                  onClick={startRenaming}
                  className="h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700 rounded-md transition-colors"
                  title="Rename project"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {projectId && hasFiles && (
        <Popover open={publishOpen} onOpenChange={setPublishOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={isPublished ? "default" : "outline"}
              className={`h-8 gap-2 ${isPublished ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
            >
              {isPublished ? (
                <Globe className="h-4 w-4" />
              ) : (
                <GlobeLock className="h-4 w-4" />
              )}
              {isPublished ? "Published" : "Publish"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-4">
            {isPublished ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-neutral-200">
                    This app is live
                  </span>
                </div>
                <UrlSection
                  label="Standalone"
                  url={standaloneUrl}
                  copied={copiedStandalone}
                  onCopy={() => handleCopy(standaloneUrl, "standalone")}
                />
                <UrlSection
                  label="Studio"
                  url={studioUrl}
                  copied={copiedStudio}
                  onCopy={() => handleCopy(studioUrl, "studio")}
                />
                <Button
                  variant="outline"
                  className="w-full h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
                  onClick={handleTogglePublish}
                  disabled={publishing}
                >
                  {publishing ? "Unpublishing..." : "Unpublish"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-neutral-200">
                    Publish this app?
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Anyone with the link will be able to view and interact with your app.
                  </p>
                </div>
                <Button
                  className="w-full h-8 bg-blue-600 hover:bg-blue-700"
                  onClick={handleTogglePublish}
                  disabled={publishing}
                >
                  {publishing ? "Publishing..." : "Publish"}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      {exportDropdown}

      <Button variant="outline" className="flex items-center gap-2 h-8" onClick={handleNewDesign}>
        <Plus className="h-4 w-4" />
        New Design
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleSignOut}
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

function UrlSection({
  label,
  url,
  copied,
  onCopy,
}: {
  label: string;
  url: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <input
          readOnly
          value={url}
          className="flex-1 min-w-0 text-xs bg-neutral-800 border border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-400 select-all"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-blue-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 shrink-0"
          asChild
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}
