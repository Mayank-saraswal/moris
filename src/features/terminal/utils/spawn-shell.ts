import { getWebContainer } from "@/lib/webcontainer";
import type { WebContainerProcess } from "@webcontainer/api";

/**
 * Spawn an interactive shell session inside the WebContainer.
 * Returns the process which exposes `output` (ReadableStream) and `input` (WritableStream).
 */
export const spawnShell = async (): Promise<WebContainerProcess> => {
    const container = await getWebContainer();
    const process = await container.spawn("jsh", {
        terminal: { cols: 80, rows: 24 },
    });
    return process;
};
