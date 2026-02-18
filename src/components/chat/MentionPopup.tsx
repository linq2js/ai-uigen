"use client";

import { FileCode, Paperclip } from "lucide-react";
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { MentionItem } from "@/lib/types/attachments";

interface MentionPopupProps {
  query: string;
  items: MentionItem[];
  onSelect: (item: MentionItem) => void;
  onClose: () => void;
}

export function MentionPopup({
  query,
  items,
  onSelect,
  onClose,
}: MentionPopupProps) {
  const fileItems = items.filter((i) => i.type === "file");
  const attachmentItems = items.filter((i) => i.type === "attachment");

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 z-50">
      <Command
        className="border border-neutral-200 rounded-lg shadow-lg bg-white max-h-[240px]"
        filter={(value, search) => {
          if (value.toLowerCase().includes(search.toLowerCase())) return 1;
          return 0;
        }}
      >
        <CommandList>
          <CommandEmpty className="py-3 text-center text-sm text-neutral-500">
            No matches found
          </CommandEmpty>
          {fileItems.length > 0 && (
            <CommandGroup heading="Files">
              {fileItems.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => onSelect(item)}
                  className="cursor-pointer"
                >
                  <FileCode className="h-4 w-4 text-blue-500" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {attachmentItems.length > 0 && (
            <CommandGroup heading="Attachments">
              {attachmentItems.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => onSelect(item)}
                  className="cursor-pointer"
                >
                  <Paperclip className="h-4 w-4 text-amber-500" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-xs text-neutral-400 font-mono">
                    @{item.attachmentIndex}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  );
}
