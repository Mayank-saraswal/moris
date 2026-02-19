import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";

const requestSchema = z.object({
    projectId: z.string(),
});

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = requestSchema.parse(body);

    // Find all processing messages in this project's conversations
    const processingMessages = await prisma.message.findMany({
        where: {
            status: "processing",
            conversation: {
                projectId,
                project: { userId },
            },
        },
        select: { id: true },
    });

    if (processingMessages.length === 0) {
        return NextResponse.json({ success: true, cancelled: false });
    }

    const cancelledIds = await Promise.all(
        processingMessages.map(async (msg: { id: string }) => {
            await inngest.send({
                name: "message/cancel",
                data: { messageId: msg.id },
            });
            await prisma.message.update({
                where: { id: msg.id },
                data: { status: "cancelled" },
            });
            return msg.id;
        })
    );

    return NextResponse.json({
        success: true,
        messageId: cancelledIds,
        cancelled: true,
    });
}
