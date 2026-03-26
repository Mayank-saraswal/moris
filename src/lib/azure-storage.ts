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
        throw new Error("Missing AZURE_STORAGE_CONNECTION_STRING");
    }

    const blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    return containerClient;
}

/**
 * Ensure the container exists (call once during setup/migration)
 */
export async function ensureContainer(): Promise<void> {
    const client = getContainerClient();
    await client.createIfNotExists();
}

/**
 * Upload file content to Azure Blob Storage
 * @param blobPath - Path like "{projectId}/{fileId}"
 * @param content - File content (string or Buffer)
 * @param contentType - MIME type (default: text/plain)
 */
export async function uploadBlob(
    blobPath: string,
    content: string | Buffer,
    contentType: string = "text/plain; charset=utf-8"
): Promise<void> {
    const client = getContainerClient();
    const blockBlobClient = client.getBlockBlobClient(blobPath);

    const data = typeof content === "string" ? Buffer.from(content, "utf-8") : content;

    await blockBlobClient.uploadData(data, {
        blobHTTPHeaders: { blobContentType: contentType },
    });
}

/**
 * Download file content from Azure Blob Storage
 * @param blobPath - Path like "{projectId}/{fileId}"
 * @returns File content as string
 */
export async function downloadBlob(blobPath: string): Promise<string> {
    const client = getContainerClient();
    const blockBlobClient = client.getBlockBlobClient(blobPath);

    const downloadResponse = await blockBlobClient.download(0);
    const stream = downloadResponse.readableStreamBody;

    if (!stream) {
        throw new Error(`Failed to download blob: ${blobPath}`);
    }

    return streamToString(stream);
}

/**
 * Download file content as Buffer (for binary files)
 */
export async function downloadBlobAsBuffer(blobPath: string): Promise<Buffer> {
    const client = getContainerClient();
    const blockBlobClient = client.getBlockBlobClient(blobPath);

    return blockBlobClient.downloadToBuffer();
}

/**
 * Delete a blob from Azure Storage
 */
export async function deleteBlob(blobPath: string): Promise<void> {
    const client = getContainerClient();
    const blockBlobClient = client.getBlockBlobClient(blobPath);

    await blockBlobClient.deleteIfExists();
}

/**
 * Delete all blobs for a project
 */
export async function deleteProjectBlobs(projectId: string): Promise<void> {
    const client = getContainerClient();

    for await (const blob of client.listBlobsFlat({
        prefix: `${projectId}/`,
    })) {
        await client.getBlockBlobClient(blob.name).deleteIfExists();
    }
}

/**
 * Check if a blob exists
 */
export async function blobExists(blobPath: string): Promise<boolean> {
    const client = getContainerClient();
    const blockBlobClient = client.getBlockBlobClient(blobPath);

    return blockBlobClient.exists();
}

// Helper to convert Node.js ReadableStream to string
async function streamToString(
    stream: NodeJS.ReadableStream
): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString("utf-8");
}
