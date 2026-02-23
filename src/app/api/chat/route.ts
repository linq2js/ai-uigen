import { streamText } from "ai";
import { getLanguageModel } from "@/lib/provider";
import { strReplaceEditorSchema } from "@/lib/tools/str-replace";
import { fileManagerSchema } from "@/lib/tools/file-manager";
import { readSkillSchema } from "@/lib/tools/read-skill";
import { readAttachmentSchema } from "@/lib/tools/read-attachment";

export async function POST(req: Request) {
  let body: {
    messages: any[];
    modelId?: string;
    apiKey?: string;
    thinkingEnabled?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, modelId, apiKey, thinkingEnabled = false } = body;

  const model = getLanguageModel(modelId, apiKey);
  const THINKING_BUDGET = 10_000;

  const result = streamText({
    model,
    messages,
    maxTokens: thinkingEnabled ? 128_000 - THINKING_BUDGET : 10_000,
    maxSteps: 1, // Client drives the tool loop; server returns after one step
    abortSignal: req.signal,
    onError: (err: any) => {
      if (err?.name === "AbortError") return;
      console.error(err);
    },
    providerOptions: thinkingEnabled
      ? { anthropic: { thinking: { type: "enabled", budgetTokens: THINKING_BUDGET } } }
      : undefined,
    // Schema-only tools — no execute functions. The client executes tools locally.
    tools: {
      str_replace_editor: strReplaceEditorSchema,
      file_manager: fileManagerSchema,
      read_skill: readSkillSchema,
      read_attachment: readAttachmentSchema,
    },
  });

  return result.toDataStreamResponse();
}

export const maxDuration = 300;
