import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/projects — List all projects for the current user
 * GET /api/projects?limit=5 — List limited projects
 */
export async function GET(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = url.searchParams.get("limit");
    const parsedLimit = limit ? Math.max(1, Math.min(100, Number.isNaN(parseInt(limit)) ? 10 : parseInt(limit))) : undefined;

    const projects = await prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        ...(parsedLimit ? { take: parsedLimit } : {}),
    });

    return NextResponse.json(projects);
}

/**
 * POST /api/projects — Create a new project
 */
export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, language, framework } = await request.json();

    const project = await prisma.project.create({
        data: {
            userId,
            name: name || "untitled-project",
            language: language || "typescript",
            framework,
        },
    });

    return NextResponse.json(project);
}
