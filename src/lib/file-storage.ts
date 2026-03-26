import { uploadBlob, downloadBlob, deleteBlob, downloadBlobAsBuffer } from "./azure-storage";

// Common binary file extensions
const BINARY_EXTENSIONS = new Set([
    "png", "jpg", "jpeg", "gif", "svg", "ico", "webp", "avif",
    "woff", "woff2", "ttf", "eot", "otf",
    "mp3", "mp4", "wav", "ogg", "webm",
    "zip", "tar", "gz", "rar",
    "pdf", "doc", "docx",
    "wasm",
]);

/**
 * Check if a file is binary based on its extension
 */
export function isBinaryFile(filename: string): boolean {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    return BINARY_EXTENSIONS.has(ext);
}

/**
 * Generate a blob path for a file
 */
export function getBlobPath(projectId: string, fileId: string): string {
    return `${projectId}/${fileId}`;
}

/**
 * Get MIME type for a file
 */
function getMimeType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const mimeTypes: Record<string, string> = {
        // Text
        ts: "text/typescript",
        tsx: "text/typescript",
        js: "application/javascript",
        jsx: "application/javascript",
        json: "application/json",
        html: "text/html",
        css: "text/css",
        md: "text/markdown",
        txt: "text/plain",
        yaml: "text/yaml",
        yml: "text/yaml",
        xml: "text/xml",
        toml: "text/plain",
        py: "text/x-python",
        rs: "text/x-rust",
        go: "text/x-go",
        java: "text/x-java",
        cpp: "text/x-c++",
        c: "text/x-c",
        // Images
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        svg: "image/svg+xml",
        ico: "image/x-icon",
        webp: "image/webp",
        // Fonts
        woff: "font/woff",
        woff2: "font/woff2",
        ttf: "font/ttf",
        // Binary
        pdf: "application/pdf",
        zip: "application/zip",
        wasm: "application/wasm",
    };
    return mimeTypes[ext] ?? "application/octet-stream";
}

/**
 * Upload a text file to Azure Blob Storage
 */
export async function uploadTextFile(
    projectId: string,
    fileId: string,
    content: string,
    filename: string
): Promise<string> {
    const blobPath = getBlobPath(projectId, fileId);
    const mimeType = getMimeType(filename);
    await uploadBlob(blobPath, content, mimeType);
    return blobPath;
}

/**
 * Upload a binary file to Azure Blob Storage
 */
export async function uploadBinaryFile(
    projectId: string,
    fileId: string,
    content: Buffer,
    filename: string
): Promise<string> {
    const blobPath = getBlobPath(projectId, fileId);
    const mimeType = getMimeType(filename);
    await uploadBlob(blobPath, content, mimeType);
    return blobPath;
}

/**
 * Read a text file from Azure Blob Storage
 */
export async function readTextFile(
    projectId: string,
    fileId: string
): Promise<string> {
    const blobPath = getBlobPath(projectId, fileId);
    return downloadBlob(blobPath);
}

/**
 * Read a binary file from Azure Blob Storage
 */
export async function readBinaryFile(
    projectId: string,
    fileId: string
): Promise<Buffer> {
    const blobPath = getBlobPath(projectId, fileId);
    return downloadBlobAsBuffer(blobPath);
}

/**
 * Delete a file from Azure Blob Storage
 */
export async function deleteFile(
    projectId: string,
    fileId: string
): Promise<void> {
    const blobPath = getBlobPath(projectId, fileId);
    await deleteBlob(blobPath);
}
