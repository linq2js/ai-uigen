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
import { setHasAnonWork } from "@/lib/anon-work-tracker";
import { usePreferences } from "@/hooks/use-preferences";
import { useApiKey } from "@/hooks/use-api-key";
import { useGlobalRules } from "@/hooks/use-global-rules";
import { useProjectRules } from "@/hooks/use-project-rules";
import { useGlobalSkills } from "@/hooks/use-global-skills";
import { useProjectSkills } from "@/hooks/use-project-skills";
import type { GenerationPreferences } from "@/lib/types/preferences";
import type { Skill } from "@/lib/types/skill";
import type { QueuedMessage } from "@/lib/types/queue";
import { markGenerating, markIdle } from "@/lib/generation-tracker";
import { useAutoSave } from "@/hooks/use-auto-save";

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
  const { fileSystem, handleToolCall } = useFileSystem();
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
    body: {
      files: fileSystem.serialize(),
      projectId,
      preferences,
      apiKey: apiKey || undefined,
      globalRules: globalRules || undefined,
      projectRules: projectRules || undefined,
      skills: allEnabledSkills.length > 0 ? allEnabledSkills : undefined,
    },
    onToolCall: ({ toolCall }) => {
      handleToolCall(toolCall);
    },
  });

  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const processingRef = useRef(false);

  const isGenerating = status === "submitted" || status === "streaming";

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
    stop();
  }, [stop]);

  const cancelQueuedMessage = useCallback((id: string) => {
    setQueue((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const stopAll = useCallback(() => {
    stop();
    setQueue([]);
  }, [stop]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>, options?: ChatRequestOptions) => {
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

  // Auto-dequeue: when SDK becomes ready/error and queue has items
  useEffect(() => {
    if (processingRef.current) return;
    if (status !== "ready") return;
    if (queue.length === 0) return;

    processingRef.current = true;
    const [next, ...rest] = queue;
    setQueue(rest);

    append(
      { role: "user", content: next.content },
      next.attachments ? { experimental_attachments: next.attachments } : undefined
    );

    // Reset guard after a tick so the next status change can trigger again
    setTimeout(() => {
      processingRef.current = false;
    }, 0);
  }, [status, queue, append]);

  // Track anonymous work
  useEffect(() => {
    if (!projectId && messages.length > 0) {
      setHasAnonWork(messages, fileSystem.serialize());
    }
  }, [messages, fileSystem, projectId]);

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
