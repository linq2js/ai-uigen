import { z } from "zod";
import type { StoredAttachment } from "@/lib/attachments";

/** Decode a base64 string to UTF-8 text (works in both Node and browser). */
function base64ToText(base64: string): string {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Zod schema for the read_attachment tool parameters. */
export const ReadAttachmentParameters = z.object({
  name: z.string().describe("The filename of the attachment to load"),
});

/** Tool schema (no execute) for the thin proxy. */
export const readAttachmentSchema = {
  description:
    "Load an attached file from a previous conversation turn. " +
    "Use this when you need to re-examine an image or text file the user attached earlier. " +
    "Check the system prompt for available attachment names.",
  parameters: ReadAttachmentParameters,
};

/** Execute the read_attachment tool against a client-side attachment store. */
export function executeReadAttachment(
  store: Map<string, StoredAttachment>,
  args: z.infer<typeof ReadAttachmentParameters>
): string {
  const att = store.get(args.name);
  if (!att) {
    const available = Array.from(store.keys()).join(", ");
    return `Attachment "${args.name}" not found. Available: ${available || "none"}`;
  }
  if (att.isImage) {
    return JSON.stringify({
      type: "image",
      data: att.base64Data,
      mimeType: att.contentType,
    });
  }
  return base64ToText(att.base64Data);
}
