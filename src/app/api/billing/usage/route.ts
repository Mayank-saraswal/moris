import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/billing/usage — Get token usage stats for the current user
 */
export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
        select: {
            plan: true,
            tokenBalance: true,
            monthlyTokenLimit: true,
            tokensUsedThisPeriod: true,
            billingPeriodStart: true,
            billingPeriodEnd: true,
        },
    });

    if (!subscription) {
        return NextResponse.json({
            plan: "free",
            tokenBalance: "500000",
            monthlyTokenLimit: "500000",
            tokensUsedThisPeriod: "0",
            usageByAction: [],
            usageByModel: [],
            dailyUsage: [],
        });
    }

    const periodStart = subscription.billingPeriodStart ?? new Date(0);

    // Usage by action type
    const usageByAction = await prisma.tokenUsage.groupBy({
        by: ["action"],
        where: {
            userId,
            createdAt: { gte: periodStart },
        },
        _count: { _all: true },
        _sum: { morisTokensCharged: true },
    });

    // Usage by model
    const usageByModel = await prisma.tokenUsage.groupBy({
        by: ["model"],
        where: {
            userId,
            createdAt: { gte: periodStart },
        },
        _count: { _all: true },
        _sum: { morisTokensCharged: true },
        orderBy: { _sum: { morisTokensCharged: "desc" } },
        take: 10,
    });

    // Daily usage (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyUsage = await prisma.$queryRaw`
    SELECT DATE(created_at) as day, 
           SUM(moris_tokens_charged)::text as tokens
    FROM token_usage 
    WHERE user_id = ${userId} 
      AND created_at >= ${thirtyDaysAgo}
    GROUP BY DATE(created_at) 
    ORDER BY day
  `;

    return NextResponse.json({
        plan: subscription.plan,
        tokenBalance: subscription.tokenBalance.toString(),
        monthlyTokenLimit: subscription.monthlyTokenLimit.toString(),
        tokensUsedThisPeriod: subscription.tokensUsedThisPeriod.toString(),
        billingPeriodEnd: subscription.billingPeriodEnd,
        usageByAction: usageByAction.map((u: { action: string; _count: { _all: number }; _sum: { morisTokensCharged: bigint | null } }) => ({
            action: u.action,
            count: u._count._all,
            tokens: (u._sum.morisTokensCharged ?? 0n).toString(),
        })),
        usageByModel: usageByModel.map((u: { model: string; _count: { _all: number }; _sum: { morisTokensCharged: bigint | null } }) => ({
            model: u.model,
            count: u._count._all,
            tokens: (u._sum.morisTokensCharged ?? 0n).toString(),
        })),
        dailyUsage,
    });
}
