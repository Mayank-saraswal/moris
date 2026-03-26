import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { prisma } from "@/lib/prisma";
import { deleteFile as deleteFileBlob } from "@/lib/file-storage";

const paramsSchema = z.object({
  fileIds: z
    .array(z.string().min(1, "File ID cannot be empty"))
    .min(1, "Provide at least one file ID"),
});

export const createDeleteFilesTool = () => {
  return createTool({
    name: "deleteFiles",
    description:
      "Delete files or folders from the project. If deleting a folder, all contents will be deleted recursively.",
    parameters: z.object({
      fileIds: z
        .array(z.string())
        .describe("Array of file or folder IDs to delete"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { fileIds } = parsed.data;

      // Validate all files exist
      const filesToDelete: {
        id: string;
        name: string;
        type: string;
        projectId: string;
        blobPath: string | null;
      }[] = [];

      for (const fileId of fileIds) {
        const file = await prisma.file.findUnique({
          where: { id: fileId },
          select: { id: true, name: true, type: true, projectId: true, blobPath: true },
        });

        if (!file) {
          return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;
        }

        filesToDelete.push(file);
      }

      try {
        return await toolStep?.run("delete-files", async () => {
          const results: string[] = [];

          for (const file of filesToDelete) {
            // Delete blob from Azure if it exists
            if (file.blobPath) {
              try {
                await deleteFileBlob(file.projectId, file.id);
              } catch {
                // Continue even if blob delete fails
              }
            }

            // If it's a folder, find and delete all children
            if (file.type === "folder") {
              const children = await prisma.file.findMany({
                where: {
                  projectId: file.projectId,
                  path: { startsWith: `${file.name}/` },
                },
                select: { id: true, blobPath: true },
              });

              // Delete child blobs
              for (const child of children) {
                if (child.blobPath) {
                  try {
                    await deleteFileBlob(file.projectId, child.id);
                  } catch {
                    // Continue
                  }
                }
              }

              // Delete child records
              await prisma.file.deleteMany({
                where: {
                  projectId: file.projectId,
                  path: { startsWith: `${file.name}/` },
                },
              });
            }

            // Delete the file/folder record
            await prisma.file.delete({ where: { id: file.id } });

            results.push(`Deleted ${file.type} "${file.name}" successfully`);
          }

          return results.join("\n");
        });
      } catch (error) {
        return `Error deleting files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
