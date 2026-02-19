import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { prisma } from "@/lib/prisma";

interface ListFilesToolOptions {
  projectId: string;
}

export const createListFilesTool = ({ projectId }: ListFilesToolOptions) => {
  return createTool({
    name: "listFiles",
    description:
      "List all files and folders in the project. Returns names, IDs, types, and path for each item.",
    parameters: z.object({}),
    handler: async (_, { step: toolStep }) => {
      try {
        return await toolStep?.run("list-files", async () => {
          const files = await prisma.file.findMany({
            where: { projectId },
            select: { id: true, name: true, type: true, path: true },
            orderBy: [{ type: "asc" }, { name: "asc" }],
          });

          const fileList = files.map((f: { id: string; name: string; type: string; path: string }) => ({
            id: f.id,
            name: f.name,
            type: f.type,
            path: f.path,
          }));

          return JSON.stringify(fileList);
        });
      } catch (error) {
        return `Error listing files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
