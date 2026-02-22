import type { FileNode } from "@/lib/file-system";
import { VirtualFileSystem } from "@/lib/file-system";
import { streamText, appendResponseMessages } from "ai";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { buildReadSkillTool } from "@/lib/tools/read-skill";
import { buildReadAttachmentTool } from "@/lib/tools/read-attachment";
import { collectAttachments, stripOldAttachments } from "@/lib/attachments";
import { truncateMessages } from "@/lib/truncate-messages";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLanguageModel } from "@/lib/provider";
import { buildSystemPrompt } from "@/lib/prompts/prompt-builder";
import {
  DEFAULT_PREFERENCES,
  type GenerationPreferences,
  MAX_STEPS_MIN,
  MAX_STEPS_MAX,
} from "@/lib/types/preferences";
import { toDescriptor, type Skill } from "@/lib/types/skill";
import { getSystemSkills } from "@/lib/skills/system";
import { logMessages } from "@/lib/debug-logger";

function stringifyResult(result: unknown): string {
  if (result == null) return "";
  if (typeof result === "string") return result;
  return JSON.stringify(result);
}

function sanitizeToolResults(messages: any[]): any[] {
  return messages.map((msg) => {
    let patched = msg;

    // Handle parts format (newer AI SDK)
    if (msg.parts) {
      const parts = msg.parts.map((part: any) => {
        if (
          part.type === "tool-invocation" &&
          part.toolInvocation?.state === "result" &&
          typeof part.toolInvocation.result !== "string"
        ) {
          return {
            ...part,
            toolInvocation: {
              ...part.toolInvocation,
              result: stringifyResult(part.toolInvocation.result),
            },
          };
        }
        return part;
      });
      patched = { ...patched, parts };
    }

    // Handle toolInvocations format (legacy AI SDK)
    if (msg.toolInvocations) {
      const toolInvocations = msg.toolInvocations.map((inv: any) => {
        if (inv.state === "result" && typeof inv.result !== "string") {
          return { ...inv, result: stringifyResult(inv.result) };
        }
        return inv;
      });
      patched = { ...patched, toolInvocations };
    }

    // Handle content array format (provider-level messages)
    if (Array.isArray(msg.content)) {
      const content = msg.content.map((block: any) => {
        if (block.type === "tool-result" && typeof block.result !== "string") {
          return { ...block, result: stringifyResult(block.result) };
        }
        return block;
      });
      patched = { ...patched, content };
    }

    return patched;
  });
}

export async function POST(req: Request) {
  const {
    messages,
    files,
    projectId,
    preferences,
    apiKey,
    globalRules,
    projectRules,
    skills,
  }: {
    messages: any[];
    files: Record<string, FileNode>;
    projectId?: string;
    preferences?: Partial<GenerationPreferences>;
    apiKey?: string;
    globalRules?: string;
    projectRules?: string;
    skills?: Skill[];
  } = await req.json();

  const enabledUserSkills = (skills || []).filter((s) => s.enabled);
  const systemSkills = getSystemSkills(preferences || {});
  const allSkills = [...systemSkills, ...enabledUserSkills];
  const skillDescriptors = allSkills.map(toDescriptor);

  const attachmentStore = collectAttachments(messages);
  const strippedMessages = sanitizeToolResults(stripOldAttachments(messages));

  const attachmentDescriptors = Array.from(attachmentStore.values()).map(
    (a) => ({
      name: a.name,
      contentType: a.contentType,
      isImage: a.isImage,
    })
  );

  strippedMessages.unshift({
    role: "system",
    content: buildSystemPrompt(preferences || {}, {
      globalRules,
      projectRules,
      skills: skillDescriptors.length > 0 ? skillDescriptors : undefined,
      attachments:
        attachmentDescriptors.length > 0 ? attachmentDescriptors : undefined,
    }),
    providerOptions: {
      anthropic: { cacheControl: { type: "ephemeral" } },
    },
  });

  const truncatedMessages = truncateMessages(strippedMessages);

  // Reconstruct the VirtualFileSystem from serialized data
  const fileSystem = new VirtualFileSystem();
  fileSystem.deserializeFromNodes(files);

  const model = getLanguageModel(preferences?.aiModel, apiKey);
  const effectiveKey = apiKey?.startsWith("sk-ant-")
    ? apiKey
    : process.env.ANTHROPIC_API_KEY;
  const isMockProvider = !effectiveKey || !effectiveKey.startsWith("sk-ant-");
  const requestedSteps = Math.min(
    MAX_STEPS_MAX,
    Math.max(
      MAX_STEPS_MIN,
      preferences?.maxSteps ?? DEFAULT_PREFERENCES.maxSteps
    )
  );
  logMessages("MESSAGES SENT TO ANTHROPIC", truncatedMessages);

  const result = streamText({
    model,
    messages: truncatedMessages,
    maxTokens: 10_000,
    maxSteps: isMockProvider ? Math.min(4, requestedSteps) : requestedSteps,
    onError: (err: any) => {
      console.error(err);
    },
    tools: {
      str_replace_editor: buildStrReplaceTool(fileSystem),
      file_manager: buildFileManagerTool(fileSystem),
      ...(allSkills.length > 0 && {
        read_skill: buildReadSkillTool(allSkills),
      }),
      ...(attachmentStore.size > 0 && {
        read_attachment: buildReadAttachmentTool(attachmentStore),
      }),
    },
    onFinish: async ({ response, usage }) => {
      if (projectId) {
        try {
          const session = await getSession();
          if (!session) {
            console.error("User not authenticated, cannot save project");
            return;
          }

          const responseMessages = response.messages || [];
          // Use original messages (with attachments) for persistence so the
          // client can still render attachment previews when the project reloads.
          const allMessages = appendResponseMessages({
            messages: [...messages.filter((m) => m.role !== "system")],
            responseMessages,
          });

          const userMsgCount = allMessages.filter(
            (m: any) => m.role === "user"
          ).length;
          const assistantMsgCount = allMessages.filter(
            (m: any) => m.role === "assistant"
          ).length;

          await prisma.project.update({
            where: {
              id: projectId,
              userId: session.userId,
            },
            data: {
              messages: JSON.stringify(allMessages),
              data: JSON.stringify(fileSystem.serialize()),
              messageCount: userMsgCount + assistantMsgCount,
              totalInputTokens: {
                increment: usage.promptTokens,
              },
              totalOutputTokens: {
                increment: usage.completionTokens,
              },
            },
          });
        } catch (error) {
          console.error("Failed to save project data:", error);
        }
      }
    },
  });

  return result.toDataStreamResponse();
}

export const maxDuration = 120;
