import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    projects: defineTable({
        name: v.string(),
        ownerId: v.string(),
        updatedAt: v.number(),
        importStatus: v.optional(v.union(v.literal("importing"), v.literal("completed"), v.literal("failed"))),
        exportStatus: v.optional(v.union(v.literal("exporting"), v.literal("completed"), v.literal("failed"), v.literal("cancelled"))),
        exportRepoUrl: v.optional(v.string()),
        settings: v.optional(
            v.object({
                installCommand: v.optional(v.string()),
                devCommand: v.optional(v.string()),
            })
        ),

    }).index("by_owner", ["ownerId"]),


    files: defineTable({
        name: v.string(),
        blobPath: v.optional(v.string()),// Azure Blob path for text file content
        storageId: v.optional(v.id("_storage")), //binary files
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
        type: v.union(v.literal("file"), v.literal("folder")),
        updatedAt: v.number(),

    }).index("by_project", ["projectId"])
        .index("by_parent", ["parentId"])
        .index("by_project_parent", ["projectId", "parentId"]),


    conversations: defineTable({
        projectId: v.id("projects"),
        title: v.string(),
        updatedAt: v.number(),
    }).index("by_project", ["projectId"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        projectId: v.id("projects"),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        status: v.optional(v.union(v.literal("processing"), v.literal("completed"), v.literal("cancelled"))),
        thinkingEvents: v.optional(v.array(v.object({
            type: v.union(
                v.literal("thinking"),
                v.literal("tool_call"),
                v.literal("tool_result"),
                v.literal("error"),
            ),
            message: v.string(),
            toolName: v.optional(v.string()),
            timestamp: v.number(),
        }))),
        thinkingContent: v.optional(v.string()),
        thinkingDuration: v.optional(v.number()),
    }).index("by_conversation", ["conversationId"])
        .index("by_project_status", ["projectId", "status"])



})
