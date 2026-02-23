import { z } from "zod";
import { VirtualFileSystem } from "@/lib/file-system";

export const TextEditorParameters = z.object({
  command: z
    .enum(["view", "create", "str_replace", "insert", "undo_edit"])
    .describe(
      "The operation to perform. 'view' reads a file or lists a directory, 'create' creates a new file, 'str_replace' replaces text, 'insert' inserts text at a line, 'undo_edit' is not supported."
    ),
  path: z.string().describe("The path to the file or directory to operate on"),
  file_text: z
    .string()
    .optional()
    .describe("The content for the new file. Required for 'create' command."),
  insert_line: z
    .number()
    .optional()
    .describe(
      "The line number to insert text at (0-based). Required for 'insert' command."
    ),
  new_str: z
    .string()
    .optional()
    .describe(
      "The new text to insert or the replacement text. Used by 'str_replace' and 'insert' commands."
    ),
  old_str: z
    .string()
    .optional()
    .describe(
      "The existing text to find and replace. Required for 'str_replace' command. Must match exactly."
    ),
  view_range: z
    .array(z.number())
    .optional()
    .describe(
      "Optional line range for 'view' command as [start_line, end_line] (1-indexed, inclusive). Use -1 for end_line to read to end of file. If omitted, the entire file is returned."
    ),
});

/** Tool schema (no execute) for the thin proxy. */
export const strReplaceEditorSchema = {
  description:
    "A text editor tool for viewing, creating, and editing files. Use 'view' with view_range to read specific lines from a file (e.g. view_range: [1, 50] reads lines 1-50).",
  parameters: TextEditorParameters,
};

/** Execute the str_replace_editor tool against a VirtualFileSystem instance. */
export function executeStrReplaceEditor(
  fileSystem: VirtualFileSystem,
  args: z.infer<typeof TextEditorParameters>
): string {
  switch (args.command) {
    case "view":
      return fileSystem.viewFile(
        args.path,
        args.view_range as [number, number] | undefined
      );
    case "create":
      return fileSystem.createFileWithParents(args.path, args.file_text || "");
    case "str_replace":
      return fileSystem.replaceInFile(args.path, args.old_str || "", args.new_str || "");
    case "insert":
      return fileSystem.insertInFile(args.path, args.insert_line || 0, args.new_str || "");
    case "undo_edit":
      return "Error: undo_edit command is not supported in this version. Use str_replace to revert changes.";
  }
}

export const buildStrReplaceTool = (fileSystem: VirtualFileSystem) => {
  return {
    id: "str_replace_editor" as const,
    ...strReplaceEditorSchema,
    args: {},
    execute: async (args: z.infer<typeof TextEditorParameters>) =>
      executeStrReplaceEditor(fileSystem, args),
  };
};
