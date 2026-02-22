import { tool } from "ai";
import { z } from "zod";
import type { StoredAttachment } from "@/lib/attachments";

export function buildReadAttachmentTool(
  store: Map<string, StoredAttachment>
) {
  return tool({
    description:
      "Load an attached file from a previous conversation turn. " +
      "Use this when you need to re-examine an image or text file the user attached earlier. " +
      "Check the system prompt for available attachment names.",
    parameters: z.object({
      name: z
        .string()
        .describe("The filename of the attachment to load"),
    }),
    execute: async ({ name }) => {
      const att = store.get(name);
      if (!att) {
        const available = Array.from(store.keys()).join(", ");
        return {
          type: "error" as const,
          message: `Attachment "${name}" not found. Available: ${available || "none"}`,
        };
      }
      if (att.isImage) {
        return {
          type: "image" as const,
          data: att.base64Data,
          mimeType: att.contentType,
        };
      }
      const text = Buffer.from(att.base64Data, "base64").toString("utf-8");
      return { type: "text" as const, text };
    },
    experimental_toToolResultContent(result) {
      if (typeof result === "string") {
        return [{ type: "text" as const, text: result }];
      }
      if (Array.isArray(result)) {
        return result;
      }
      if (result.type === "image") {
        return [
          { type: "image" as const, data: result.data, mimeType: result.mimeType },
        ];
      }
      if (result.type === "error") {
        return [{ type: "text" as const, text: result.message }];
      }
      return [{ type: "text" as const, text: result.text ?? JSON.stringify(result) }];
    },
  });
}
