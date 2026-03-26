import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ conversationId: string }> };

/**
 * GET /api/conversations/[conversationId]/messages — Get all messages for a conversation
 */
export async function GET(_request: Request, { params }: Params) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    // Verify ownership via project chain
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { project: { select: { userId: true } } },
    });

    if (!conversation || conversation.project.userId !== userId) {
        return NextResponse.json(
            { error: "Conversation not found" },
            { status: 404 }
        );
    }

    const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
}
