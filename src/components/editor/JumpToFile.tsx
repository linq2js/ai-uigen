"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import { FileCode, FileText, FileImage, File } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

interface JumpToFileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelected?: () => void;
}

const EXT_ICONS: Record<string, typeof FileCode> = {
  jsx: FileCode,
  tsx: FileCode,
  js: FileCode,
  ts: FileCode,
  css: FileText,
  html: FileText,
  json: FileText,
  md: FileText,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  svg: FileImage,
  gif: FileImage,
  webp: FileImage,
};

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_ICONS[ext] ?? File;
}

export function JumpToFile({
  open,
  onOpenChange,
  onFileSelected,
}: JumpToFileProps) {
  const { fileSystem, setSelectedFile, refreshTrigger } = useFileSystem();

  const files = useMemo(() => {
    const allFiles = fileSystem.getAllFiles();
    return Array.from(allFiles.keys()).sort((a, b) => {
      const depthA = a.split("/").length;
      const depthB = b.split("/").length;
      if (depthA !== depthB) return depthA - depthB;
      return a.localeCompare(b);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileSystem, refreshTrigger]);

  const handleSelect = useCallback(
    (filePath: string) => {
      setSelectedFile(filePath);
      onOpenChange(false);
      onFileSelected?.();
    },
    [setSelectedFile, onOpenChange, onFileSelected]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Go to File"
      description="Search for a file to open"
      showCloseButton={false}
      className="max-w-lg bg-neutral-900 border border-neutral-700"
    >
      <CommandInput
        placeholder="Search files by name or path..."
        className="text-neutral-200"
      />
      <CommandList className="max-h-[360px]">
        <CommandEmpty className="text-neutral-500">
          No files found.
        </CommandEmpty>
        <CommandGroup>
          {files.map((filePath) => {
            const fileName = filePath.split("/").pop() ?? filePath;
            const dirPath = filePath.substring(0, filePath.lastIndexOf("/")) || "/";
            const Icon = getFileIcon(fileName);

            return (
              <CommandItem
                key={filePath}
                value={filePath}
                onSelect={() => handleSelect(filePath)}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer data-[selected=true]:bg-neutral-700/60"
              >
                <Icon className="h-4 w-4 shrink-0 text-neutral-500" />
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm text-neutral-200 truncate">
                    {fileName}
                  </span>
                  {dirPath !== "/" && (
                    <span className="text-xs text-neutral-500 truncate">
                      {dirPath}
                    </span>
                  )}
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
