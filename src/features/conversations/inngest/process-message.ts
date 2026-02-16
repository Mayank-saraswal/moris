// import { inngest } from "@/inngest/client";
// import { Id } from "../../../../convex/_generated/dataModel";

// interface MessageEvent {
//     messageId: Id<"messages">;
//     projectId: Id<"projects">;
//     message:string;
//     conversationId:Id<"conversations">;
// }

// export const processMessage = inngest.createFunction({
//     {
//         id:"process-message",
//         cancelOn:[
//             event:"message/cancel",
//             if:"data.messageId"
//         ]
//     },
    
//     {
//      event:"message/sent"
//     }
// }) {
    
// }
