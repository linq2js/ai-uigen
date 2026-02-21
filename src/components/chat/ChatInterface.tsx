"use client";

import { useMemo } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { PreferenceToolbar } from "./PreferenceToolbar";
import { useChat } from "@/lib/contexts/chat-context";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import { useAttachments } from "@/hooks/use-attachments";

export function ChatInterface({ readOnly = false, onSwitchToCode }: { readOnly?: boolean; onSwitchToCode?: () => void }) {
  const { messages, input, setInput, handleInputChange, handleSubmit, status, error, preferences, setPreference, isDefault } = useChat();
  const { getAllFiles, refreshTrigger } = useFileSystem();
  const { attachments, addFiles, removeAttachment, clearAttachments } = useAttachments();

  const vaultFiles = useMemo(
    () => Array.from(getAllFiles().keys()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getAllFiles, refreshTrigger]
  );

  return (
    <div className="relative h-full overflow-hidden">
      <div className="h-full overflow-hidden px-3 pt-3 pb-0">
        <MessageList messages={messages} isLoading={status === "streaming"} onSwitchToCode={onSwitchToCode} />
      </div>
      {!readOnly && error && (
        <div className="absolute bottom-48 left-3 right-3 z-20 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          <strong>Error:</strong> {error.message}
        </div>
      )}
      {!readOnly && (
        <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-3 pt-8 bg-gradient-to-t from-neutral-900 from-70% to-transparent">
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
