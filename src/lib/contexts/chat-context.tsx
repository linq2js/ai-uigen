"use client";

import {
  createContext,
  useCallback,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { Message, ChatRequestOptions } from "ai";
import { useFileSystem } from "./file-system-context";
import { useProjectStore } from "@/lib/project-store/context";
import { usePreferences } from "@/hooks/use-preferences";
import { useApiKey } from "@/hooks/use-api-key";
import { useGlobalRules } from "@/hooks/use-global-rules";
import { useProjectRules } from "@/hooks/use-project-rules";
import { useGlobalSkills } from "@/hooks/use-global-skills";
import { useProjectSkills } from "@/hooks/use-project-skills";
import {
  type GenerationPreferences,
  MAX_AUTO_CONTINUATIONS,
} from "@/lib/types/preferences";
import type { Skill } from "@/lib/types/skill";
import { toDescriptor } from "@/lib/types/skill";
import type { QueuedMessage } from "@/lib/types/queue";
import { markGenerating, markIdle } from "@/lib/generation-tracker";
import { useAutoSave } from "@/hooks/use-auto-save";
import { buildSystemPrompt } from "@/lib/prompts/prompt-builder";
import { truncateMessages } from "@/lib/truncate-messages";
import { collectAttachments, stripOldAttachments } from "@/lib/attachments";
import { getSystemSkills } from "@/lib/skills/system";
import { executeClientTool } from "@/lib/tools/client-tool-executor";

interface ChatContextProps {
  projectId?: string;
  initialMessages?: Message[];
}

interface ChatContextType {
  projectId?: string;
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    options?: ChatRequestOptions
  ) => void;
  status: string;
  error: Error | undefined;
  preferences: GenerationPreferences;
  setPreference: <K extends keyof GenerationPreferences>(
    key: K,
    value: GenerationPreferences[K]
  ) => void;
  isDefault: <K extends keyof GenerationPreferences>(key: K) => boolean;
  resetPreferences: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  globalRules: string;
  setGlobalRules: (rules: string) => void;
  projectRules: string;
  setProjectRules: (rules: string) => Promise<void>;
  globalSkills: Skill[];
  addGlobalSkill: (skill: Omit<Skill, "id">) => void;
  updateGlobalSkill: (id: string, updates: Partial<Omit<Skill, "id">>) => void;
  deleteGlobalSkill: (id: string) => void;
  toggleGlobalSkill: (id: string) => void;
  projectSkills: Skill[];
  addProjectSkill: (skill: Omit<Skill, "id">) => void;
  updateProjectSkill: (id: string, updates: Partial<Omit<Skill, "id">>) => void;
  deleteProjectSkill: (id: string) => void;
  toggleProjectSkill: (id: string) => void;
  allEnabledSkills: Skill[];
  queue: QueuedMessage[];
  isGenerating: boolean;
  stopGeneration: () => void;
  stopAll: () => void;
  cancelQueuedMessage: (id: string) => void;
  retryLastMessage: () => void;
  dismissError: () => void;
  errorDismissed: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  projectId,
  initialMessages = [],
}: ChatContextProps & { children: ReactNode }) {
  const { fileSystem, handleToolCall, selectedFile, editorVisibleRange, previewErrors } = useFileSystem();
  useAutoSave(projectId);
  const { preferences, setPreference, resetPreferences, isDefault } = usePreferences();
  const { apiKey, setApiKey, clearApiKey } = useApiKey();
  const { globalRules, setGlobalRules } = useGlobalRules();
  const { projectRules, setProjectRules } = useProjectRules(projectId);
  const {
    skills: globalSkills,
    addSkill: addGlobalSkill,
    updateSkill: updateGlobalSkill,
    deleteSkill: deleteGlobalSkill,
    toggleSkill: toggleGlobalSkill,
  } = useGlobalSkills();
  const {
    skills: projectSkills,
    addSkill: addProjectSkill,
    updateSkill: updateProjectSkill,
    deleteSkill: deleteProjectSkill,
    toggleSkill: toggleProjectSkill,
  } = useProjectSkills(projectId);

  const allEnabledSkills = useMemo(
    () => [...globalSkills, ...projectSkills].filter((s) => s.enabled),
    [globalSkills, projectSkills],
  );

  // Compute all skills (system + user-enabled) for prompt building and tool execution
  const allSkills = useMemo(() => {
    const systemSkills = getSystemSkills(preferences);
    return [...systemSkills, ...allEnabledSkills];
  }, [preferences, allEnabledSkills]);

  // Build attachment store and collect descriptors for the system prompt
  const attachmentStoreRef = useRef<Map<string, any>>(new Map());

  const thinkingEnabled = preferences.aiModel?.includes("Thinking") ?? false;

  const [continuationNeeded, setContinuationNeeded] = useState(false);
  const continuationCountRef = useRef(0);

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit: sdkHandleSubmit,
    append,
    reload,
    stop,
    status,
    error,
  } = useAIChat({
    api: "/api/chat",
    initialMessages,
    keepLastMessageOnError: true,
    maxSteps: 25,
    body: {
      modelId: preferences.aiModel,
      apiKey: apiKey || undefined,
      thinkingEnabled,
    },
    experimental_prepareRequestBody: ({ messages: chatMessages, ...rest }: any) => {
      // Build the system prompt client-side
      const skillDescriptors = allSkills.map(toDescriptor);
      const attachmentStore = collectAttachments(chatMessages);
      attachmentStoreRef.current = attachmentStore;

      const strippedMessages = stripOldAttachments(chatMessages);

      const attachmentDescriptors = Array.from(attachmentStore.values()).map(
        (a: any) => ({
          name: a.name,
          contentType: a.contentType,
          isImage: a.isImage,
        })
      );

      const systemMessage = {
        role: "system" as const,
        content: buildSystemPrompt(preferences, {
          globalRules: globalRules || undefined,
          projectRules: projectRules || undefined,
          skills: skillDescriptors.length > 0 ? skillDescriptors : undefined,
          attachments:
            attachmentDescriptors.length > 0 ? attachmentDescriptors : undefined,
          editorContext: {
            selectedFile,
            visibleRange: editorVisibleRange,
          },
          previewErrors: previewErrors.length > 0 ? previewErrors : undefined,
        }),
      };

      const withSystem = [systemMessage, ...strippedMessages];
      const truncated = truncateMessages(
        withSystem,
        thinkingEnabled ? 80_000 : undefined
      );

      return {
        ...rest,
        messages: truncated,
        modelId: preferences.aiModel,
        apiKey: apiKey || undefined,
        thinkingEnabled,
      };
    },
    onToolCall: async ({ toolCall }) => {
      // Apply VFS side-effects for UI refresh (existing behavior)
      handleToolCall(toolCall);
      // Return tool result string for the AI SDK tool loop
      return executeClientTool(toolCall, {
        fileSystem,
        skills: allSkills,
        attachmentStore: attachmentStoreRef.current,
      });
    },
    onFinish: (_message, { finishReason }) => {
      if (
        finishReason === "tool-calls" &&
        continuationCountRef.current < MAX_AUTO_CONTINUATIONS
      ) {
        setContinuationNeeded(true);
      } else {
        continuationCountRef.current = 0;
        setContinuationNeeded(false);
      }
    },
  });

  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const processingRef = useRef(false);

  const isGenerating =
    status === "submitted" || status === "streaming" || continuationNeeded;

  useEffect(() => {
    if (!projectId) return;
    if (isGenerating) {
      markGenerating(projectId);
    } else {
      markIdle(projectId);
    }
    // Only mark idle on unmount if NOT generating (server may still be running)
    return () => {
      if (!isGenerating) markIdle(projectId);
    };
  }, [projectId, isGenerating]);

  // Error recovery state
  const [errorDismissed, setErrorDismissed] = useState(false);

  // Reset dismissed flag when a new error arrives
  useEffect(() => {
    if (error) setErrorDismissed(false);
  }, [error]);

  const retryLastMessage = useCallback(() => {
    setErrorDismissed(false);
    reload();
  }, [reload]);

  const dismissError = useCallback(() => {
    setErrorDismissed(true);
    // If queue has items, pop the next one and send it (append clears the SDK error)
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      append(
        { role: "user", content: next.content },
        next.attachments ? { experimental_attachments: next.attachments } : undefined
      );
    }
  }, [queue, append]);

  const enqueueMessage = useCallback(
    (content: string, attachments?: QueuedMessage["attachments"]) => {
      setQueue((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          content,
          attachments,
          createdAt: Date.now(),
        },
      ]);
    },
    []
  );

  const stopGeneration = useCallback(() => {
    setContinuationNeeded(false);
    continuationCountRef.current = 0;
    stop();
  }, [stop]);

  const cancelQueuedMessage = useCallback((id: string) => {
    setQueue((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const stopAll = useCallback(() => {
    setContinuationNeeded(false);
    continuationCountRef.current = 0;
    stop();
    setQueue([]);
  }, [stop]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>, options?: ChatRequestOptions) => {
      continuationCountRef.current = 0;
      if (!isGenerating && queue.length === 0) {
        sdkHandleSubmit(e, options);
      } else {
        e.preventDefault();
        const experimentalAttachments = options?.experimental_attachments;
        const attachments = experimentalAttachments
          ? (Array.isArray(experimentalAttachments)
              ? experimentalAttachments
              : undefined)
          : undefined;
        enqueueMessage(input, attachments);
        setInput("");
      }
    },
    [isGenerating, queue.length, sdkHandleSubmit, enqueueMessage, input, setInput]
  );

  // Auto-continue / auto-dequeue: when SDK becomes ready, either send a
  // continuation message (takes priority) or dequeue the next user message.
  useEffect(() => {
    if (processingRef.current) return;
    if (status !== "ready") return;

    if (continuationNeeded) {
      processingRef.current = true;
      setContinuationNeeded(false);
      continuationCountRef.current++;
      append({ role: "user", content: "Continue." });
      setTimeout(() => {
        processingRef.current = false;
      }, 0);
      return;
    }

    if (queue.length === 0) return;

    processingRef.current = true;
    const [next, ...rest] = queue;
    setQueue(rest);

    append(
      { role: "user", content: next.content },
      next.attachments ? { experimental_attachments: next.attachments } : undefined
    );

    setTimeout(() => {
      processingRef.current = false;
    }, 0);
  }, [status, queue, continuationNeeded, append]);

  // Persist messages to IndexedDB for local/guest users
  const store = useProjectStore();
  useEffect(() => {
    if (!projectId || !store.isLocal) return;
    if (messages.length === 0) return;
    const timer = setTimeout(() => {
      store.saveMessages(projectId, messages, 0, 0).catch(console.error);
    }, 1000);
    return () => clearTimeout(timer);
  }, [messages, projectId, store]);

  return (
    <ChatContext.Provider
      value={{
        projectId,
        messages,
        input,
        setInput,
        handleInputChange,
        handleSubmit,
        status,
        error,
        preferences,
        setPreference,
        isDefault,
        resetPreferences,
        apiKey,
        setApiKey,
        clearApiKey,
        globalRules,
        setGlobalRules,
        projectRules,
        setProjectRules,
        globalSkills,
        addGlobalSkill,
        updateGlobalSkill,
        deleteGlobalSkill,
        toggleGlobalSkill,
        projectSkills,
        addProjectSkill,
        updateProjectSkill,
        deleteProjectSkill,
        toggleProjectSkill,
        allEnabledSkills,
        queue,
        isGenerating,
        stopGeneration,
        stopAll,
        cancelQueuedMessage,
        retryLastMessage,
        dismissError,
        errorDismissed,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
