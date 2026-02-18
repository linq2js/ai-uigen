"use client";

import {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Send, Paperclip } from "lucide-react";
import { ChatRequestOptions } from "ai";
import { ChatAttachment, MentionItem } from "@/lib/types/attachments";
import { AttachmentBar } from "./AttachmentBar";
import { MentionPopup } from "./MentionPopup";

interface MessageInputProps {
  input: string;
  setInput: (input: string) => void;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (
    e: FormEvent<HTMLFormElement>,
    options?: ChatRequestOptions
  ) => void;
  isLoading: boolean;
  attachments: ChatAttachment[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onClearAttachments: () => void;
  vaultFiles: string[];
}

export function MessageInput({
  input,
  setInput,
  handleInputChange,
  handleSubmit,
  isLoading,
  attachments,
  onAddFiles,
  onRemoveAttachment,
  onClearAttachments,
  vaultFiles,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
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
    if (mentionOpen) {
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionOpen(false);
        setMentionQuery("");
        return;
      }
      // Let cmdk handle arrow keys and Enter when mention popup is open
      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "Enter"
      ) {
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
      className="relative p-4 bg-white border-t border-neutral-200/60"
    >
      <div className="relative max-w-4xl mx-auto">
        <AttachmentBar
          attachments={attachments}
          onRemove={onRemoveAttachment}
        />

        {mentionOpen && mentionItems.length > 0 && (
          <MentionPopup
            query={mentionQuery}
            items={mentionItems}
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
            placeholder="Describe the React component you want to create..."
            disabled={isLoading}
            className="w-full min-h-[80px] max-h-[200px] pl-4 pr-24 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all placeholder:text-neutral-400 text-[15px] font-normal shadow-sm"
            rows={3}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-2.5 rounded-lg transition-all hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
            </button>
            <button
              type="submit"
              disabled={
                isLoading || (!input.trim() && attachments.length === 0)
              }
              className="p-2.5 rounded-lg transition-all hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent group"
            >
              <Send
                className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                  isLoading || (!input.trim() && attachments.length === 0)
                    ? "text-neutral-300"
                    : "text-blue-600"
                }`}
              />
            </button>
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
