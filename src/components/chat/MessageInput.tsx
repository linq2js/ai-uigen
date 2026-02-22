"use client";

import {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Send, Paperclip, Square, Settings, ChevronDown, Check } from "lucide-react";
import { ChatRequestOptions } from "ai";
import { ChatAttachment, MentionItem } from "@/lib/types/attachments";
import { AIModel, AI_MODEL_OPTIONS } from "@/lib/types/preferences";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AttachmentBar } from "./AttachmentBar";
import { MentionPopup } from "./MentionPopup";
import { CheckpointDropdown } from "@/components/checkpoints/CheckpointDropdown";

interface MessageInputProps {
  input: string;
  setInput: (input: string) => void;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (
    e: FormEvent<HTMLFormElement>,
    options?: ChatRequestOptions
  ) => void;
  isLoading: boolean;
  onStop: () => void;
  attachments: ChatAttachment[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onClearAttachments: () => void;
  vaultFiles: string[];
  onOpenProjectSettings?: () => void;
  projectId?: string;
  aiModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

export function MessageInput({
  input,
  setInput,
  handleInputChange,
  handleSubmit,
  isLoading,
  onStop,
  attachments,
  onAddFiles,
  onRemoveAttachment,
  onClearAttachments,
  vaultFiles,
  onOpenProjectSettings,
  projectId,
  aiModel,
  onModelChange,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const hasContent = !!(input.trim() || attachments.length > 0);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Listen for Cmd+L code-selection mentions from the editor
  const inputRef = useRef(input);
  inputRef.current = input;

  useEffect(() => {
    const handler = (e: Event) => {
      const { file, startLine, endLine } = (e as CustomEvent).detail;
      const range =
        startLine === endLine ? `${startLine}` : `${startLine}-${endLine}`;
      const mention = `@${file}:${range} `;

      const prev = inputRef.current;
      const needsSpace = prev.length > 0 && !prev.endsWith(" ");
      setInput(prev + (needsSpace ? " " : "") + mention);

      setTimeout(() => textareaRef.current?.focus(), 0);
    };

    window.addEventListener("mention-code-selection", handler);
    return () => window.removeEventListener("mention-code-selection", handler);
  }, [setInput]);
  const [mentionQuery, setMentionQuery] = useState("");

  const mentionItems = useMemo<MentionItem[]>(() => {
    const items: MentionItem[] = [];

    // Vault files
    for (const path of vaultFiles) {
      const filename = path.split("/").pop() || path;
      items.push({
        type: "file",
        label: filename,
        value: path,
        path,
      });
    }

    // Current attachments
    attachments.forEach((att, i) => {
      items.push({
        type: "attachment",
        label: att.name,
        value: `@${i + 1}`,
        attachmentIndex: i + 1,
      });
    });

    // Filter by query
    if (mentionQuery) {
      const q = mentionQuery.toLowerCase();
      return items.filter((item) => item.label.toLowerCase().includes(q));
    }

    return items;
  }, [vaultFiles, attachments, mentionQuery]);

  // Reset highlight when the filtered list changes
  useEffect(() => {
    setMentionIndex(0);
  }, [mentionItems.length, mentionQuery]);

  const detectMention = useCallback(
    (value: string, cursorPos: number) => {
      const textBeforeCursor = value.slice(0, cursorPos);
      const match = textBeforeCursor.match(/(?:^|\s)@(\S*)$/);
      if (match) {
        setMentionQuery(match[1]);
        setMentionOpen(true);
      } else {
        setMentionOpen(false);
        setMentionQuery("");
      }
    },
    []
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      handleInputChange(e);
      detectMention(e.target.value, e.target.selectionStart);
    },
    [handleInputChange, detectMention]
  );

  const handleMentionSelect = useCallback(
    (item: MentionItem) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = input.slice(0, cursorPos);
      const textAfterCursor = input.slice(cursorPos);

      // Find the @ that triggered this mention
      const match = textBeforeCursor.match(/(?:^|\s)@(\S*)$/);
      if (!match) return;

      const atStart = cursorPos - match[1].length - 1; // -1 for the @
      const prefix = input.slice(0, atStart);
      const insertText =
        item.type === "file" ? `@${item.path} ` : `${item.value} `;

      setInput(prefix + insertText + textAfterCursor);
      setMentionOpen(false);
      setMentionQuery("");

      // Focus back on textarea
      setTimeout(() => {
        textarea.focus();
        const newPos = prefix.length + insertText.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [input, setInput]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen && mentionItems.length > 0) {
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionOpen(false);
        setMentionQuery("");
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionItems.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionItems.length) % mentionItems.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleMentionSelect(mentionItems[mentionIndex]);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        onAddFiles(files);
      }
    },
    [onAddFiles]
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onAddFiles(e.target.files);
        e.target.value = "";
      }
    },
    [onAddFiles]
  );

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const readyAttachments = attachments.filter((a) => a.dataUrl);

      if (readyAttachments.length > 0) {
        const experimentalAttachments = readyAttachments.map((att) => ({
          name: att.name,
          contentType: att.contentType,
          url: att.dataUrl,
        }));

        handleSubmit(e, { experimental_attachments: experimentalAttachments });
      } else {
        handleSubmit(e);
      }

      onClearAttachments();
    },
    [attachments, handleSubmit, onClearAttachments]
  );

  return (
    <form
      onSubmit={onSubmit}
      className="relative p-3 bg-neutral-900 rounded-t-xl"
    >
      <div className="relative max-w-4xl mx-auto">
        <AttachmentBar
          attachments={attachments}
          onRemove={onRemoveAttachment}
        />

        {mentionOpen && mentionItems.length > 0 && (
          <MentionPopup
            items={mentionItems}
            selectedIndex={mentionIndex}
            onSelect={handleMentionSelect}
            onClose={() => {
              setMentionOpen(false);
              setMentionQuery("");
            }}
          />
        )}

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Describe the app or component you want to create..."
            className="w-full min-h-[60px] max-h-[200px] px-4 py-2.5 pb-10 rounded-xl border border-neutral-700 bg-neutral-800 text-neutral-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-neutral-500 text-[15px] font-normal"
            rows={3}
          />
          <div className="absolute left-3 right-3 bottom-2 flex items-center justify-between">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-blue-500/40 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors cursor-pointer"
                >
                  <span>{aiModel}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-44 p-1" sideOffset={6}>
                {AI_MODEL_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onModelChange(option)}
                    className={cn(
                      "flex items-center w-full gap-2 px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer",
                      option === aiModel
                        ? "bg-blue-500/15 text-blue-400 font-medium"
                        : "text-neutral-300 hover:bg-neutral-700"
                    )}
                  >
                    <Check
                      className={cn(
                        "w-3.5 h-3.5 shrink-0",
                        option === aiModel ? "opacity-100 text-blue-400" : "opacity-0"
                      )}
                    />
                    {option}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-1">
            {onOpenProjectSettings && (
              <button
                type="button"
                onClick={onOpenProjectSettings}
                className="p-2.5 rounded-lg transition-all hover:bg-neutral-700"
                aria-label="Project settings"
              >
                <Settings className="h-4 w-4 text-neutral-500 hover:text-neutral-300" />
              </button>
            )}
            {projectId && <CheckpointDropdown projectId={projectId} />}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-lg transition-all hover:bg-neutral-700"
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4 text-neutral-500 hover:text-neutral-300" />
            </button>
            {!hasContent && isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2.5 rounded-lg transition-all hover:bg-red-500/15 group"
                aria-label="Cancel generation"
              >
                <Square className="h-4 w-4 text-red-400 fill-red-400 group-hover:text-red-300 group-hover:fill-red-300" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!hasContent}
                className="p-2.5 rounded-lg transition-all hover:bg-blue-500/15 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent group"
              >
                <Send
                  className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                    !hasContent ? "text-neutral-600" : "text-blue-400"
                  }`}
                />
              </button>
            )}
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,.txt,.json,.js,.jsx,.ts,.tsx,.css,.html,.md"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </form>
  );
}
