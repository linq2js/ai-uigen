"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, X } from "lucide-react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { PreferenceToolbar } from "./PreferenceToolbar";
import { ProjectSettingsDialog } from "./ProjectSettingsDialog";
import { CloneProjectDialog } from "@/components/sidebar/CloneProjectDialog";
import { cloneProject } from "@/actions/clone-project";
import { useChat } from "@/lib/contexts/chat-context";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import { useAttachments } from "@/hooks/use-attachments";

export function ChatInterface({ readOnly = false, onSwitchToCode }: { readOnly?: boolean; onSwitchToCode?: () => void }) {
  const { projectId, messages, input, setInput, handleInputChange, handleSubmit, status, error, preferences, setPreference, isDefault, resetPreferences, queue, isGenerating, stopGeneration, cancelQueuedMessage, retryLastMessage, dismissError, errorDismissed } = useChat();
  const { getAllFiles, refreshTrigger } = useFileSystem();
  const { attachments, addFiles, removeAttachment, clearAttachments } = useAttachments();
  const router = useRouter();
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false);
  const [cloneFromIndex, setCloneFromIndex] = useState<number | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  const vaultFiles = useMemo(
    () => Array.from(getAllFiles().keys()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getAllFiles, refreshTrigger]
  );

  const bottomPanelRef = useRef<HTMLDivElement>(null);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(180);

  const measureBottomPanel = useCallback(() => {
    if (bottomPanelRef.current) {
      setBottomPanelHeight(bottomPanelRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    const el = bottomPanelRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measureBottomPanel);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measureBottomPanel]);

  return (
    <div className="relative h-full overflow-hidden">
      <div className="h-full overflow-hidden px-4 pt-3 pb-0">
        <MessageList messages={messages} isLoading={status === "streaming"} onSwitchToCode={onSwitchToCode} bottomPadding={bottomPanelHeight} queue={queue} onCancelQueued={cancelQueuedMessage} onCloneFromMessage={readOnly ? undefined : (idx) => setCloneFromIndex(idx)} />
      </div>
      {!readOnly && error && !errorDismissed && (
        <div className="absolute bottom-48 left-3 right-3 z-20 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center justify-between gap-3">
          <span className="min-w-0 truncate"><strong>Error:</strong> {error.message}</span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={retryLastMessage}
              className="p-1.5 rounded-md hover:bg-red-500/20 transition-colors"
              title="Retry"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={dismissError}
              className="p-1.5 rounded-md hover:bg-red-500/20 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {!readOnly && (
        <div ref={bottomPanelRef} className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-3 pt-8 bg-gradient-to-t from-neutral-900 from-70% to-transparent">
          <PreferenceToolbar
            preferences={preferences}
            setPreference={setPreference}
            isDefault={isDefault}
            onReset={resetPreferences}
          />
          <MessageInput
            input={input}
            setInput={setInput}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isGenerating}
            onStop={stopGeneration}
            attachments={attachments}
            onAddFiles={addFiles}
            onRemoveAttachment={removeAttachment}
            onClearAttachments={clearAttachments}
            vaultFiles={vaultFiles}
            onOpenProjectSettings={() => setProjectSettingsOpen(true)}
            projectId={projectId}
            aiModel={preferences.aiModel}
            onModelChange={(model) => setPreference("aiModel", model)}
          />
        </div>
      )}
      <ProjectSettingsDialog
        open={projectSettingsOpen}
        onOpenChange={setProjectSettingsOpen}
      />
      <CloneProjectDialog
        open={cloneFromIndex != null}
        onOpenChange={(open) => { if (!open) setCloneFromIndex(null); }}
        projectName="this project"
        fromMessageIndex={cloneFromIndex ?? undefined}
        totalMessageCount={messages.length}
        isCloning={isCloning}
        onConfirm={async (options) => {
          if (!projectId) return;
          setIsCloning(true);
          try {
            const newProject = await cloneProject({
              sourceProjectId: projectId,
              ...options,
            });
            setCloneFromIndex(null);
            router.push(`/${newProject.id}`);
          } catch (err) {
            console.error("Failed to clone:", err);
          } finally {
            setIsCloning(false);
          }
        }}
      />
    </div>
  );
}
