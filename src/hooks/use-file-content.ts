import { useState, useEffect, useCallback } from "react";

/**
 * Hook to fetch file content from Azure Blob Storage via the API route.
 * Returns the content string, loading state, and a refetch function.
 */
export function useFileContent(blobPath: string | undefined | null) {
    const [content, setContent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchContent = useCallback(async () => {
        if (!blobPath) {
            setContent(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `/api/files/content?blobPath=${encodeURIComponent(blobPath)}`
            );
            if (!res.ok) {
                throw new Error(`Failed to fetch file content: ${res.status}`);
            }
            const data = await res.json();
            setContent(data.content ?? null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch content");
            setContent(null);
        } finally {
            setIsLoading(false);
        }
    }, [blobPath]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    return { content, isLoading, error, refetch: fetchContent };
}

/**
 * Upload file content to Azure Blob Storage.
 * Returns the blobPath of the uploaded file.
 */
export async function uploadFileContent(
    blobPath: string,
    content: string
): Promise<string> {
    const res = await fetch("/api/files/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobPath, content }),
    });

    if (!res.ok) {
        throw new Error(`Failed to upload file content: ${res.status}`);
    }

    const data = await res.json();
    return data.blobPath;
}
