export interface StoredAttachment {
  name: string;
  contentType: string;
  /** Raw base64 data (without the data URL prefix) */
  base64Data: string;
  isImage: boolean;
}

/**
 * Walks the messages array and collects all attachments into a Map keyed by filename.
 * Handles duplicate names by appending a suffix.
 */
export function collectAttachments(
  messages: any[]
): Map<string, StoredAttachment> {
  const store = new Map<string, StoredAttachment>();

  for (const msg of messages) {
    if (msg.role !== "user" || !msg.experimental_attachments) continue;

    for (const att of msg.experimental_attachments) {
      const isImage = att.contentType?.startsWith("image/") ?? false;
      const base64Data = extractBase64(att.url);
      if (!base64Data) continue;

      const name = deduplicateName(att.name || "unnamed", store);
      store.set(name, {
        name,
        contentType: att.contentType || "application/octet-stream",
        base64Data,
        isImage,
      });
    }
  }

  return store;
}

/**
 * Returns a new messages array where all user messages except the last one
 * have their experimental_attachments stripped and replaced with a text marker.
 * The last user message keeps its attachments for immediate model consumption.
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

    const names = msg.experimental_attachments.map(
      (a: any) => a.name || "unnamed"
    );
    const marker = `\n\n[Attached files: ${names.join(", ")}]`;
    const content =
      typeof msg.content === "string" ? msg.content + marker : marker;

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
