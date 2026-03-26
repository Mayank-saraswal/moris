import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ projectId: string }> };

/**
 * GET /api/projects/[projectId]/conversations — List all conversations for a project
 */
export async function GET(_request: Request, { params }: Params) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true },
    });

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const conversations = await prisma.conversation.findMany({
        where: { projectId },
        orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(conversations);
}
