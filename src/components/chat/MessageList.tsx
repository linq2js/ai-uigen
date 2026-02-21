"use client";

import { Message } from "ai";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2, FileCode, Pencil, Eye, FolderEdit, Trash2, FilePlus, Undo2, FileText } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useFileSystem } from "@/lib/contexts/file-system-context";

function getToolDisplay(tool: { toolName: string; args?: Record<string, unknown>; state: string }) {
  const args = tool.args || {};
  const command = args.command as string | undefined;
  const path = args.path as string | undefined;
  const shortPath = path ? path.split("/").pop() || path : undefined;

  if (tool.toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return { label: "Create file", detail: shortPath, path, icon: FilePlus };
      case "str_replace":
        return { label: "Edit file", detail: shortPath, path, icon: Pencil };
      case "view":
        return { label: "View file", detail: shortPath, path, icon: Eye };
      case "insert":
        return { label: "Insert code", detail: shortPath, path, icon: FileCode };
      case "undo_edit":
        return { label: "Undo edit", detail: shortPath, path, icon: Undo2 };
      default:
        return { label: "Edit file", detail: shortPath, path, icon: FileCode };
    }
  }

  if (tool.toolName === "file_manager") {
    switch (command) {
      case "rename":
        return { label: "Rename file", detail: shortPath, path, icon: FolderEdit };
      case "delete":
        return { label: "Delete file", detail: shortPath, path, icon: Trash2 };
      default:
        return { label: "Manage files", detail: shortPath, path, icon: FolderEdit };
    }
  }

  return { label: tool.toolName, detail: undefined, path: undefined, icon: FileCode };
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onSwitchToCode?: () => void;
}

export function MessageList({ messages, isLoading, onSwitchToCode }: MessageListProps) {
  const { setSelectedFile } = useFileSystem();

  const handleFileClick = (path: string) => {
    setSelectedFile(path);
    onSwitchToCode?.();
  };
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/15 mb-4">
          <Bot className="h-6 w-6 text-blue-400" />
        </div>
        <p className="text-neutral-100 font-semibold text-lg mb-2">Start a conversation to generate React components</p>
        <p className="text-neutral-400 text-sm max-w-sm">I can help you create buttons, forms, cards, and more</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-3 py-3">
      <div className="space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((message) => (
          <div
            key={message.id || message.content}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0">
                <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-neutral-300" />
                </div>
              </div>
            )}

            <div className={cn(
              "flex flex-col gap-2 max-w-[85%]",
              message.role === "user" ? "items-end" : "items-start"
            )}>
              {message.role === "user" && message.experimental_attachments && message.experimental_attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {message.experimental_attachments.map((attachment, i) => (
                    attachment.contentType?.startsWith("image/") ? (
                      <img
                        key={i}
                        src={attachment.url}
                        alt={attachment.name || `Attachment ${i + 1}`}
                        className="max-w-[200px] max-h-[160px] rounded-lg border border-white/20 object-cover"
                      />
                    ) : (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/30 text-white text-xs">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="max-w-[140px] truncate">{attachment.name || `File ${i + 1}`}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
              <div className={cn(
                "rounded-xl px-3 py-2",
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-neutral-100 border border-neutral-700"
              )}>
                <div className="text-sm">
                  {message.parts ? (
                    <>
                      {message.parts.map((part, partIndex) => {
                        switch (part.type) {
                          case "text":
                            return message.role === "user" ? (
                              <span key={partIndex} className="whitespace-pre-wrap">{part.text}</span>
                            ) : (
                              <MarkdownRenderer
                                key={partIndex}
                                content={part.text}
                                className="prose-sm"
                              />
                            );
                          case "reasoning":
                            return (
                              <div key={partIndex} className="mt-3 p-3 bg-neutral-700/50 rounded-md border border-neutral-600">
                                <span className="text-xs font-medium text-neutral-400 block mb-1">Reasoning</span>
                                <span className="text-sm text-neutral-300">{part.reasoning}</span>
                              </div>
                            );
                          case "tool-invocation":
                            const toolInvocation = part.toolInvocation;
                            const display = getToolDisplay(toolInvocation);
                            const ToolIcon = display.icon;
                            const isDone = toolInvocation.state === "result" && toolInvocation.result;
                            return (
                              <div key={partIndex} className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-800 rounded-lg text-xs border border-neutral-700">
                                {isDone ? (
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                ) : (
                                  <Loader2 className="w-3 h-3 animate-spin text-blue-400 flex-shrink-0" />
                                )}
                                <ToolIcon className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                                <span className="text-neutral-300 font-medium">{display.label}</span>
                                {display.detail && display.path ? (
                                  <button
                                    onClick={() => handleFileClick(display.path!)}
                                    className="text-blue-400 font-mono hover:text-blue-300 hover:underline cursor-pointer transition-colors"
                                  >
                                    {display.detail}
                                  </button>
                                ) : display.detail ? (
                                  <span className="text-neutral-500 font-mono">{display.detail}</span>
                                ) : null}
                              </div>
                            );
                          case "source":
                            return (
                              <div key={partIndex} className="mt-2 text-xs text-neutral-400">
                                Source: {JSON.stringify(part.source)}
                              </div>
                            );
                          case "step-start":
                            return partIndex > 0 ? <hr key={partIndex} className="my-3 border-neutral-700" /> : null;
                          default:
                            return null;
                        }
                      })}
                      {isLoading &&
                        message.role === "assistant" &&
                        messages.indexOf(message) === messages.length - 1 && (
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
                      <MarkdownRenderer content={message.content} className="prose-sm" />
                    )
                  ) : isLoading &&
                    message.role === "assistant" &&
                    messages.indexOf(message) === messages.length - 1 ? (
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-sm">Generating...</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {message.role === "user" && (
              <div className="flex-shrink-0">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
