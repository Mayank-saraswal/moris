import { useCallback, useEffect, useRef, useState } from "react";
import type { WebContainer } from "@webcontainer/api";

import { buildFileTree, getFilePath } from "@/features/preview/utils/file-tree";
import { useFiles } from "@/features/projects/hooks/use-files";
import { getWebContainer, teardownWebContainer } from "@/lib/webcontainer";

interface UseWebContainerProps {
    projectId: string;
    enabled: boolean;
    settings?: {
        installCommand?: string;
        devCommand?: string;
    };
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

    // Fetch files from database (auto-updates on changes via React Query)
    const { data: files } = useFiles(projectId);

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

                // Build tree from path-based files (no content for initial mount)
                const fileTree = buildFileTree(files);
                await container.mount(fileTree);

                container.on("server-ready", (_port, url) => {
                    setPreviewUrl(url);
                    setStatus("running");
                });

                setStatus("installing");

                // Parse install command (default: npm install)
                const installCmd = settings?.installCommand || "npm install";
                const [installBin, ...installArgs] = installCmd.split(" ");
                appendOutput(`$ ${installCmd}\n`);
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
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
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

    // Sync file changes to WebContainer (hot-reload)
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !files || status !== "running") return;

        for (const file of (files ?? [])) {
            if (file.type !== "file") continue;
            // Write empty file placeholder — content will be loaded when needed
            const filePath = getFilePath(file);
            container.fs.writeFile(filePath, "").catch(() => {
                // Ignore errors for files that can't be written
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