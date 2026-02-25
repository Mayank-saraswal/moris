import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { downloadBlob, uploadBlob } from "@/lib/azure-blob";

// GET: Download file content from Azure Blob
// Query: ?blobPath=projects/{projectId}/{filePath}
export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blobPath = request.nextUrl.searchParams.get("blobPath");
    if (!blobPath) {
        return NextResponse.json(
            { error: "blobPath is required" },
            { status: 400 }
        );
    }

    // Validate that the blobPath starts with "projects/" to prevent path traversal
    if (!blobPath.startsWith("projects/")) {
        return NextResponse.json(
            { error: "Invalid blob path" },
            { status: 400 }
        );
    }

    try {
        const content = await downloadBlob(blobPath);
        if (content === null) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({ content });
    } catch (error) {
        console.error("Failed to download blob:", error);
        return NextResponse.json(
            { error: "Failed to download file content" },
            { status: 500 }
        );
    }
}

const uploadSchema = z.object({
    blobPath: z.string().min(1),
    content: z.string(),
});

// PUT: Upload file content to Azure Blob
export async function PUT(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { blobPath, content } = uploadSchema.parse(body);

    // Validate path
    if (!blobPath.startsWith("projects/")) {
        return NextResponse.json(
            { error: "Invalid blob path" },
            { status: 400 }
        );
    }

    try {
        const savedPath = await uploadBlob(blobPath, content);
        return NextResponse.json({ blobPath: savedPath });
    } catch (error) {
        console.error("Failed to upload blob:", error);
        return NextResponse.json(
            { error: "Failed to upload file content" },
            { status: 500 }
        );
    }
}
