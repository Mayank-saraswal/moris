import { z } from "zod";
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";

const requestSchema = z.object({
    url: z.url(),
});

function parseGitHubUrl(url: string) {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
        throw new Error("Invalid GitHub URL");
    }
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = requestSchema.parse(body);

    let result;
    try {
        result = parseGitHubUrl(url);
    } catch {
        return NextResponse.json(
            { error: "Invalid GitHub URL" },
            { status: 400 }
        );
    }
    const { owner, repo } = result;

    const client = await clerkClient();
    const tokens = await client.users.getUserOauthAccessToken(userId, "github");
    const githubToken = tokens.data[0]?.token;

    if (!githubToken) {
        return NextResponse.json(
            {
                error:
                    "GitHub not connected. Please reconnect your GitHub account.",
            },
            { status: 400 }
        );
    }

    // Create project in Prisma
    const project = await prisma.project.create({
        data: {
            userId,
            name: repo,
            language: "unknown",
        },
    });

    const event = await inngest.send({
        name: "github/import.repo",
        data: {
            owner,
            repo,
            projectId: project.id,
            githubToken,
        },
    });

    return NextResponse.json({
        success: true,
        projectId: project.id,
        eventId: event.ids[0],
    });
}