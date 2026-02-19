import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { prisma } from "@/lib/prisma";

interface CreateFolderToolOptions {
  projectId: string;
}

const paramsSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parentPath: z.string(),
});

export const createCreateFolderTool = ({
  projectId,
}: CreateFolderToolOptions) => {
  return createTool({
    name: "createFolder",
    description: "Create a new folder in the project",
    parameters: z.object({
      name: z.string().describe("The name of the folder to create"),
      parentPath: z
        .string()
        .describe(
          "The path of the parent folder, or empty string for root level. E.g. 'src'"
        ),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { name, parentPath } = parsed.data;

      try {
        return await toolStep?.run("create-folder", async () => {
          const folderPath = parentPath ? `${parentPath}/${name}` : name;

          const folder = await prisma.file.create({
            data: {
              projectId,
              name,
              path: folderPath,
              type: "folder",
            },
          });

          return `Folder "${name}" created at path: ${folderPath} (ID: ${folder.id})`;
        });
      } catch (error) {
        return `Error creating folder: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
