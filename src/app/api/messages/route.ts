import { convex } from "@/lib/convex-client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const requestSchema = z.object({
    conversationId: z.string(),
    message: z.string(),
});

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const internalKey = process.env.MORIS_CONVEX_INTERNAL_KEY;
        if (!internalKey) {
            return NextResponse.json({ error: "Internal key not found" }, { status: 500 });
        }
        const body = await req.json();
        const { conversationId, message } = requestSchema.parse(body);

        //call convex mutations and query 
        const conversation = await convex.query(api.system.getConversationById, { conversationId:conversationId as Id<"conversations">, internalKey });
        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }
        const projectId = conversation.projectId;

        //todo check for processing messages

        //create user messgaes 
        await convex.mutation(api.system.createMessage, {
            conversationId:conversationId as Id<"conversations">,
            internalKey,
            projectId,
            role:"user",
            content:message,
            status:"processing",
        });

        //create assistant message
        const assistantMessageId = await convex.mutation(api.system.createMessage, {
            conversationId:conversationId as Id<"conversations">,
            internalKey,
            projectId,
            role:"assistant",
            content:"",
            status:"processing",
        });

        // invoke ingest background jobs

        return NextResponse.json({ success: true , eventId:0 , messageId:assistantMessageId})      
       
    } catch (error) {
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
