"use client";

import { useState, useCallback } from "react";
import { ChatAttachment } from "@/lib/types/attachments";

const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const TEXT_EXTENSIONS = [
  ".txt",
  ".json",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".css",
  ".html",
  ".md",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 10;

function isAllowedFile(file: File): boolean {
  if (IMAGE_TYPES.includes(file.type)) return true;
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return TEXT_EXTENSIONS.includes(ext);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useAttachments() {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    setAttachments((prev) => {
      const remaining = MAX_FILES - prev.length;
      if (remaining <= 0) return prev;

      const toProcess = fileArray.slice(0, remaining);
      const validFiles = toProcess.filter(
        (f) => f.size <= MAX_FILE_SIZE && isAllowedFile(f)
      );

      if (validFiles.length === 0) return prev;

      // Start async reads — we'll update state as they resolve
      const newAttachments: ChatAttachment[] = validFiles.map((file) => {
        const isImage = IMAGE_TYPES.includes(file.type);
        return {
          id: crypto.randomUUID(),
          file,
          name: file.name,
          contentType: file.type || "text/plain",
          dataUrl: "", // will be filled async
          isImage,
        };
      });

      // Kick off reads and update each attachment's dataUrl
      newAttachments.forEach((att) => {
        readFileAsDataUrl(att.file)
          .then((dataUrl) => {
            setAttachments((current) =>
              current.map((a) => (a.id === att.id ? { ...a, dataUrl } : a))
            );
          })
          .catch(() => {
            setAttachments((current) =>
              current.filter((a) => a.id !== att.id)
            );
          });
      });

      return [...prev, ...newAttachments];
    });
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  return { attachments, addFiles, removeAttachment, clearAttachments };
}
