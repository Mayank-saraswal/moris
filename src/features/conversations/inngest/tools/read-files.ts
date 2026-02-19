import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { prisma } from "@/lib/prisma";
import { readTextFile } from "@/lib/file-storage";

const paramsSchema = z.object({
  fileIds: z
    .array(z.string().min(1, "File ID cannot be empty"))
    .min(1, "Provide at least one file ID"),
});

export const createReadFilesTool = () => {
  return createTool({
    name: "readFiles",
    description:
      "Read the content of files from the project. Returns file contents.",
    parameters: z.object({
      fileIds: z.array(z.string()).describe("Array of file IDs to read"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { fileIds } = parsed.data;

      try {
        return await toolStep?.run("read-files", async () => {
          const results: { id: string; name: string; content: string }[] = [];

          for (const fileId of fileIds) {
            const file = await prisma.file.findUnique({
              where: { id: fileId },
              select: { id: true, name: true, projectId: true, blobPath: true, type: true },
            });

            if (file && file.type === "file" && file.blobPath) {
              try {
                const content = await readTextFile(file.projectId, file.id);
                results.push({ id: file.id, name: file.name, content });
              } catch {
                results.push({
                  id: file.id,
                  name: file.name,
                  content: "(binary file — cannot display)",
                });
              }
            }
          }

          if (results.length === 0) {
            return "Error: No files found with provided IDs. Use listFiles to get valid fileIDs.";
          }

          return JSON.stringify(results);
        });
      } catch (error) {
        return `Error reading files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
