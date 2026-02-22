"use client";

import React, { useCallback, useMemo } from "react";
import { Message } from "ai";
import { Virtuoso } from "react-virtuoso";
import { cn } from "@/lib/utils";
import {
  Bot,
  Clock,
  Loader2,
  FileCode,
  Pencil,
  Eye,
  FolderEdit,
  Trash2,
  FilePlus,
  Undo2,
  FileText,
  X,
  GitBranch,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { QueuedMessage } from "@/lib/types/queue";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { AttachmentPreview } from "./AttachmentPreview";
import { useFileSystem } from "@/lib/contexts/file-system-context";

function getToolDisplay(tool: {
  toolName: string;
  args?: Record<string, unknown>;
  state: string;
}) {
  const args = tool.args || {};
  const command = args.command as string | undefined;
  const path = args.path as string | undefined;
  const shortPath = path ? path.split("/").pop() || path : undefined;

  if (tool.toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return {
          label: "Create file",
          detail: shortPath,
          path,
          icon: FilePlus,
        };
      case "str_replace":
        return { label: "Edit file", detail: shortPath, path, icon: Pencil };
      case "view":
        return { label: "View file", detail: shortPath, path, icon: Eye };
      case "insert":
        return {
          label: "Insert code",
          detail: shortPath,
          path,
          icon: FileCode,
        };
      case "undo_edit":
        return { label: "Undo edit", detail: shortPath, path, icon: Undo2 };
      default:
        return { label: "Edit file", detail: shortPath, path, icon: FileCode };
    }
  }

  if (tool.toolName === "file_manager") {
    switch (command) {
      case "rename":
        return {
          label: "Rename file",
          detail: shortPath,
          path,
          icon: FolderEdit,
        };
      case "delete":
        return { label: "Delete file", detail: shortPath, path, icon: Trash2 };
      default:
        return {
          label: "Manage files",
          detail: shortPath,
          path,
          icon: FolderEdit,
        };
    }
  }

  if (tool.toolName === "read_skill") {
    const skillId = args.skillId as string | undefined;
    return {
      label: "Read skill",
      detail: skillId,
      path: undefined,
      icon: FileText,
    };
  }

  if (tool.toolName === "read_attachment") {
    const filename = args.filename as string | undefined;
    return {
      label: "Read attachment",
      detail: filename,
      path: undefined,
      icon: FileText,
    };
  }

  return {
    label: tool.toolName,
    detail: undefined,
    path: undefined,
    icon: FileCode,
  };
}

function getMessageText(message: Message): string {
  if (message.parts) {
    return message.parts
      .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
      .map((p) => p.text)
      .join("\n");
  }
  return message.content || "";
}

