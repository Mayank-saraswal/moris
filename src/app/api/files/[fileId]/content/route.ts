import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { readTextFile } from "@/lib/file-storage";

type Params = { params: Promise<{ fileId: string }> };

/**
 * GET /api/files/[fileId]/content — Get file content from Azure Blob
 */
export async function GET(_request: Request, { params }: Params) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;

    const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: { project: { select: { userId: true } } },
    });

    if (!file || file.project.userId !== userId) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (!file.blobPath) {
        return NextResponse.json({ content: "" });
    }

    try {
        const content = await readTextFile(file.projectId, file.id);
        return NextResponse.json({ content });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to read file content" },
            { status: 500 }
        );
    }
}
