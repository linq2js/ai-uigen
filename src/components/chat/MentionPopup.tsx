"use client";

import { useEffect, useRef } from "react";
import { FileCode, Paperclip } from "lucide-react";
import { MentionItem } from "@/lib/types/attachments";

interface MentionPopupProps {
  items: MentionItem[];
  selectedIndex: number;
  onSelect: (item: MentionItem) => void;
  onClose: () => void;
}

export function MentionPopup({
  items,
  selectedIndex,
  onSelect,
  onClose,
}: MentionPopupProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll the highlighted item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const fileItems = items.filter((i) => i.type === "file");
  const attachmentItems = items.filter((i) => i.type === "attachment");

  // Build a flat ordered list matching the render order so selectedIndex maps correctly
  const ordered = [...fileItems, ...attachmentItems];

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 z-50">
      <div className="border border-neutral-700 rounded-lg shadow-lg bg-neutral-800 max-h-[240px] overflow-y-auto">
        <div ref={listRef} role="listbox">
          {fileItems.length > 0 && (
            <div className="px-2 py-1.5 text-xs font-medium text-neutral-400 select-none">
              Files
            </div>
          )}
          {fileItems.map((item) => {
            const idx = ordered.indexOf(item);
            return (
              <div
                key={item.value}
                role="option"
                aria-selected={idx === selectedIndex}
                onClick={() => onSelect(item)}
                className={`flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? "bg-neutral-700 text-neutral-100"
                    : "text-neutral-300 hover:bg-neutral-700/50"
                }`}
              >
                <FileCode className="h-4 w-4 shrink-0 text-blue-500" />
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}
          {attachmentItems.length > 0 && (
            <div className="px-2 py-1.5 text-xs font-medium text-neutral-400 select-none">
              Attachments
            </div>
          )}
          {attachmentItems.map((item) => {
            const idx = ordered.indexOf(item);
            return (
              <div
                key={item.value}
                role="option"
                aria-selected={idx === selectedIndex}
                onClick={() => onSelect(item)}
                className={`flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? "bg-neutral-700 text-neutral-100"
                    : "text-neutral-300 hover:bg-neutral-700/50"
                }`}
              >
                <Paperclip className="h-4 w-4 shrink-0 text-amber-500" />
                <span className="truncate">{item.label}</span>
                <span className="ml-auto text-xs text-neutral-400 font-mono">
                  @{item.attachmentIndex}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
