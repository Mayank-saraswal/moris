import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";
import { checkTokenBalance } from "@/lib/tokens";
import { rateLimiters } from "@/lib/redis";

const requestSchema = z.object({
  conversationId: z.string(),
  message: z.string(),
  model: z.string().optional(),
});

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const limiter = rateLimiters.messages();
  const { success: withinLimit } = await limiter.limit(userId);
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      { status: 429 }
    );
  }

  // Token balance check
  const { hasTokens, balance, plan } = await checkTokenBalance(userId);
  if (!hasTokens) {
    return NextResponse.json(
      {
        error: "insufficient_tokens",
        balance: 0,
        plan,
        upgradeUrl: "/pricing",
      },
      { status: 402 }
    );
  }

  const body = await request.json();
  const { conversationId, message, model } = requestSchema.parse(body);

  // Verify conversation exists and belongs to user
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true, projectId: true },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const projectId = conversation.projectId;

  // Cancel any processing messages
  const processingMessages = await prisma.message.findMany({
    where: {
      conversation: { projectId },
      status: "processing",
    },
    select: { id: true },
  });

  if (processingMessages.length > 0) {
    await Promise.all(
      processingMessages.map(async (msg: { id: string }) => {
        await inngest.send({
          name: "message/cancel",
          data: { messageId: msg.id },
        });
        await prisma.message.update({
          where: { id: msg.id },
          data: { status: "cancelled" },
        });
      })
    );
  }

  // Create user message
  await prisma.message.create({
    data: {
      conversationId,
      role: "user",
      content: message,
    },
  });

  // Create assistant message placeholder
  const assistantMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "assistant",
      content: "",
      status: "processing",
    },
  });

  // Trigger Inngest to process the message
  const event = await inngest.send({
    name: "message/sent",
    data: {
      messageId: assistantMessage.id,
      conversationId,
      projectId,
      message,
      model,
      userId,
    },
  });

  return NextResponse.json({
    success: true,
    eventId: event.ids[0],
    messageId: assistantMessage.id,
  });
}