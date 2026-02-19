import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ projectId: string }> };

/**
 * POST /api/projects/[projectId]/rename — Rename a project
 */
export async function POST(request: Request, { params }: Params) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const { name } = await request.json();

    const project = await prisma.project.updateMany({
        where: { id: projectId, userId },
        data: { name },
    });

    if (project.count === 0) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