const MessageRow = React.memo(function MessageRow({
  message,
  isLoading,
  isLast,
  onFileClick,
  onCloneFromMessage,
}: {
  message: Message;
  isLoading: boolean;
  isLast: boolean;
  onFileClick: (path: string) => void;
  onCloneFromMessage?: () => void;
}) {
  const handleCopy = useCallback(() => {
    const text = getMessageText(message);
    navigator.clipboard.writeText(text);
  }, [message]);
  return (
    <div
      className={cn(
        "group/msg relative flex gap-3",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
        <div
          className={cn(
            "flex flex-col gap-1 min-w-0",
            message.role === "user" ? "max-w-[85%]" : "w-full",
            message.role === "user" ? "items-end" : "items-start"
          )}
        >
        {message.role === "user" &&
          message.experimental_attachments &&
          message.experimental_attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.experimental_attachments.map((attachment, i) => (
                <AttachmentPreview
                  key={i}
                  attachment={attachment}
                />
              ))}
            </div>
          )}
        <div
          className={cn(
            "rounded-xl px-3 py-1.5 min-w-0 max-w-full overflow-hidden",
            message.role === "user"
              ? "bg-blue-600 text-white"
              : "bg-neutral-800 text-neutral-100 border border-neutral-700"
          )}
        >
          <div className="text-sm">
            {message.parts ? (
              <>
                {message.parts.map((part, partIndex, parts) => {
                  let afterTool = false;
                  for (let i = partIndex - 1; i >= 0; i--) {
                    if (parts[i].type === "step-start") continue;
                    afterTool = parts[i].type === "tool-invocation";
                    break;
                  }

                  switch (part.type) {
                    case "text":
                      return message.role === "user" ? (
                        <span key={partIndex} className="whitespace-pre-wrap">
                          {part.text}
                        </span>
                      ) : (
                        <MarkdownRenderer
                          key={partIndex}
                          content={part.text}
                          className={cn("prose-sm", afterTool && "mt-3")}
                        />
                      );
                    case "reasoning":
                      return (
                        <div
                          key={partIndex}
                          className="mt-3 p-3 bg-neutral-700/50 rounded-md border border-neutral-600"
                        >
                          <span className="text-xs font-medium text-neutral-400 block mb-1">
                            Reasoning
                          </span>
                          <span className="text-sm text-neutral-300">
                            {part.reasoning}
                          </span>
                        </div>
                      );
                    case "tool-invocation":
                      const toolInvocation = part.toolInvocation;
                      const display = getToolDisplay(toolInvocation);
                      const ToolIcon = display.icon;
                      return (
                        <div
                          key={partIndex}
                          className="flex items-center gap-1.5 mt-1 text-xs text-neutral-500"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 shrink-0"></div>
                          <ToolIcon className="w-3 h-3 flex-shrink-0" />
                          <span>{display.label}</span>
                          {display.detail && display.path ? (
                            <button
                              onClick={() => onFileClick(display.path!)}
                              className="text-blue-400/70 font-mono hover:text-blue-300 hover:underline cursor-pointer transition-colors"
                            >
                              {display.detail}
                            </button>
                          ) : display.detail ? (
                            <span className="font-mono">{display.detail}</span>
                          ) : null}
                        </div>
                      );
                    case "source":
                      return (
                        <div
                          key={partIndex}
                          className="mt-2 text-xs text-neutral-400"
                        >
                          Source: {JSON.stringify(part.source)}
                        </div>
                      );
                    case "step-start":
                      return null;
                    default:
                      return null;
                  }
                })}
                {isLoading && message.role === "assistant" && isLast && (
                  <div className="flex items-center gap-2 mt-3 text-neutral-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-sm">Generating...</span>
                  </div>
                )}
              </>
            ) : message.content ? (
              message.role === "user" ? (
                <span className="whitespace-pre-wrap">{message.content}</span>
              ) : (
                <MarkdownRenderer
                  content={message.content}
                  className="prose-sm"
                />
              )
            ) : isLoading && message.role === "assistant" && isLast ? (
              <div className="flex items-center gap-2 text-neutral-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-sm">Generating...</span>
              </div>
            ) : null}
          </div>
        </div>
        <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-neutral-500 hover:text-neutral-200 hover:bg-neutral-700/60 text-xs"
                aria-label="Message actions"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="bottom">
              <DropdownMenuItem onClick={handleCopy}>
                <Copy />
                Copy message
              </DropdownMenuItem>
              {onCloneFromMessage && (
                <DropdownMenuItem onClick={onCloneFromMessage}>
                  <GitBranch />
                  Clone from here
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
});

const QueuedMessageRow = React.memo(function QueuedMessageRow({
  item,
  onCancel,
}: {
  item: QueuedMessage;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="flex gap-3 justify-end">
      <div className="flex flex-col gap-2 max-w-[85%] items-end">
        {item.attachments && item.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {item.attachments.map((att, i) =>
              att.contentType?.startsWith("image/") ? (
                <img
                  key={i}
                  src={att.url}
                  alt={att.name || `Attachment ${i + 1}`}
                  className="max-w-[200px] max-h-[160px] rounded-lg border border-white/10 object-cover opacity-50"
                />
              ) : (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-white/50 text-xs"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="max-w-[140px] truncate">
                    {att.name || `File ${i + 1}`}
                  </span>
                </div>
              )
            )}
          </div>
        )}
        <div className="rounded-xl px-3 py-1.5 bg-blue-600/50 text-white/70 border border-blue-500/30 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 animate-pulse flex-shrink-0" />
          <span className="text-sm whitespace-pre-wrap">{item.content}</span>
          <button
            type="button"
            onClick={() => onCancel(item.id)}
            className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Cancel queued message"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="text-[10px] text-neutral-500">Queued</span>
      </div>
    </div>
  );
});

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onSwitchToCode?: () => void;
  bottomPadding?: number;
  queue?: QueuedMessage[];
  onCancelQueued?: (id: string) => void;
  onCloneFromMessage?: (messageIndex: number) => void;
}

type DisplayItem =
  | { type: "message"; message: Message }
  | { type: "queued"; item: QueuedMessage };

export function MessageList({
  messages,
  isLoading,
  onSwitchToCode,
  bottomPadding = 180,
  queue = [],
  onCancelQueued,
  onCloneFromMessage,
}: MessageListProps) {
  const { setSelectedFile } = useFileSystem();

  const handleFileClick = useCallback(
    (path: string) => {
      setSelectedFile(path);
      onSwitchToCode?.();
    },
    [setSelectedFile, onSwitchToCode]
  );

  const displayItems = useMemo<DisplayItem[]>(() => {
    const items: DisplayItem[] = messages.map((m) => ({ type: "message", message: m }));
    for (const q of queue) {
      items.push({ type: "queued", item: q });
    }
    return items;
  }, [messages, queue]);

  if (messages.length === 0 && queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/15 mb-4">
          <Bot className="h-6 w-6 text-blue-400" />
        </div>
        <p className="text-neutral-100 font-semibold text-lg mb-2">
          Start a conversation to generate anything
        </p>
        <p className="text-neutral-400 text-sm max-w-sm">
          From simple components to full apps — just describe what you need
        </p>
      </div>
    );
  }

  return (
    <Virtuoso
      data={displayItems}
      initialTopMostItemIndex={displayItems.length - 1}
      followOutput="smooth"
      className="h-full"
      components={{
        Footer: () => <div style={{ height: bottomPadding }} />,
      }}
      itemContent={(index, item) => (
        <div className="py-2">
          <div className="max-w-4xl mx-auto">
            {item.type === "message" ? (
              <MessageRow
                message={item.message}
                isLoading={!!isLoading}
                isLast={index === messages.length - 1 && queue.length === 0}
                onFileClick={handleFileClick}
                onCloneFromMessage={onCloneFromMessage ? () => onCloneFromMessage(index) : undefined}
              />
            ) : (
              <QueuedMessageRow
                item={item.item}
                onCancel={onCancelQueued ?? (() => {})}
              />
            )}
          </div>
        </div>
      )}
    />
  );
}
