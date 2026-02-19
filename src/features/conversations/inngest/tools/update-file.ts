import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { prisma } from "@/lib/prisma";
import { uploadTextFile } from "@/lib/file-storage";

const paramsSchema = z.object({
  fileId: z.string().min(1, "File ID is required"),
  content: z.string(),
});

export const createUpdateFileTool = () => {
  return createTool({
    name: "updateFile",
    description: "Update the content of an existing file",
    parameters: z.object({
      fileId: z.string().describe("The ID of the file to update"),
      content: z.string().describe("The new content for the file"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { fileId, content } = parsed.data;

      const file = await prisma.file.findUnique({
        where: { id: fileId },
        select: { id: true, name: true, projectId: true, type: true },
      });

      if (!file) {
        return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;
      }

      if (file.type === "folder") {
        return `Error: "${fileId}" is a folder, not a file. You can only update file contents.`;
      }

      try {
        return await toolStep?.run("update-file", async () => {
          // Upload new content to Azure Blob
          const blobPath = await uploadTextFile(
            file.projectId,
            file.id,
            content,
            file.name
          );

          // Update metadata in Supabase
          await prisma.file.update({
            where: { id: fileId },
            data: { blobPath, size: content.length },
          });

          return `File "${file.name}" updated successfully`;
        });
      } catch (error) {
        return `Error updating file: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
