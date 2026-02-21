import type { FileNode } from "@/lib/file-system";
import { VirtualFileSystem } from "@/lib/file-system";
import { streamText, appendResponseMessages } from "ai";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { buildReadSkillTool } from "@/lib/tools/read-skill";
import { buildReadAttachmentTool } from "@/lib/tools/read-attachment";
import { collectAttachments, stripOldAttachments } from "@/lib/attachments";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLanguageModel } from "@/lib/provider";
import { buildSystemPrompt } from "@/lib/prompts/prompt-builder";
import { DEFAULT_PREFERENCES, type GenerationPreferences, MAX_STEPS_MIN, MAX_STEPS_MAX } from "@/lib/types/preferences";
import { toDescriptor, type Skill } from "@/lib/types/skill";
import { getSystemSkills } from "@/lib/skills/system";

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

  // Collect all attachments from the conversation for the read_attachment tool,
  // then strip old attachments from history to reduce payload size.
  // The last user message keeps its attachments embedded for immediate analysis.
  const attachmentStore = collectAttachments(messages);
  const strippedMessages = stripOldAttachments(messages);

  const attachmentDescriptors = Array.from(attachmentStore.values()).map((a) => ({
    name: a.name,
    contentType: a.contentType,
    isImage: a.isImage,
  }));

  strippedMessages.unshift({
    role: "system",
    content: buildSystemPrompt(preferences || {}, {
      globalRules,
      projectRules,
      skills: skillDescriptors.length > 0 ? skillDescriptors : undefined,
      attachments: attachmentDescriptors.length > 0 ? attachmentDescriptors : undefined,
    }),
    providerOptions: {
      anthropic: { cacheControl: { type: "ephemeral" } },
    },
  });

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
    Math.max(MAX_STEPS_MIN, preferences?.maxSteps ?? DEFAULT_PREFERENCES.maxSteps)
  );
  const result = streamText({
    model,
    messages: strippedMessages,
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
    onFinish: async ({ response }) => {
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

          await prisma.project.update({
            where: {
              id: projectId,
              userId: session.userId,
            },
            data: {
              messages: JSON.stringify(allMessages),
              data: JSON.stringify(fileSystem.serialize()),
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
