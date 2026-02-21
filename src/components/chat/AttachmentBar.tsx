"use client";

import { X, FileText } from "lucide-react";
import { ChatAttachment } from "@/lib/types/attachments";

interface AttachmentBarProps {
  attachments: ChatAttachment[];
  onRemove: (id: string) => void;
}

export function AttachmentBar({ attachments, onRemove }: AttachmentBarProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {attachments.map((att, index) => (
        <div
          key={att.id}
          className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg border border-neutral-700 bg-neutral-800 text-sm group"
        >
          {att.isImage && att.dataUrl ? (
            <img
              src={att.dataUrl}
              alt={att.name}
              className="h-6 w-6 rounded object-cover"
            />
          ) : (
            <FileText className="h-4 w-4 text-neutral-500" />
          )}
          <span className="max-w-[120px] truncate text-neutral-300">
            {att.name}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            @{index + 1}
          </span>
          <button
            type="button"
            onClick={() => onRemove(att.id)}
            className="p-0.5 rounded hover:bg-neutral-600 transition-colors"
            aria-label={`Remove ${att.name}`}
          >
            <X className="h-3.5 w-3.5 text-neutral-500 group-hover:text-neutral-300" />
          </button>
        </div>
      ))}
    </div>
  );
}
