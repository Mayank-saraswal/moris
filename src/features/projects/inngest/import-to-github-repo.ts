import { Octokit } from "octokit";
import { isBinaryFile } from "isbinaryfile";
import { NonRetriableError } from "inngest";

import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { uploadTextFile, uploadBinaryFile } from "@/lib/file-storage";

interface ImportGithubRepoEvent {
    owner: string;
    repo: string;
    projectId: string;
    githubToken: string;
}

export const importGithubRepo = inngest.createFunction(
    {
        id: "import-github-repo",
        onFailure: async ({ event, step }) => {
            const { projectId } = event.data.event.data as ImportGithubRepoEvent;

            await step.run("set-failed-status", async () => {
                await prisma.project.update({
                    where: { id: projectId },
                    data: { settings: { importStatus: "failed" } },
                });
            });
        },
    },
    { event: "github/import.repo" },
    async ({ event, step }) => {
        const { owner, repo, projectId, githubToken } =
            event.data as ImportGithubRepoEvent;

        const octokit = new Octokit({ auth: githubToken });

        // Cleanup any existing files in the project
        await step.run("cleanup-project", async () => {
            await prisma.file.deleteMany({ where: { projectId } });
        });

        const tree = await step.run("fetch-repo-tree", async () => {
            try {
                const { data } = await octokit.rest.git.getTree({
                    owner,
                    repo,
                    tree_sha: "main",
                    recursive: "1",
                });
                return data;
            } catch {
                const { data } = await octokit.rest.git.getTree({
                    owner,
                    repo,
                    tree_sha: "master",
                    recursive: "1",
                });
                return data;
            }
        });

        // Sort folders by depth so parents are created first
        const folders = tree.tree
            .filter((item) => item.type === "tree" && item.path)
            .sort((a, b) => {
                const aDepth = a.path ? a.path.split("/").length : 0;
                const bDepth = b.path ? b.path.split("/").length : 0;
                return aDepth - bDepth;
            });

        // Create folder records in Prisma
        await step.run("create-folders", async () => {
            for (const folder of folders) {
                if (!folder.path) continue;

                const name = folder.path.split("/").pop()!;

                await prisma.file.create({
                    data: {
                        projectId,
                        name,
                        path: folder.path,
                        type: "folder",
                    },
                });
            }
        });

        // Get all files (blobs) from the tree
        const allFiles = tree.tree.filter(
            (item) => item.type === "blob" && item.path && item.sha
        );

        await step.run("create-files", async () => {
            for (const file of allFiles) {
                if (!file.path || !file.sha) continue;

                try {
                    const { data: blob } = await octokit.rest.git.getBlob({
                        owner,
                        repo,
                        file_sha: file.sha,
                    });

                    const buffer = Buffer.from(blob.content, "base64");
                    const isBinary = await isBinaryFile(buffer);
                    const name = file.path.split("/").pop()!;

                    // Create file record
                    const newFile = await prisma.file.create({
                        data: {
                            projectId,
                            name,
                            path: file.path,
                            type: "file",
                            size: buffer.length,
                        },
                    });

                    // Upload content to Azure Blob
                    let blobPath: string;
                    if (isBinary) {
                        blobPath = await uploadBinaryFile(
                            projectId,
                            newFile.id,
                            buffer,
                            name
                        );
                    } else {
                        const content = buffer.toString("utf-8");
                        blobPath = await uploadTextFile(
                            projectId,
                            newFile.id,
                            content,
                            name
                        );
                    }

                    await prisma.file.update({
                        where: { id: newFile.id },
                        data: { blobPath },
                    });
                } catch {
                    console.error(`Failed to import file: ${file.path}`);
                }
            }
        });

        await step.run("set-completed-status", async () => {
            await prisma.project.update({
                where: { id: projectId },
                data: { settings: { importStatus: "completed" } },
            });
        });

        return { success: true, projectId };
    }
);