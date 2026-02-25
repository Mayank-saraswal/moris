import { FileSystemTree } from "@webcontainer/api";

import { Doc, Id } from "../../../../convex/_generated/dataModel";

type FileDoc = Doc<"files">;

/**
 * File with content resolved from Azure Blob
 */
export type FileWithContent = FileDoc & {
    resolvedContent?: string;
};

/**
 * Convert flat Convex files to nested FileSystemTree for WebContainer.
 * Uses `resolvedContent` (pre-fetched from Azure Blob) instead of inline `content`.
 */
export const buildFileTree = (files: FileWithContent[]): FileSystemTree => {
    const tree: FileSystemTree = {};
    const filesMap = new Map(files.map((f) => [f._id, f]));

    const getPath = (file: FileWithContent): string[] => {
        const parts: string[] = [file.name];
        let parentId = file.parentId;

        while (parentId) {
            const parent = filesMap.get(parentId);
            if (!parent) break;
            parts.unshift(parent.name);
            parentId = parent.parentId;
        };

        return parts;
    };

    for (const file of files) {
        const pathParts = getPath(file);
        let current = tree;

        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            const isLast = i === pathParts.length - 1;

            if (isLast) {
                if (file.type === "folder") {
                    if (!current[part]) {
                        current[part] = { directory: {} };
                    }
                } else if (!file.storageId && file.resolvedContent !== undefined) {
                    current[part] = { file: { contents: file.resolvedContent } };
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
 * Get full path for a file by traversing parent chain
 */
export const getFilePath = (
    file: FileDoc,
    filesMap: Map<Id<"files">, FileDoc>
): string => {
    const parts: string[] = [file.name];
    let parentId = file.parentId;

    while (parentId) {
        const parent = filesMap.get(parentId);
        if (!parent) break;
        parts.unshift(parent.name);
        parentId = parent.parentId;
    }

    return parts.join("/");
};