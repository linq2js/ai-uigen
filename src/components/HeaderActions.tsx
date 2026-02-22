"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Download,
  FileCode,
  Globe,
  Check,
  Copy,
  GlobeLock,
  ExternalLink,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { SettingsButton } from "@/components/settings/SettingsButton";
import { signOut } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { togglePublish } from "@/actions/toggle-publish";
import { useChat } from "@/lib/contexts/chat-context";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import { exportAsZip, exportCompiledHtml } from "@/lib/export-zip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HeaderActionsProps {
  user?: {
    id: string;
    email: string;
  } | null;
  projectId?: string;
  published?: boolean;
}

export function HeaderActions({ user, projectId, published: initialPublished }: HeaderActionsProps) {
  const { fileSystem, getAllFiles } = useFileSystem();
  const { apiKey } = useChat();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(initialPublished ?? false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copiedStandalone, setCopiedStandalone] = useState(false);
  const [copiedStudio, setCopiedStudio] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);

  // Auto-open settings when no API key is configured (server or client)
  useEffect(() => {
    let cancelled = false;
    if (apiKey) return;
    fetch("/api/config")
      .then((r) => r.json())
      .then((data: { hasServerKey: boolean }) => {
        if (!cancelled && !data.hasServerKey) {
          setSettingsOpen(true);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [apiKey]);

  // Load current project name for export safeName
  useEffect(() => {
    if (user && projectId) {
      getProjects()
        .then((p) => {
          const current = p.find((proj) => proj.id === projectId);
          if (current) {
            setCurrentProjectName(current.name);
            document.title = current.name;
          }
        })
        .catch(console.error);
    }
  }, [user, projectId]);

  const handleSignInClick = () => {
    setAuthMode("signin");
    setAuthDialogOpen(true);
  };

  const handleSignUpClick = () => {
    setAuthMode("signup");
    setAuthDialogOpen(true);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      toast.error("Failed to sign out");
      setSigningOut(false);
    }
  };

  const safeName = () => {
    const name = currentProjectName ?? "project";
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
    } catch {
      toast.error("Failed to update publish status");
    } finally {
      setPublishing(false);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const standaloneUrl = `${origin}/s/${projectId}`;
  const studioUrl = `${origin}/p/${projectId}`;

  const handleCopy = async (url: string, type: "standalone" | "studio") => {
    try {
      await navigator.clipboard.writeText(url);
      const setter = type === "standalone" ? setCopiedStandalone : setCopiedStudio;
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
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
          <SettingsButton onClick={() => setSettingsOpen(true)} />
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
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
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

      <SettingsButton onClick={() => setSettingsOpen(true)} />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleSignOut}
        disabled={signingOut}
        title="Sign out"
      >
        {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      </Button>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
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
