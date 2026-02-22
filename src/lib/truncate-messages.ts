/**
 * Trims oversized tool results and truncates conversation messages to fit
 * within Anthropic's context window.
 *
 * Two-phase approach:
 *  1. Shrink individual tool results that exceed a per-result cap (e.g. base64
 *     blobs returned by read_attachment).
 *  2. If still over budget, drop oldest messages and insert a truncation marker.
 */

const CHARS_PER_TOKEN = 3.5;

// Leave headroom for system prompt, tools schema, and model output.
// Tool definitions alone can consume 20-30k tokens; the char-to-token
// ratio for JSON/code is also lower than plain text (~2.5-3 vs 3.5).
const MAX_MESSAGE_TOKENS = 120_000;

// Any single tool result larger than this gets replaced with a placeholder
const MAX_TOOL_RESULT_CHARS = 50_000;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function resultLength(result: unknown): number {
  if (result == null) return 0;
  return typeof result === "string" ? result.length : JSON.stringify(result).length;
}

function truncatedResult(toolName: string, originalLen: number): string {
  return `[Result from ${toolName} truncated — original was ${originalLen.toLocaleString()} chars]`;
}

/**
 * Phase 1: Replace oversized tool results with a short placeholder.
 * This handles the case where read_attachment returns full base64 data that
 * stays in the assistant message's parts/toolInvocations forever.
 *
 * Only trims results in messages that are NOT the most recent assistant turn,
 * so the model can still see results from its latest step.
 */
function trimToolResults(messages: any[]): any[] {
  let lastAssistantIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      lastAssistantIdx = i;
      break;
    }
  }

  return messages.map((msg, idx) => {
    if (msg.role !== "assistant" || idx === lastAssistantIdx) return msg;

    let changed = false;
    let patched = msg;

    // Trim parts → toolInvocation results
    if (msg.parts) {
      const parts = msg.parts.map((part: any) => {
        if (part.type !== "tool-invocation") return part;
        const inv = part.toolInvocation;
        if (!inv?.result || resultLength(inv.result) <= MAX_TOOL_RESULT_CHARS)
          return part;
        changed = true;
        return {
          ...part,
          toolInvocation: {
            ...inv,
            result: truncatedResult(inv.toolName || "tool", resultLength(inv.result)),
          },
        };
      });
      if (changed) patched = { ...patched, parts };
    }

    // Trim legacy toolInvocations
    if (msg.toolInvocations) {
      let legacyChanged = false;
      const toolInvocations = msg.toolInvocations.map((inv: any) => {
        if (!inv.result || resultLength(inv.result) <= MAX_TOOL_RESULT_CHARS)
          return inv;
        legacyChanged = true;
        return {
          ...inv,
          result: truncatedResult(inv.toolName || "tool", resultLength(inv.result)),
        };
      });
      if (legacyChanged) {
        changed = true;
        patched = { ...patched, toolInvocations };
      }
    }

    // Trim provider-level content array
    if (Array.isArray(msg.content)) {
      let contentChanged = false;
      const content = msg.content.map((block: any) => {
        if (block.type !== "tool-result" || resultLength(block.result) <= MAX_TOOL_RESULT_CHARS)
          return block;
        contentChanged = true;
        return {
          ...block,
          result: truncatedResult(block.toolName || "tool", resultLength(block.result)),
        };
      });
      if (contentChanged) {
        changed = true;
        patched = { ...patched, content };
      }
    }

    return changed ? patched : msg;
  });
}

function messageTokens(msg: any): number {
  let total = 0;

  if (typeof msg.content === "string") {
    total += estimateTokens(msg.content);
  } else if (Array.isArray(msg.content)) {
    for (const block of msg.content) {
      if (block.type === "text") {
        total += estimateTokens(block.text || "");
      } else if (block.type === "tool-result") {
        total += estimateTokens(
          typeof block.result === "string"
            ? block.result
            : JSON.stringify(block.result ?? "")
        );
      } else if (block.type === "tool_use" || block.type === "tool-call") {
        total += estimateTokens(JSON.stringify(block.args ?? block.input ?? ""));
      }
    }
  }

  if (msg.parts) {
    for (const part of msg.parts) {
      if (part.type === "text") {
        total += estimateTokens(part.text || "");
      } else if (part.type === "tool-invocation") {
        const inv = part.toolInvocation;
        if (inv?.args) total += estimateTokens(JSON.stringify(inv.args));
        if (inv?.result) {
          total += estimateTokens(
            typeof inv.result === "string"
              ? inv.result
              : JSON.stringify(inv.result)
          );
        }
      }
    }
  }

  if (msg.toolInvocations) {
    for (const inv of msg.toolInvocations) {
      if (inv.args) total += estimateTokens(JSON.stringify(inv.args));
      if (inv.result) {
        total += estimateTokens(
          typeof inv.result === "string" ? inv.result : JSON.stringify(inv.result)
        );
      }
    }
  }

  return Math.max(total, 10);
}

/**
 * Phase 2: Drop oldest messages (after system) to fit within token budget.
 */
function dropOldMessages(messages: any[], maxTokens: number): any[] {
  const tokenCounts = messages.map(messageTokens);
  const totalTokens = tokenCounts.reduce((a, b) => a + b, 0);

  if (totalTokens <= maxTokens) return messages;

  const hasSystem = messages[0]?.role === "system";
  const systemTokens = hasSystem ? tokenCounts[0] : 0;
  const startIdx = hasSystem ? 1 : 0;

  let budget = maxTokens - systemTokens;
  let keepFromIdx = messages.length;

  for (let i = messages.length - 1; i >= startIdx; i--) {
    if (budget - tokenCounts[i] < 0) break;
    budget -= tokenCounts[i];
    keepFromIdx = i;
  }

  if (keepFromIdx >= messages.length) {
    keepFromIdx = messages.length - 1;
  }

  const truncated: any[] = [];

  if (hasSystem) {
    truncated.push(messages[0]);
  }

  if (keepFromIdx > startIdx) {
    const droppedCount = keepFromIdx - startIdx;
    truncated.push({
      role: "user",
      content: `[${droppedCount} earlier message(s) were removed to fit within the context window. Continue the conversation based on what follows.]`,
    });
  }

  truncated.push(...messages.slice(keepFromIdx));

  return truncated;
}

/**
 * Main entry point: trim oversized tool results, then drop old messages if
 * still over budget.
 */
export function truncateMessages(
  messages: any[],
  maxTokens: number = MAX_MESSAGE_TOKENS
): any[] {
  if (messages.length === 0) return messages;

  const trimmed = trimToolResults(messages);
  return dropOldMessages(trimmed, maxTokens);
}
