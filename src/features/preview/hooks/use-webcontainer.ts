import { useCallback, useEffect, useRef, useState } from "react";
import type { WebContainer } from "@webcontainer/api";

import {
    buildFileTree,
    getFilePath,
    FileWithContent,
} from "@/features/preview/utils/file-tree";
import { useFiles } from "@/features/projects/hooks/use-files";
import { getWebContainer, teardownWebContainer } from "@/lib/webcontainer";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";


interface UseWebContainerProps {
    projectId: Id<"projects">;
    enabled: boolean;
    settings?: {
        installCommand?: string;
        devCommand?: string;
    };
};

/**
 * Fetch file content from Azure Blob for a single file
 */
async function fetchBlobContent(blobPath: string): Promise<string | null> {
    try {
        const res = await fetch(
            `/api/files/content?blobPath=${encodeURIComponent(blobPath)}`
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.content ?? null;
    } catch {
        return null;
    }
}

/**
 * Resolve content for all text files from Azure Blob
 */
async function resolveFileContents(
    files: ReturnType<typeof useFiles>
): Promise<FileWithContent[]> {
    if (!files) return [];

    return Promise.all(
        files.map(async (file) => {
            if (file.type === "file" && !file.storageId && file.blobPath) {
                const content = await fetchBlobContent(file.blobPath);
                return { ...file, resolvedContent: content ?? undefined };
            }
            return { ...file } as FileWithContent;
        })
    );
}

export const useWebContainer = ({
    projectId,
    enabled,
    settings,
}: UseWebContainerProps) => {
    const [status, setStatus] = useState<
        "idle" | "booting" | "installing" | "running" | "error"
    >("idle");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [restartKey, setRestartKey] = useState(0);
    const [terminalOutput, setTerminalOutput] = useState("");

    const containerRef = useRef<WebContainer | null>(null);
    const hasStartedRef = useRef(false);

    // Fetch files from Convex (auto-updates on changes)
    const files = useFiles(projectId);

    // Initial boot and mount
    useEffect(() => {
        if (!enabled || !files || files.length === 0 || hasStartedRef.current) {
            return;
        }

        hasStartedRef.current = true;

        const start = async () => {
            try {
                setStatus("booting");
                setError(null);
                setTerminalOutput("");

                const appendOutput = (data: string) => {
                    setTerminalOutput((prev) => prev + data);
                };

                const container = await getWebContainer();
                containerRef.current = container;

                // Resolve file contents from Azure Blob before mounting
                const filesWithContent = await resolveFileContents(files);
                const fileTree = buildFileTree(filesWithContent);
                await container.mount(fileTree);

                container.on("server-ready", (_port, url) => {
                    setPreviewUrl(url);
                    setStatus("running");
                });

                setStatus("installing");

                // Parse install command (default: npm install)
                const installCmd = settings?.installCommand || "npm install";
                const [installBin, ...installArgs] = installCmd.split(" ");
                appendOutput(`$ ${installCmd}\n`)
                const installProcess = await container.spawn(installBin, installArgs);
                installProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            appendOutput(data);
                        },
                    })
                );
                const installExitCode = await installProcess.exit;

                if (installExitCode !== 0) {
                    throw new Error(
                        `${installCmd} failed with code ${installExitCode}`
                    );
                }

                // Parse dev command (default: npm run dev)
                const devCmd = settings?.devCommand || "npm run dev";
                const [devBin, ...devArgs] = devCmd.split(" ");
                appendOutput(`\n$ ${devCmd}\n`);
                const devProcess = await container.spawn(devBin, devArgs);
                devProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            appendOutput(data);
                        },
                    })
                );
            } catch (error) {
                setError(error instanceof Error ? error.message : "Unknown error");
                setStatus("error");
            }
        };

        start();
    }, [
        enabled,
        files,
        restartKey,
        settings?.devCommand,
        settings?.installCommand,
    ]);

    // Sync file changes (hot-reload) — download content from Azure Blob
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !files || status !== "running") return;

        const filesMap = new Map(files.map((f) => [f._id, f]));

        for (const file of files) {
            if (file.type !== "file" || file.storageId || !file.blobPath) continue;

            const filePath = getFilePath(file, filesMap);

            // Async fetch content from Azure Blob and write to WebContainer
            fetchBlobContent(file.blobPath).then((content) => {
                if (content !== null) {
                    container.fs.writeFile(filePath, content);
                }
            });
        }
    }, [files, status]);

    // Reset when disabled
    useEffect(() => {
        if (!enabled) {
            hasStartedRef.current = false;
            setStatus("idle");
            setPreviewUrl(null);
            setError(null);
        }
    }, [enabled]);

    // Restart the entire WebContainer process
    const restart = useCallback(() => {
        teardownWebContainer();
        containerRef.current = null;
        hasStartedRef.current = false;
        setStatus("idle");
        setPreviewUrl(null);
        setError(null);
        setRestartKey((k) => k + 1);
    }, []);

    return {
        status,
        previewUrl,
        error,
        restart,
        terminalOutput,
    };
};