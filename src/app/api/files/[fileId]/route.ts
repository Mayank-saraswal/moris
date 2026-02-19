import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { readTextFile, uploadTextFile, deleteFile as deleteFileBlob } from "@/lib/file-storage";

type Params = { params: Promise<{ fileId: string }> };

/**
 * GET /api/files/[fileId] — Get file metadata
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

    return NextResponse.json(file);
}

/**
 * POST /api/files/[fileId] — Update file content
 */
export async function POST(request: Request, { params }: Params) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    const { content } = await request.json();

    const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: { project: { select: { userId: true } } },
    });

    if (!file || file.project.userId !== userId) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Upload new content to Azure Blob
    const blobPath = await uploadTextFile(
        file.projectId,
        file.id,
        content,
        file.name
    );

    await prisma.file.update({
        where: { id: fileId },
        data: { blobPath, size: content.length },
    });

    return NextResponse.json({ success: true });
}

/**
 * DELETE /api/files/[fileId] — Delete a file
 */
export async function DELETE(_request: Request, { params }: Params) {
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

    // Delete blob from Azure
    if (file.blobPath) {
        try {
            await deleteFileBlob(file.projectId, file.id);
        } catch {
            // Continue even if blob delete fails
        }
    }

    await prisma.file.delete({ where: { id: fileId } });

    return NextResponse.json({ success: true });
}
