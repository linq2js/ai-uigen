"use client";

import { Message } from "ai";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2, FileCode, Pencil, Eye, FolderEdit, Trash2, FilePlus, Undo2, FileText } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

function getToolDisplay(tool: { toolName: string; args?: Record<string, unknown>; state: string }) {
  const args = tool.args || {};
  const command = args.command as string | undefined;
  const path = args.path as string | undefined;
  const shortPath = path ? path.split("/").pop() || path : undefined;

  if (tool.toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return { label: "Create file", detail: shortPath, icon: FilePlus };
      case "str_replace":
        return { label: "Edit file", detail: shortPath, icon: Pencil };
      case "view":
        return { label: "View file", detail: shortPath, icon: Eye };
      case "insert":
        return { label: "Insert code", detail: shortPath, icon: FileCode };
      case "undo_edit":
        return { label: "Undo edit", detail: shortPath, icon: Undo2 };
      default:
        return { label: "Edit file", detail: shortPath, icon: FileCode };
    }
  }

  if (tool.toolName === "file_manager") {
    switch (command) {
      case "rename":
        return { label: "Rename file", detail: shortPath, icon: FolderEdit };
      case "delete":
        return { label: "Delete file", detail: shortPath, icon: Trash2 };
      default:
        return { label: "Manage files", detail: shortPath, icon: FolderEdit };
    }
  }

  return { label: tool.toolName, detail: undefined, icon: FileCode };
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 mb-4 shadow-sm">
          <Bot className="h-7 w-7 text-blue-600" />
        </div>
        <p className="text-neutral-900 font-semibold text-lg mb-2">Start a conversation to generate React components</p>
        <p className="text-neutral-500 text-sm max-w-sm">I can help you create buttons, forms, cards, and more</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        {messages.map((message) => (
          <div
            key={message.id || message.content}
            className={cn(
              "flex gap-4",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 shadow-sm flex items-center justify-center">
                  <Bot className="h-4.5 w-4.5 text-neutral-700" />
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
                "rounded-xl px-4 py-3",
                message.role === "user"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-neutral-900 border border-neutral-200 shadow-sm"
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
                              <div key={partIndex} className="mt-3 p-3 bg-white/50 rounded-md border border-neutral-200">
                                <span className="text-xs font-medium text-neutral-600 block mb-1">Reasoning</span>
                                <span className="text-sm text-neutral-700">{part.reasoning}</span>
                              </div>
                            );
                          case "tool-invocation":
                            const toolInvocation = part.toolInvocation;
                            const display = getToolDisplay(toolInvocation);
                            const ToolIcon = display.icon;
                            const isDone = toolInvocation.state === "result" && toolInvocation.result;
                            return (
                              <div key={partIndex} className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
                                {isDone ? (
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                ) : (
                                  <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
                                )}
                                <ToolIcon className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                                <span className="text-neutral-700 font-medium">{display.label}</span>
                                {display.detail && (
                                  <span className="text-neutral-400 font-mono">{display.detail}</span>
                                )}
                              </div>
                            );
                          case "source":
                            return (
                              <div key={partIndex} className="mt-2 text-xs text-neutral-500">
                                Source: {JSON.stringify(part.source)}
                              </div>
                            );
                          case "step-start":
                            return partIndex > 0 ? <hr key={partIndex} className="my-3 border-neutral-200" /> : null;
                          default:
                            return null;
                        }
                      })}
                      {isLoading &&
                        message.role === "assistant" &&
                        messages.indexOf(message) === messages.length - 1 && (
                          <div className="flex items-center gap-2 mt-3 text-neutral-500">
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
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-sm">Generating...</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            
            {message.role === "user" && (
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-blue-600 shadow-sm flex items-center justify-center">
                  <User className="h-4.5 w-4.5 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}