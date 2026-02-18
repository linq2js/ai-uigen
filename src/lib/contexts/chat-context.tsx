"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { Message, ChatRequestOptions } from "ai";
import { useFileSystem } from "./file-system-context";
import { setHasAnonWork } from "@/lib/anon-work-tracker";
import { usePreferences } from "@/hooks/use-preferences";
import type { GenerationPreferences } from "@/lib/types/preferences";

interface ChatContextProps {
  projectId?: string;
  initialMessages?: Message[];
}

interface ChatContextType {
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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  projectId,
  initialMessages = [],
}: ChatContextProps & { children: ReactNode }) {
  const { fileSystem, handleToolCall } = useFileSystem();
  const { preferences, setPreference, resetPreferences, isDefault } = usePreferences();

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    status,
    error,
  } = useAIChat({
    api: "/api/chat",
    initialMessages,
    body: {
      files: fileSystem.serialize(),
      projectId,
      preferences,
    },
    onToolCall: ({ toolCall }) => {
      handleToolCall(toolCall);
    },
  });

  // Track anonymous work
  useEffect(() => {
    if (!projectId && messages.length > 0) {
      setHasAnonWork(messages, fileSystem.serialize());
    }
  }, [messages, fileSystem, projectId]);

  return (
    <ChatContext.Provider
      value={{
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
