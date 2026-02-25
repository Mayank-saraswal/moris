import { Id } from "../../convex/_generated/dataModel";

/**
 * Typed event schemas for all Inngest events used across the application.
 * Each key is the event name, and the value contains the typed `data` shape.
 */
export interface MorisEvents {
    [key: string]: { data: Record<string, unknown> };
    "message/sent": {
        data: {
            messageId: Id<"messages">;
            conversationId: Id<"conversations">;
            projectId: Id<"projects">;
            message: string;
            model?: string;
        };
    };
    "message/cancel": {
        data: {
            messageId: Id<"messages">;
            internalKey: string;
        };
    };
    "github/import.repo": {
        data: {
            owner: string;
            repo: string;
            projectId: Id<"projects">;
            githubToken: string;
        };
    };
    "github/export.repo": {
        data: {
            projectId: Id<"projects">;
            repoName: string;
            visibility: "public" | "private";
            description?: string;
            userId: string;
        };
    };
    "github/export.cancel": {
        data: {
            projectId: Id<"projects">;
        };
    };
    "demo/generate-text": {
        data: {
            prompt: string;
        };
    };
}
