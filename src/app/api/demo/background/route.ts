import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { inngest } from "@/inngest/client";




export async function POST() {
    await inngest.send({
        name: "demo/generate-text",
        data: {
            
        },
    });

return Response.json({status:"started"});
}
