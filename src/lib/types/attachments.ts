export interface ChatAttachment {
  id: string;
  file: File;
  name: string;
  contentType: string;
  dataUrl: string;
  preview?: string;
  isImage: boolean;
}

export interface MentionItem {
  type: "file" | "attachment";
  label: string;
  value: string;
  path?: string;
  attachmentIndex?: number;
}
