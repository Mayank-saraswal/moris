import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { prisma } from "@/lib/prisma";
import { uploadTextFile, getBlobPath } from "@/lib/file-storage";

interface CreateFilesToolOptions {
  projectId: string;
}

const paramsSchema = z.object({
  parentPath: z.string(),
  files: z
    .array(
      z.object({
        name: z.string().min(1, "File name cannot be empty"),
        content: z.string(),
      })
    )
    .min(1, "Provide at least one file to create"),
});

export const createCreateFilesTool = ({
  projectId,
}: CreateFilesToolOptions) => {
  return createTool({
    name: "createFiles",
    description:
      "Create multiple files at once in the same folder. Use this to batch create files that share the same parent folder. More efficient than creating files one by one.",
    parameters: z.object({
      parentPath: z
        .string()
        .describe(
          "The path of the parent folder. Use empty string for root level. E.g. 'src/components'"
        ),
      files: z
        .array(
          z.object({
            name: z.string().describe("The file name including extension"),
            content: z.string().describe("The file content"),
          })
        )
        .describe("Array of files to create"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { parentPath, files } = parsed.data;

      try {
        return await toolStep?.run("create-files", async () => {
          const created: string[] = [];
          const failed: string[] = [];

          for (const file of files) {
            try {
              const filePath = parentPath
                ? `${parentPath}/${file.name}`
                : file.name;

              // Create file record in Supabase
              const newFile = await prisma.file.create({
                data: {
                  projectId,
                  name: file.name,
                  path: filePath,
                  type: "file",
                  size: file.content.length,
                },
              });

              // Upload content to Azure Blob
              const blobPath = await uploadTextFile(
                projectId,
                newFile.id,
                file.content,
                file.name
              );

              // Update with blob path
              await prisma.file.update({
                where: { id: newFile.id },
                data: { blobPath },
              });

              created.push(file.name);
            } catch (error) {
              failed.push(
                `${file.name} (${error instanceof Error ? error.message : "Unknown error"})`
              );
            }
          }

          let response = `Created ${created.length} file(s)`;
          if (created.length > 0) {
            response += `: ${created.join(", ")}`;
          }
          if (failed.length > 0) {
            response += `. Failed: ${failed.join(", ")}`;
          }

          return response;
        });
      } catch (error) {
        return `Error creating files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
