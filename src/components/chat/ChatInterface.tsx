"use client";

import { useEffect, useRef, useMemo } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { PreferenceToolbar } from "./PreferenceToolbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/lib/contexts/chat-context";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import { useAttachments } from "@/hooks/use-attachments";

export function ChatInterface({ readOnly = false, onSwitchToCode }: { readOnly?: boolean; onSwitchToCode?: () => void }) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { messages, input, setInput, handleInputChange, handleSubmit, status, error, preferences, setPreference, isDefault } = useChat();
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
    <div className="flex flex-col h-full p-3 overflow-hidden">
      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-hidden">
        <div className="pr-4">
          <MessageList messages={messages} isLoading={status === "streaming"} onSwitchToCode={onSwitchToCode} />
        </div>
      </ScrollArea>
      {!readOnly && error && (
        <div className="mx-2 mb-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          <strong>Error:</strong> {error.message}
        </div>
      )}
      {!readOnly && (
        <div className="mt-2 flex-shrink-0">
          <PreferenceToolbar
            preferences={preferences}
            setPreference={setPreference}
            isDefault={isDefault}
          />
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
      )}
    </div>
  );
}
