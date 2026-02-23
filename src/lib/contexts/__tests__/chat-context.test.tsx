import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ChatProvider, useChat } from "../chat-context";
import { useFileSystem } from "../file-system-context";
import { useChat as useAIChat } from "@ai-sdk/react";

// Mock dependencies
vi.mock("../file-system-context", () => ({
  useFileSystem: vi.fn(),
}));

vi.mock("@ai-sdk/react", () => ({
  useChat: vi.fn(),
}));

vi.mock("@/lib/project-store/context", () => ({
  useProjectStore: () => ({
    isLocal: false,
    saveMessages: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-preferences", () => ({
  usePreferences: () => ({
    preferences: { aiModel: "Haiku 4.5", accessibility: false, cssFramework: "Tailwind CSS", architectureStyle: "Auto", codeQuality: "Auto", designStyle: "Auto", stateManagement: "Auto", maxSteps: 40 },
    setPreference: vi.fn(),
    resetPreferences: vi.fn(),
    isDefault: () => true,
  }),
}));

vi.mock("@/hooks/use-api-key", () => ({
  useApiKey: () => ({ apiKey: "", setApiKey: vi.fn(), clearApiKey: vi.fn() }),
}));

vi.mock("@/hooks/use-global-rules", () => ({
  useGlobalRules: () => ({ globalRules: "", setGlobalRules: vi.fn() }),
}));

vi.mock("@/hooks/use-project-rules", () => ({
  useProjectRules: () => ({ projectRules: "", setProjectRules: vi.fn() }),
}));

vi.mock("@/hooks/use-global-skills", () => ({
  useGlobalSkills: () => ({ skills: [], addSkill: vi.fn(), updateSkill: vi.fn(), deleteSkill: vi.fn(), toggleSkill: vi.fn() }),
}));

vi.mock("@/hooks/use-project-skills", () => ({
  useProjectSkills: () => ({ skills: [], addSkill: vi.fn(), updateSkill: vi.fn(), deleteSkill: vi.fn(), toggleSkill: vi.fn() }),
}));

vi.mock("@/hooks/use-auto-save", () => ({
  useAutoSave: vi.fn(),
}));

vi.mock("@/lib/generation-tracker", () => ({
  markGenerating: vi.fn(),
  markIdle: vi.fn(),
}));

// Mock client-side prompt and tool modules
vi.mock("@/lib/prompts/prompt-builder", () => ({
  buildSystemPrompt: vi.fn(() => "mock system prompt"),
}));

vi.mock("@/lib/truncate-messages", () => ({
  truncateMessages: vi.fn((msgs: any[]) => msgs),
}));

vi.mock("@/lib/attachments", () => ({
  collectAttachments: vi.fn(() => new Map()),
  stripOldAttachments: vi.fn((msgs: any[]) => msgs),
}));

vi.mock("@/lib/skills/system", () => ({
  getSystemSkills: vi.fn(() => []),
}));

vi.mock("@/lib/tools/client-tool-executor", () => ({
  executeClientTool: vi.fn(() => "mock tool result"),
}));

// Helper component to access chat context
function TestComponent() {
  const chat = useChat();
  return (
    <div>
      <div data-testid="messages">{chat.messages.length}</div>
      <textarea
        data-testid="input"
        value={chat.input}
        onChange={chat.handleInputChange}
      />
      <form data-testid="form" onSubmit={chat.handleSubmit}>
        <button type="submit">Submit</button>
      </form>
      <div data-testid="status">{chat.status}</div>
    </div>
  );
}

describe("ChatContext", () => {
  const mockFileSystem = {
    serialize: vi.fn(() => ({ "/test.js": { type: "file", content: "test" } })),
  };

  const mockHandleToolCall = vi.fn();

  const mockUseAIChat = {
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    status: "idle",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useFileSystem as any).mockReturnValue({
      fileSystem: mockFileSystem,
      handleToolCall: mockHandleToolCall,
      selectedFile: null,
      editorVisibleRange: null,
      previewErrors: [],
    });

    (useAIChat as any).mockReturnValue(mockUseAIChat);
  });

  afterEach(() => {
    cleanup();
  });

  test("renders with default values", () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    expect(screen.getByTestId("messages").textContent).toBe("0");
    expect(screen.getByTestId("input").getAttribute("value")).toBe(null);
    expect(screen.getByTestId("status").textContent).toBe("idle");
  });

  test("initializes with project ID and messages", () => {
    const initialMessages = [
      { id: "1", role: "user" as const, content: "Hello" },
      { id: "2", role: "assistant" as const, content: "Hi there!" },
    ];

    (useAIChat as any).mockReturnValue({
      ...mockUseAIChat,
      messages: initialMessages,
    });

    render(
      <ChatProvider projectId="test-project" initialMessages={initialMessages}>
        <TestComponent />
      </ChatProvider>
    );

    expect(useAIChat).toHaveBeenCalledWith(
      expect.objectContaining({
        api: "/api/chat",
        initialMessages,
        keepLastMessageOnError: true,
        maxSteps: 25,
        body: expect.objectContaining({
          modelId: "Haiku 4.5",
          thinkingEnabled: false,
        }),
        experimental_prepareRequestBody: expect.any(Function),
        onToolCall: expect.any(Function),
        onFinish: expect.any(Function),
      })
    );

    // Body should NOT contain files, preferences, globalRules, etc.
    const callArgs = (useAIChat as any).mock.calls[0][0];
    expect(callArgs.body).not.toHaveProperty("files");
    expect(callArgs.body).not.toHaveProperty("preferences");
    expect(callArgs.body).not.toHaveProperty("globalRules");
    expect(callArgs.body).not.toHaveProperty("projectRules");
    expect(callArgs.body).not.toHaveProperty("skills");
    expect(callArgs.body).not.toHaveProperty("editorContext");
    expect(callArgs.body).not.toHaveProperty("previewErrors");

    expect(screen.getByTestId("messages").textContent).toBe("2");
  });

  test("passes through AI chat functionality", () => {
    const mockHandleInputChange = vi.fn();
    const mockHandleSubmit = vi.fn();

    (useAIChat as any).mockReturnValue({
      ...mockUseAIChat,
      handleInputChange: mockHandleInputChange,
      handleSubmit: mockHandleSubmit,
      status: "loading",
    });

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    expect(screen.getByTestId("status").textContent).toBe("loading");

    // Verify functions are passed through
    const textarea = screen.getByTestId("input");
    const form = screen.getByTestId("form");

    expect(textarea).toBeDefined();
    expect(form).toBeDefined();
  });

  test("handles tool calls and returns tool result", async () => {
    let onToolCallHandler: any;

    (useAIChat as any).mockImplementation((config: any) => {
      onToolCallHandler = config.onToolCall;
      return mockUseAIChat;
    });

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    const toolCall = { toolName: "str_replace_editor", args: { command: "view", path: "/test.js" } };
    const result = await onToolCallHandler({ toolCall });

    // handleToolCall applies VFS side-effects
    expect(mockHandleToolCall).toHaveBeenCalledWith(toolCall);
    // executeClientTool returns the tool result string
    expect(result).toBe("mock tool result");
  });

  test("experimental_prepareRequestBody builds system prompt and truncates messages", () => {
    let experimental_prepareRequestBody: any;

    (useAIChat as any).mockImplementation((config: any) => {
      experimental_prepareRequestBody = config.experimental_prepareRequestBody;
      return mockUseAIChat;
    });

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    const prepared = experimental_prepareRequestBody({
      messages: [{ role: "user", content: "Hello" }],
    });

    // Should include messages with system prompt prepended
    expect(prepared.messages).toBeDefined();
    expect(prepared.messages.length).toBeGreaterThan(0);
    expect(prepared.messages[0].role).toBe("system");

    // Should include minimal config
    expect(prepared.modelId).toBe("Haiku 4.5");
    expect(prepared.thinkingEnabled).toBe(false);
  });
});
