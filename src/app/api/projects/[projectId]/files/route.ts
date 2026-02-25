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

    // Fetch all files to parse structure in-memory (handles missing folder rows safely)
    const allFiles = await prisma.file.findMany({
        where: { projectId },
        orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    const parentPrefix = parentPath ? `${parentPath}/` : "";
    const resultFiles: any[] = [];
    const seenFolders = new Set<string>();

    for (const file of allFiles) {
        if (parentPath && !file.path.startsWith(parentPrefix)) {
            continue;
        }

        const relativePath = parentPath ? file.path.slice(parentPrefix.length) : file.path;

        // Skip the parent folder itself if it somehow matches
        if (relativePath === "") continue;

        const slashIndex = relativePath.indexOf("/");

        if (slashIndex === -1) {
            // Direct child
            resultFiles.push(file);
            if (file.type === "folder") {
                seenFolders.add(file.name);
            }
        } else {
            // Nested inside a folder, synthesize if needed
            const folderName = relativePath.slice(0, slashIndex);
            if (!seenFolders.has(folderName)) {
                seenFolders.add(folderName);
                resultFiles.push({
                    id: `virtual-${parentPrefix}${folderName}`,
                    projectId,
                    name: folderName,
                    path: `${parentPrefix}${folderName}`,
                    type: "folder",
                    size: 0,
                    language: null,
                    blobPath: null,
                    createdAt: file.createdAt,
                    updatedAt: file.updatedAt,
                });
            }
        }
    }

    // Ensure folders come before files
    resultFiles.sort((a, b) => {
        if (a.type === b.type) {
            return a.name.localeCompare(b.name);
        }
        return a.type === "folder" ? -1 : 1;
    });

    return NextResponse.json(resultFiles);
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
