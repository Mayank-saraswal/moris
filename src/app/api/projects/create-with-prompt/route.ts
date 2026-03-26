import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
    adjectives,
    animals,
    colors,
    uniqueNamesGenerator,
} from "unique-names-generator";

import { DEFAULT_CONVERSATION_TITLE } from "@/features/conversations/constants";
import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";
import { checkTokenBalance } from "@/lib/tokens";

const requestSchema = z.object({
    prompt: z.string().min(1),
});

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Token check
    const { hasTokens, plan } = await checkTokenBalance(userId);
    if (!hasTokens) {
        return NextResponse.json(
            { error: "insufficient_tokens", plan, upgradeUrl: "/pricing" },
            { status: 402 }
        );
    }

    const body = await request.json();
    const { prompt } = requestSchema.parse(body);

    // Generate a random project name
    const projectName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals, colors],
        separator: "-",
        length: 3,
    });

    // Create project and conversation together in a transaction
    const result = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
        const project = await tx.project.create({
            data: {
                userId,
                name: projectName,
            },
        });

        const conversation = await tx.conversation.create({
            data: {
                projectId: project.id,
                userId,
                title: DEFAULT_CONVERSATION_TITLE,
            },
        });

        // Create user message
        await tx.message.create({
            data: {
                conversationId: conversation.id,
                role: "user",
                content: prompt,
            },
        });

        // Create assistant message placeholder
        const assistantMessage = await tx.message.create({
            data: {
                conversationId: conversation.id,
                role: "assistant",
                content: "",
                status: "processing",
            },
        });

        return {
            projectId: project.id,
            conversationId: conversation.id,
            messageId: assistantMessage.id,
        };
    });

    // Trigger Inngest to process the message
    await inngest.send({
        name: "message/sent",
        data: {
            messageId: result.messageId,
            conversationId: result.conversationId,
            projectId: result.projectId,
            message: prompt,
            userId,
        },
    });

    return NextResponse.json({ projectId: result.projectId });
}