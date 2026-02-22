import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageInput } from "../MessageInput";

afterEach(() => {
  cleanup();
});

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    input: "",
    setInput: vi.fn(),
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
    onStop: vi.fn(),
    attachments: [],
    onAddFiles: vi.fn(),
    onRemoveAttachment: vi.fn(),
    onClearAttachments: vi.fn(),
    vaultFiles: [],
    aiModel: "Sonnet 4.6" as const,
    onModelChange: vi.fn(),
    ...overrides,
  };
}

test("renders with placeholder text", () => {
  render(<MessageInput {...makeProps()} />);

  const textarea = screen.getByPlaceholderText("Describe the app or component you want to create...");
  expect(textarea).toBeDefined();
});

test("displays the input value", () => {
  render(<MessageInput {...makeProps({ input: "Test input value" })} />);

  const textarea = screen.getByDisplayValue("Test input value");
  expect(textarea).toBeDefined();
});

test("calls handleInputChange when typing", async () => {
  const handleInputChange = vi.fn();
  render(<MessageInput {...makeProps({ handleInputChange })} />);

  const textarea = screen.getByPlaceholderText("Describe the app or component you want to create...");
  await userEvent.type(textarea, "Hello");

  expect(handleInputChange).toHaveBeenCalled();
});

test("calls handleSubmit when form is submitted", async () => {
  const handleSubmit = vi.fn((e) => e.preventDefault());
  render(<MessageInput {...makeProps({ input: "Test input", handleSubmit })} />);

  const form = screen.getByRole("textbox").closest("form")!;
  fireEvent.submit(form);

  expect(handleSubmit).toHaveBeenCalledOnce();
});

test("submits form when Enter is pressed without shift", async () => {
  const handleSubmit = vi.fn((e) => e.preventDefault());
  render(<MessageInput {...makeProps({ input: "Test input", handleSubmit })} />);

  const textarea = screen.getByRole("textbox");
  fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

  expect(handleSubmit).toHaveBeenCalledOnce();
});

test("does not submit form when Enter is pressed with shift", async () => {
  const handleSubmit = vi.fn((e) => e.preventDefault());
  render(<MessageInput {...makeProps({ input: "Test input", handleSubmit })} />);

  const textarea = screen.getByRole("textbox");
  fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

  expect(handleSubmit).not.toHaveBeenCalled();
});

test("disables submit button when input is empty", () => {
  const { container } = render(<MessageInput {...makeProps({ input: "" })} />);

  const submitButton = container.querySelector('button[type="submit"]');
  expect(submitButton).toBeDefined();
  expect(submitButton).toHaveProperty("disabled", true);
});

test("disables submit button when input contains only whitespace", () => {
  const { container } = render(<MessageInput {...makeProps({ input: "   " })} />);

  const submitButton = container.querySelector('button[type="submit"]');
  expect(submitButton).toBeDefined();
  expect(submitButton).toHaveProperty("disabled", true);
});

test("submit button is enabled when input has content and not loading", () => {
  const { container } = render(<MessageInput {...makeProps({ input: "Valid content" })} />);

  const submitButton = container.querySelector('button[type="submit"]');
  expect(submitButton).toBeDefined();
  expect(submitButton).toHaveProperty("disabled", false);
});

test("shows stop button when loading with no content", () => {
  render(<MessageInput {...makeProps({ input: "", isLoading: true })} />);

  const stopButton = screen.getByRole("button", { name: /cancel/i });
  expect(stopButton).toBeDefined();
});

test("textarea has correct styling classes", () => {
  render(<MessageInput {...makeProps()} />);

  const textarea = screen.getByRole("textbox");
  expect(textarea.className).toContain("min-h-[60px]");
  expect(textarea.className).toContain("max-h-[200px]");
  expect(textarea.className).toContain("resize-none");
  expect(textarea.className).toContain("focus:ring-2");
  expect(textarea.className).toContain("focus:ring-blue-500/20");
});

test("submit button click triggers form submission", async () => {
  const handleSubmit = vi.fn((e) => e.preventDefault());
  const { container } = render(<MessageInput {...makeProps({ input: "Test input", handleSubmit })} />);

  const submitButton = container.querySelector('button[type="submit"]')!;
  await userEvent.click(submitButton);

  expect(handleSubmit).toHaveBeenCalledOnce();
});