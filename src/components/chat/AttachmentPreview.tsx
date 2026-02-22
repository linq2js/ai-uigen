"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Check, Copy, Download, Eye, FileText, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Attachment {
  name?: string;
  url: string;
  contentType?: string;
}

function decodeTextContent(dataUrl: string): string | null {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) return null;
  try {
    return atob(dataUrl.slice(commaIdx + 1));
  } catch {
    return null;
  }
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function AttachmentPreview({
  attachment,
}: {
  attachment: Attachment;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const isImage = attachment.contentType?.startsWith("image/") ?? false;
  const name = attachment.name || "Untitled";

  const textContent = useMemo(() => {
    if (isImage || !attachment.url) return null;
    return decodeTextContent(attachment.url);
  }, [isImage, attachment.url]);

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (attachment.url) {
        triggerDownload(attachment.url, name);
      }
    },
    [attachment.url, name]
  );

  const handleCopy = useCallback(async () => {
    const content = isImage ? attachment.url : textContent;
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [isImage, attachment.url, textContent]);

  return (
    <>
      {isImage ? (
        <div className="group relative">
          <button
            onClick={() => setOpen(true)}
            className="cursor-pointer rounded-lg border border-white/20 overflow-hidden hover:border-white/40 transition-colors"
          >
            <img
              src={attachment.url}
              alt={name}
              className="max-w-[200px] max-h-[160px] object-cover"
            />
          </button>
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setOpen(true)}
              className="p-1 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"
              title="View"
            >
              <Eye className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/30 text-white text-xs hover:bg-blue-500/50 transition-colors cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5" />
          <span className="max-w-[140px] truncate">{name}</span>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="bg-neutral-900 border-neutral-700 text-white sm:max-w-2xl max-h-[85vh] flex flex-col"
          showCloseButton={false}
        >
          <DialogHeader className="flex-row items-center justify-between gap-4">
            <DialogTitle className="text-sm font-medium text-neutral-200 truncate">
              {name}
            </DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-700 text-white text-xs hover:bg-neutral-600 transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-500 transition-colors"
              >
                <Download className="h-3 w-3" />
                Download
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="overflow-auto flex-1 rounded-md">
            {isImage ? (
              <img
                src={attachment.url}
                alt={name}
                className="w-full h-auto rounded-md"
              />
            ) : textContent !== null ? (
              <pre className="p-4 bg-neutral-800 rounded-md text-xs text-neutral-300 font-mono whitespace-pre-wrap break-words overflow-auto max-h-[60vh]">
                {textContent}
              </pre>
            ) : (
              <div className="p-4 text-center text-neutral-500 text-sm">
                Unable to preview this file.{" "}
                <button
                  onClick={handleDownload}
                  className="text-blue-400 hover:underline"
                >
                  Download instead
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
