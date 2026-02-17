import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { getProcessingMessages } from "../../../../../convex/system";


const requestSchema = z.object({
    projectId: z.string()
});

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = requestSchema.parse(body);

    const internalKey = process.env.MORIS_CONVEX_INTERNAL_KEY!;
    if (!internalKey) {
        return NextResponse.json({ error: "internal key is missing" }, { status: 401 });
    }
    //find all processing messages in this project 
    const processingMessages = await convex.query(api.system.getProcessingMessages, {
        projectId: projectId as Id<"projects">,
        internalKey: internalKey,
    });

    if (processingMessages.length === 0) {
        return NextResponse.json({ success: true, cancelled: false });
    }
    //
    const cancelledIds = await Promise.all(
        processingMessages.map(async (msg) => {
            await inngest.send({
                name: "message/cancel",
                data: {
                    messageId: msg._id,
                    internalKey,
                },
            });
            await convex.mutation(api.system.updateMessageStatus, {
                internalKey,
                status: "cancelled",
                messageId: msg._id,
            });
            return msg._id;
        })
    );
    return NextResponse.json({ success: true, messageId: cancelledIds, cancelled: true });
}
