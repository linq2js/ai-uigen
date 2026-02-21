"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  projectId,
  initialMessages = [],
}: ChatContextProps & { children: ReactNode }) {
  const { fileSystem, handleToolCall } = useFileSystem();
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
      apiKey: apiKey || undefined,
      globalRules: globalRules || undefined,
      projectRules: projectRules || undefined,
      skills: allEnabledSkills.length > 0 ? allEnabledSkills : undefined,
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
