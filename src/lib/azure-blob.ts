import {
    BlobServiceClient,
    ContainerClient,
    StorageSharedKeyCredential,
} from "@azure/storage-blob";

const CONTAINER_NAME = "project-files";

let containerClient: ContainerClient | null = null;

function getContainerClient(): ContainerClient {
    if (containerClient) return containerClient;

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        throw new Error("AZURE_STORAGE_CONNECTION_STRING is not configured");
    }

    const blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    return containerClient;
}

/**
 * Ensure the blob container exists (call once on startup or lazily).
 */
export async function ensureContainer(): Promise<void> {
    const client = getContainerClient();
    await client.createIfNotExists();
}

/**
 * Build the blob path from project ID and file path segments.
 * Example: "projects/abc123/src/index.ts"
 */
export function buildBlobPath(
    projectId: string,
    filePath: string
): string {
    return `projects/${projectId}/${filePath}`;
}

/**
 * Upload text content to Azure Blob Storage.
 * Returns the blob path used as the key.
 */
export async function uploadBlob(
    blobPath: string,
    content: string
): Promise<string> {
    const client = getContainerClient();
    await client.createIfNotExists();

    const blockBlobClient = client.getBlockBlobClient(blobPath);
    const buffer = Buffer.from(content, "utf-8");

    await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: { blobContentType: "text/plain; charset=utf-8" },
    });

    return blobPath;
}

/**
 * Download text content from Azure Blob Storage.
 * Returns the file content as a string, or null if the blob doesn't exist.
 */
export async function downloadBlob(
    blobPath: string
): Promise<string | null> {
    const client = getContainerClient();
    const blockBlobClient = client.getBlockBlobClient(blobPath);

    try {
        const response = await blockBlobClient.download(0);
        const body = response.readableStreamBody;
        if (!body) return null;

        const chunks: Buffer[] = [];
        for await (const chunk of body) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks).toString("utf-8");
    } catch (error: unknown) {
        const blobError = error as { statusCode?: number };
        if (blobError.statusCode === 404) return null;
        throw error;
    }
}

/**
 * Delete a single blob from Azure Blob Storage.
 */
export async function deleteBlob(blobPath: string): Promise<void> {
    const client = getContainerClient();
    const blockBlobClient = client.getBlockBlobClient(blobPath);

    try {
        await blockBlobClient.deleteIfExists();
    } catch {
        // Silently ignore if blob doesn't exist
    }
}

/**
 * Delete all blobs under a given prefix (e.g., all files for a project).
 */
export async function deleteBlobsByPrefix(prefix: string): Promise<number> {
    const client = getContainerClient();
    let deleted = 0;

    for await (const blob of client.listBlobsFlat({ prefix })) {
        await client.getBlockBlobClient(blob.name).deleteIfExists();
        deleted++;
    }

    return deleted;
}

/**
 * Rename a blob by copying to the new path and deleting the old one.
 * Azure Blob Storage doesn't support rename, so we copy + delete.
 */
export async function renameBlob(
    oldBlobPath: string,
    newBlobPath: string
): Promise<void> {
    const client = getContainerClient();
    const sourceBlob = client.getBlockBlobClient(oldBlobPath);
    const destBlob = client.getBlockBlobClient(newBlobPath);

    // Copy from source to destination
    const copyResult = await destBlob.beginCopyFromURL(sourceBlob.url);
    await copyResult.pollUntilDone();

    // Delete the source blob
    await sourceBlob.deleteIfExists();
}
