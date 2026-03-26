import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";

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

    const event = await inngest.send({
        name: "github/export.cancel",
        data: { projectId },
    });

    // Update settings to mark export as cancelled
    await prisma.project.updateMany({
        where: { id: projectId, userId },
        data: {
            settings: {
                exportStatus: "cancelled",
            },
        },
    });

    return NextResponse.json({
        success: true,
        projectId,
        eventId: event.ids[0],
    });
}