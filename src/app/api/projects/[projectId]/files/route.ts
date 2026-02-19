import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { uploadTextFile } from "@/lib/file-storage";

type Params = { params: Promise<{ projectId: string }> };

/**
 * GET /api/projects/[projectId]/files — List all files in a project
 * GET /api/projects/[projectId]/files?parentPath=src/components — List files in folder
 */
export async function GET(request: Request, { params }: Params) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const url = new URL(request.url);
    const parentPath = url.searchParams.get("parentPath");

    // Verify project ownership
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true },
    });

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let files;
    if (parentPath) {
        // Get files within a specific folder
        files = await prisma.file.findMany({
            where: {
                projectId,
                path: { startsWith: `${parentPath}/` },
                // Only direct children (no sub-folder contents)
                NOT: {
                    path: { contains: `${parentPath}/`, },
                },
            },
            orderBy: [{ type: "asc" }, { name: "asc" }],
        });

        // Filter to direct children only
        files = files.filter((f: { path: string }) => {
            const relativePath = f.path.replace(`${parentPath}/`, "");
            return !relativePath.includes("/");
        });
    } else {
        // Get all files (flat list)
        files = await prisma.file.findMany({
            where: { projectId },
            orderBy: [{ type: "asc" }, { name: "asc" }],
        });
    }

    return NextResponse.json(files);
}

/**
 * POST /api/projects/[projectId]/files — Create a file or folder
 */
export async function POST(request: Request, { params }: Params) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const { name, content, parentPath, type } = await request.json();

    // Verify project ownership
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true },
    });

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const filePath = parentPath ? `${parentPath}/${name}` : name;

    if (type === "folder") {
        const folder = await prisma.file.create({
            data: {
                projectId,
                name,
                path: filePath,
                type: "folder",
            },
        });
        return NextResponse.json(folder);
    }

    // Create file
    const file = await prisma.file.create({
        data: {
            projectId,
            name,
            path: filePath,
            type: "file",
            size: content?.length ?? 0,
        },
    });

    // Upload content to Azure Blob if provided
    if (content) {
        const blobPath = await uploadTextFile(projectId, file.id, content, name);
        await prisma.file.update({
            where: { id: file.id },
            data: { blobPath },
        });
    }

    return NextResponse.json(file);
}
