import { tool } from "ai";
import { z } from "zod";
import { VirtualFileSystem } from "../file-system";

export const FileManagerParameters = z.object({
  command: z
    .enum(["rename", "delete"])
    .describe("The operation to perform"),
  path: z
    .string()
    .describe("The path to the file or directory to rename or delete"),
  new_path: z
    .string()
    .optional()
    .describe("The new path. Only provide when renaming or moving a file."),
});

/** Tool schema (no execute) for the thin proxy. */
export const fileManagerSchema = {
  description:
    'Rename or delete files or folders in the file system. Rename can be used to "move" a file. Rename will recursively create folders as required.',
  parameters: FileManagerParameters,
};

/** Execute the file_manager tool against a VirtualFileSystem instance. */
export function executeFileManager(
  fileSystem: VirtualFileSystem,
  args: z.infer<typeof FileManagerParameters>
): string {
  if (args.command === "rename") {
    if (!args.new_path) {
      return JSON.stringify({ success: false, error: "new_path is required for rename command" });
    }
    const success = fileSystem.rename(args.path, args.new_path);
    return success
      ? JSON.stringify({ success: true, message: `Successfully renamed ${args.path} to ${args.new_path}` })
      : JSON.stringify({ success: false, error: `Failed to rename ${args.path} to ${args.new_path}` });
  }
  if (args.command === "delete") {
    const success = fileSystem.deleteFile(args.path);
    return success
      ? JSON.stringify({ success: true, message: `Successfully deleted ${args.path}` })
      : JSON.stringify({ success: false, error: `Failed to delete ${args.path}` });
  }
  return JSON.stringify({ success: false, error: "Invalid command" });
}

export function buildFileManagerTool(fileSystem: VirtualFileSystem) {
  return tool({
    ...fileManagerSchema,
    execute: async (args: z.infer<typeof FileManagerParameters>) =>
      executeFileManager(fileSystem, args),
  });
}
