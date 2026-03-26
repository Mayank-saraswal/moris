import { FileSystemTree } from "@webcontainer/api";

interface FileRecord {
    id: string;
    name: string;
    path: string;
    type: "file" | "folder";
    blobPath: string | null;
}

/**
 * Convert flat file records to nested FileSystemTree for WebContainer.
 * Uses path-based file structure (e.g. "src/components/Button.tsx").
 * Note: Only text files with loaded content are included in the tree.
 */
export const buildFileTree = (
    files: FileRecord[],
    fileContents?: Map<string, string>
): FileSystemTree => {
    const tree: FileSystemTree = {};

    // Sort so folders come first, then files
    const sorted = [...files].sort((a, b) => {
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return 1;
        return a.path.localeCompare(b.path);
    });

    for (const file of sorted) {
        const pathParts = file.path.split("/");
        let current = tree;

        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            const isLast = i === pathParts.length - 1;

            if (isLast) {
                if (file.type === "folder") {
                    if (!current[part]) {
                        current[part] = { directory: {} };
                    }
                } else {
                    // Get content from the contents map if available
                    const content = fileContents?.get(file.id) ?? "";
                    if (content || !file.blobPath) {
                        current[part] = { file: { contents: content } };
                    }
                }
            } else {
                if (!current[part]) {
                    current[part] = { directory: {} };
                }
                const node = current[part];
                if ("directory" in node) {
                    current = node.directory;
                }
            }
        }
    }

    return tree;
};

/**
 * Get full path for a file (already stored as path in our model)
 */
export const getFilePath = (file: FileRecord): string => {
    return file.path;
};