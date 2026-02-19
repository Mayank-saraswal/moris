import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/conversations — Create a new conversation
 */
export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, title } = await request.json();

    // Verify project ownership
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true },
    });

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const conversation = await prisma.conversation.create({
        data: {
            projectId,
            userId,
            title: title || "New Conversation",
        },
    });

    return NextResponse.json(conversation);
}
