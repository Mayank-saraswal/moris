import { Octokit } from "octokit";
import { NonRetriableError } from "inngest";

import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { readTextFile, readBinaryFile } from "@/lib/file-storage";

interface ExportToGithubEvent {
    projectId: string;
    repoName: string;
    visibility: "public" | "private";
    description?: string;
    githubToken: string;
}

export const exportToGithub = inngest.createFunction(
    {
        id: "export-to-github",
        cancelOn: [
            {
                event: "github/export.cancel",
                if: "event.data.projectId == async.data.projectId",
            },
        ],
        onFailure: async ({ event, step }) => {
            const { projectId } = event.data.event.data as ExportToGithubEvent;

            await step.run("set-failed-status", async () => {
                await prisma.project.update({
                    where: { id: projectId },
                    data: { settings: { exportStatus: "failed" } },
                });
            });
        },
    },
    { event: "github/export.repo" },
    async ({ event, step }) => {
        const { projectId, repoName, visibility, description, githubToken } =
            event.data as ExportToGithubEvent;

        // Set status to exporting
        await step.run("set-exporting-status", async () => {
            await prisma.project.update({
                where: { id: projectId },
                data: { settings: { exportStatus: "exporting" } },
            });
        });

        const octokit = new Octokit({ auth: githubToken });

        // Get authenticated user
        const { data: user } = await step.run("get-github-user", async () => {
            return await octokit.rest.users.getAuthenticated();
        });

        // Create the new repository
        const { data: repo } = await step.run("create-repo", async () => {
            return await octokit.rest.repos.createForAuthenticatedUser({
                name: repoName,
                description: description || "Exported from Moris",
                private: visibility === "private",
                auto_init: true,
            });
        });

        // Wait for GitHub to initialize the repo
        await step.sleep("wait-for-repo-init", "3s");

        // Get the initial commit SHA
        const initialCommitSha = await step.run(
            "get-initial-commit",
            async () => {
                const { data: ref } = await octokit.rest.git.getRef({
                    owner: user.login,
                    repo: repoName,
                    ref: "heads/main",
                });
                return ref.object.sha;
            }
        );

        // Fetch all project files from Prisma
        const files = await step.run("fetch-project-files", async () => {
            return await prisma.file.findMany({
                where: { projectId },
                select: {
                    id: true,
                    name: true,
                    path: true,
                    type: true,
                    blobPath: true,
                    projectId: true,
                },
            });
        });

        // Filter to only actual files (not folders)
        const fileEntries = files.filter((f: { type: string; blobPath: string | null }) => f.type === "file" && f.blobPath);

        if (fileEntries.length === 0) {
            throw new NonRetriableError("No files to export");
        }

        // Create blobs for each file
        const treeItems = await step.run("create-blobs", async () => {
            const items: {
                path: string;
                mode: "100644";
                type: "blob";
                sha: string;
            }[] = [];

            for (const file of fileEntries) {
                try {
                    let content: string;
                    let encoding: "utf-8" | "base64" = "utf-8";

                    try {
                        // Try reading as text first
                        content = await readTextFile(file.projectId, file.id);
                    } catch {
                        // Fall back to binary
                        const buffer = await readBinaryFile(file.projectId, file.id);
                        content = buffer.toString("base64");
                        encoding = "base64";
                    }

                    const { data: blob } = await octokit.rest.git.createBlob({
                        owner: user.login,
                        repo: repoName,
                        content,
                        encoding,
                    });

                    items.push({
                        path: file.path,
                        mode: "100644",
                        type: "blob",
                        sha: blob.sha,
                    });
                } catch {
                    console.error(`Failed to export file: ${file.path}`);
                }
            }

            return items;
        });

        if (treeItems.length === 0) {
            throw new NonRetriableError("Failed to create any file blobs");
        }

        // Create the tree
        const { data: tree } = await step.run("create-tree", async () => {
            return await octokit.rest.git.createTree({
                owner: user.login,
                repo: repoName,
                tree: treeItems,
            });
        });

        // Create the commit
        const { data: commit } = await step.run("create-commit", async () => {
            return await octokit.rest.git.createCommit({
                owner: user.login,
                repo: repoName,
                message: "Initial commit from Moris",
                tree: tree.sha,
                parents: [initialCommitSha],
            });
        });

        // Update the main branch ref
        await step.run("update-branch-ref", async () => {
            return await octokit.rest.git.updateRef({
                owner: user.login,
                repo: repoName,
                ref: "heads/main",
                sha: commit.sha,
                force: true,
            });
        });

        // Set status to completed
        await step.run("set-completed-status", async () => {
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    settings: {
                        exportStatus: "completed",
                        repoUrl: repo.html_url,
                    },
                },
            });
        });

        return {
            success: true,
            repoUrl: repo.html_url,
            filesExported: treeItems.length,
        };
    }
);