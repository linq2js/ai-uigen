"use client";

import { useEffect, useRef, useMemo } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/lib/contexts/chat-context";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import { useAttachments } from "@/hooks/use-attachments";

export function ChatInterface() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { messages, input, setInput, handleInputChange, handleSubmit, status, error } = useChat();
  const { getAllFiles, refreshTrigger } = useFileSystem();
  const { attachments, addFiles, removeAttachment, clearAttachments } = useAttachments();

  const vaultFiles = useMemo(
    () => Array.from(getAllFiles().keys()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getAllFiles, refreshTrigger]
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden">
      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-hidden">
        <div className="pr-4">
          <MessageList messages={messages} isLoading={status === "streaming"} />
        </div>
      </ScrollArea>
      {error && (
        <div className="mx-2 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <strong>Error:</strong> {error.message}
        </div>
      )}
      <div className="mt-4 flex-shrink-0">
        <MessageInput
          input={input}
          setInput={setInput}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={status === "submitted" || status === "streaming"}
          attachments={attachments}
          onAddFiles={addFiles}
          onRemoveAttachment={removeAttachment}
          onClearAttachments={clearAttachments}
          vaultFiles={vaultFiles}
        />
      </div>
    </div>
  );
}
