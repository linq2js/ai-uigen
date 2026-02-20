"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { signOut } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
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
}

interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export function HeaderActions({ user, projectId }: HeaderActionsProps) {
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

  // Load projects initially
  useEffect(() => {
    if (user && projectId) {
      getProjects()
        .then(setProjects)
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
          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-neutral-100 transition-colors text-left"
        >
          <FileCode className="h-4 w-4 mt-0.5 shrink-0 text-neutral-500" />
          <div>
            <div className="font-medium text-neutral-800">Source Code</div>
            <div className="text-xs text-neutral-500 mt-0.5">
              Raw JSX/TSX files as .zip
            </div>
          </div>
        </button>
        <button
          onClick={handleExportCompiled}
          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-neutral-100 transition-colors text-left"
        >
          <Globe className="h-4 w-4 mt-0.5 shrink-0 text-neutral-500" />
          <div>
            <div className="font-medium text-neutral-800">Standalone App</div>
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
      )}

      {exportDropdown}

      <Button className="flex items-center gap-2 h-8" onClick={handleNewDesign}>
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
