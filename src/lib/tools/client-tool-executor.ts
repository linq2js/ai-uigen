import type { VirtualFileSystem } from "@/lib/file-system";
import type { Skill } from "@/lib/types/skill";
import type { StoredAttachment } from "@/lib/attachments";
import { executeStrReplaceEditor } from "./str-replace";
import { executeFileManager } from "./file-manager";
import { executeReadSkill } from "./read-skill";
import { executeReadAttachment } from "./read-attachment";

interface ToolCall {
  toolName: string;
  args: any;
}

interface ExecutorContext {
  fileSystem: VirtualFileSystem;
  skills: Skill[];
  attachmentStore: Map<string, StoredAttachment>;
}

/**
 * Execute a tool call client-side and return the result string.
 * This runs alongside `handleToolCall` (which updates the UI) and provides
 * the return value that the AI SDK uses as the tool result in the next step.
 */
export function executeClientTool(
  toolCall: ToolCall,
  ctx: ExecutorContext
): string {
  const { toolName, args } = toolCall;

  switch (toolName) {
    case "str_replace_editor":
      return executeStrReplaceEditor(ctx.fileSystem, args);

    case "file_manager":
      return executeFileManager(ctx.fileSystem, args);

    case "read_skill":
      return executeReadSkill(ctx.skills, args);

    case "read_attachment":
      return executeReadAttachment(ctx.attachmentStore, args);

    default:
      return `Unknown tool: ${toolName}`;
  }
}
