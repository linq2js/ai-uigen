export interface StoredAttachment {
  name: string;
  contentType: string;
  /** Raw base64 data (without the data URL prefix) */
  base64Data: string;
  isImage: boolean;
}

/**
 * Walks the messages array and collects **non-image** attachments into a Map
 * keyed by filename.  Image attachments are kept on the user messages so the
 * AI SDK sends them as native image content blocks (~1,600 tokens each instead
 * of ~57K when base64 is returned as text via a tool result).
 */
export function collectAttachments(
  messages: any[]
): Map<string, StoredAttachment> {
  const store = new Map<string, StoredAttachment>();

  for (const msg of messages) {
    if (msg.role !== "user" || !msg.experimental_attachments) continue;

    for (const att of msg.experimental_attachments) {
      const isImage = att.contentType?.startsWith("image/") ?? false;
      if (isImage) continue; // images stay on the message as native content

      const base64Data = extractBase64(att.url);
      if (!base64Data) continue;

      const name = deduplicateName(att.name || "unnamed", store);
      store.set(name, {
        name,
        contentType: att.contentType || "application/octet-stream",
        base64Data,
        isImage: false,
      });
    }
  }

  return store;
}

/**
 * Returns a new messages array where non-image attachments on older user
 * messages are stripped and replaced with a text marker.  Image attachments
 * are **kept** on every user message so the AI SDK converts them to native
 * image content blocks (Anthropic vision API: ~1,600 tokens per image instead
 * of ~57K when the base64 ends up as text in a tool result).
 *
 * The last user message always keeps all attachments unchanged.
 */
export function stripOldAttachments(messages: any[]): any[] {
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      lastUserIdx = i;
      break;
    }
  }

  return messages.map((msg, i) => {
    if (
      msg.role !== "user" ||
      !msg.experimental_attachments?.length ||
      i === lastUserIdx
    ) {
      return msg;
    }

    const imageAtts = msg.experimental_attachments.filter(
      (a: any) => a.contentType?.startsWith("image/")
    );
    const nonImageAtts = msg.experimental_attachments.filter(
      (a: any) => !a.contentType?.startsWith("image/")
    );

    // Nothing to strip — all attachments are images
    if (nonImageAtts.length === 0) return msg;

    const names = nonImageAtts.map((a: any) => a.name || "unnamed");
    const marker = `\n\n[Attached files: ${names.join(", ")}]`;
    const content =
      typeof msg.content === "string" ? msg.content + marker : marker;

    if (imageAtts.length > 0) {
      return { ...msg, content, experimental_attachments: imageAtts };
    }

    const { experimental_attachments: _, ...rest } = msg;
    return { ...rest, content };
  });
}

function extractBase64(dataUrl: string): string | null {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) return null;
  return dataUrl.slice(commaIdx + 1);
}

function deduplicateName(
  name: string,
  store: Map<string, StoredAttachment>
): string {
  if (!store.has(name)) return name;
  let counter = 2;
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  while (store.has(`${base}_${counter}${ext}`)) counter++;
  return `${base}_${counter}${ext}`;
}
