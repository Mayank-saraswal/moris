import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

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

    // Clear export status from project settings
    await prisma.project.updateMany({
        where: { id: projectId, userId },
        data: {
            settings: {},
        },
    });

    return NextResponse.json({
        success: true,
        projectId,
    });
}