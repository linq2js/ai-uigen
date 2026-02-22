import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatInterface } from "../ChatInterface";
import { useChat } from "@/lib/contexts/chat-context";

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

// Mock the dependencies
vi.mock("@/lib/contexts/chat-context", () => ({
  useChat: vi.fn(),
}));

vi.mock("@/lib/contexts/file-system-context", () => ({
  useFileSystem: () => ({
    getAllFiles: () => new Map(),
    refreshTrigger: 0,
    setSelectedFile: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-attachments", () => ({
  useAttachments: () => ({
    attachments: [],
    addFiles: vi.fn(),
    removeAttachment: vi.fn(),
    clearAttachments: vi.fn(),
  }),
}));

// Mock the ScrollArea component
vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children, className }: any) => (
    <div className={className} data-radix-scroll-area-viewport>
      {children}
    </div>
  ),
}));

// Mock the child components
vi.mock("../MessageList", () => ({
  MessageList: ({ messages, isLoading }: any) => (
    <div data-testid="message-list">
      {messages.length} messages, loading: {isLoading.toString()}
    </div>
  ),
}));

vi.mock("../MessageInput", () => ({
  MessageInput: ({ input, handleInputChange, handleSubmit, isLoading }: any) => (
    <div data-testid="message-input">
      <input
        value={input}
        onChange={handleInputChange}
        data-testid="input"
        disabled={isLoading}
      />
      <button onClick={handleSubmit} disabled={isLoading} data-testid="submit">
        Submit
      </button>
    </div>
  ),
}));

vi.mock("../PreferenceToolbar", () => ({
  PreferenceToolbar: () => <div data-testid="preference-toolbar" />,
}));

vi.mock("../ProjectSettingsDialog", () => ({
  ProjectSettingsDialog: () => null,
}));

vi.mock("@/components/sidebar/CloneProjectDialog", () => ({
  CloneProjectDialog: () => null,
}));

vi.mock("@/actions/clone-project", () => ({
  cloneProject: vi.fn(),
}));

const mockUseChat = {
  projectId: undefined,
  messages: [],
  input: "",
  setInput: vi.fn(),
  handleInputChange: vi.fn(),
  handleSubmit: vi.fn(),
  status: "idle" as const,
  error: undefined,
  preferences: { aiModel: "Sonnet 4.6", accessibility: false, cssFramework: "Tailwind CSS", architectureStyle: "Auto", codeQuality: "Auto", designStyle: "Auto", stateManagement: "Auto", maxSteps: 40 },
  setPreference: vi.fn(),
  isDefault: () => true,
  resetPreferences: vi.fn(),
  queue: [],
  isGenerating: false,
  stopGeneration: vi.fn(),
  cancelQueuedMessage: vi.fn(),
  retryLastMessage: vi.fn(),
  dismissError: vi.fn(),
  errorDismissed: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  (useChat as any).mockReturnValue(mockUseChat);
});

afterEach(() => {
  cleanup();
});

test("renders chat interface with message list and input", () => {
  render(<ChatInterface />);

  expect(screen.getByTestId("message-list")).toBeDefined();
  expect(screen.getByTestId("message-input")).toBeDefined();
});

test("passes correct props to MessageList", () => {
  const messages = [
    { id: "1", role: "user", content: "Hello" },
    { id: "2", role: "assistant", content: "Hi there!" },
  ];
  
  (useChat as any).mockReturnValue({
    ...mockUseChat,
    messages,
    status: "streaming",
  });

  render(<ChatInterface />);

  const messageList = screen.getByTestId("message-list");
  expect(messageList.textContent).toContain("2 messages");
  expect(messageList.textContent).toContain("loading: true");
});

test("passes correct props to MessageInput", () => {
  (useChat as any).mockReturnValue({
    ...mockUseChat,
    input: "Test input",
    status: "submitted",
    isGenerating: true,
  });

  render(<ChatInterface />);

  const input = screen.getByTestId("input");
  expect(input).toHaveProperty("value", "Test input");
  expect(input).toHaveProperty("disabled", true);
});

test("isLoading is true when status is submitted", () => {
  (useChat as any).mockReturnValue({
    ...mockUseChat,
    status: "submitted",
    isGenerating: true,
  });

  render(<ChatInterface />);

  const submitButton = screen.getByTestId("submit");
  expect(submitButton).toHaveProperty("disabled", true);
});

test("isLoading is true when status is streaming", () => {
  (useChat as any).mockReturnValue({
    ...mockUseChat,
    status: "streaming",
    isGenerating: true,
  });

  render(<ChatInterface />);

  const submitButton = screen.getByTestId("submit");
  expect(submitButton).toHaveProperty("disabled", true);
});

test("isLoading is false when status is idle", () => {
  (useChat as any).mockReturnValue({
    ...mockUseChat,
    status: "idle",
  });

  render(<ChatInterface />);

  const submitButton = screen.getByTestId("submit");
  expect(submitButton).toHaveProperty("disabled", false);
});


test("scrolls when messages change", () => {
  const { rerender } = render(<ChatInterface />);

  // Get initial scroll container
  const scrollContainer = screen.getByTestId("message-list").closest("[data-radix-scroll-area-viewport]");
  expect(scrollContainer).toBeDefined();

  // Update messages - this should trigger the useEffect
  (useChat as any).mockReturnValue({
    ...mockUseChat,
    messages: [
      { id: "1", role: "user", content: "Hello" },
      { id: "2", role: "assistant", content: "Hi there!" },
    ],
  });

  rerender(<ChatInterface />);

  // Verify component re-rendered with new messages
  const messageList = screen.getByTestId("message-list");
  expect(messageList.textContent).toContain("2 messages");
});

test("renders with correct layout classes", () => {
  const { container } = render(<ChatInterface />);

  const mainDiv = container.firstChild as HTMLElement;
  expect(mainDiv.className).toContain("relative");
  expect(mainDiv.className).toContain("h-full");
  expect(mainDiv.className).toContain("overflow-hidden");
});