import type { Attachment } from "ai";

export interface QueuedMessage {
  id: string;
  content: string;
  attachments?: Attachment[];
  createdAt: number;
}
