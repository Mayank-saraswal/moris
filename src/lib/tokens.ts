import { prisma } from "./prisma";
import { getRedis, invalidateCache, getCached, setCache } from "./redis";

/**
 * Moris Token Multipliers
 *
 * Different AI models have different costs. We normalize them into
 * "Moris Tokens" so users see a single currency.
 * 1 Moris Token = 1 token at base rate (Claude 3.5 Haiku = 1x)
 */
const MODEL_MULTIPLIERS: Record<string, number> = {
    // Free / very cheap models
    "stepfun/step-3.5-flash:free": 0.1,
    "google/gemini-2.0-flash-001": 0.3,

    // Budget models (< $1/M input)
    "google/gemini-3-flash-preview": 0.7,
    "deepseek/deepseek-chat": 0.5,
    "openai/gpt-4o-mini": 0.8,
    "deepseek/deepseek-r1-0528": 0.8,

    // Base rate models (~$1/M input)
    "anthropic/claude-3.5-haiku": 1,
    "anthropic/claude-haiku-4.5": 1,

    // Premium models ($2-5/M input)
    "openai/gpt-4o": 3,
    "anthropic/claude-sonnet-4": 3.5,
    "anthropic/claude-sonnet-4.5": 4,
    "google/gemini-2.5-pro-preview": 3,
    "openrouter/quasar-alpha": 3,
    "openai/o3-mini": 3,

    // Ultra models ($15+/M input)
    "anthropic/claude-opus-4": 15,
    "anthropic/claude-opus-4.6": 15,
};

/**
 * Get the multiplier for a given model.
 * Default to 1x if model not found.
 */
export function getModelMultiplier(model: string): number {
    return MODEL_MULTIPLIERS[model] ?? 1;
}

/**
 * Calculate Moris Tokens from raw AI token counts
 */
export function calculateMorisTokens(
    model: string,
    promptTokens: number,
    completionTokens: number
): bigint {
    const multiplier = getModelMultiplier(model);
    return BigInt(Math.ceil((promptTokens + completionTokens) * multiplier));
}

/**
 * Check a user's token balance
 * Uses Redis cache first, falls back to DB
 */
export async function checkTokenBalance(userId: string): Promise<{
    hasTokens: boolean;
    balance: bigint;
    plan: string;
}> {
    // Try cache first
    const cached = await getCached<{
        balance: string;
        plan: string;
    }>(`tokens:${userId}`);

    if (cached) {
        const balance = BigInt(cached.balance);
        return { hasTokens: balance > 0n, balance, plan: cached.plan };
    }

    // Fallback to DB — upsert to handle first-time users
    const sub = await prisma.userSubscription.upsert({
        where: { userId },
        update: {},
        create: { userId, plan: "free" },
        select: { tokenBalance: true, plan: true },
    });

    const result = {
        hasTokens: sub.tokenBalance > 0n,
        balance: sub.tokenBalance,
        plan: sub.plan,
    };

    // Cache for 2 minutes
    await setCache(
        `tokens:${userId}`,
        { balance: sub.tokenBalance.toString(), plan: sub.plan },
        120
    );

    return result;
}

/**
 * Deduct tokens from a user's balance and log usage
 */
export async function deductTokens(params: {
    userId: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    action: string;
    projectId?: string;
}): Promise<{ morisTokensCharged: bigint }> {
    const { userId, model, promptTokens, completionTokens, action, projectId } =
        params;

    const morisTokens = calculateMorisTokens(model, promptTokens, completionTokens);
    const multiplier = getModelMultiplier(model);

    // Deduct + log in a transaction
    await prisma.$transaction([
        // Decrement balance
        prisma.userSubscription.update({
            where: { userId },
            data: {
                tokenBalance: { decrement: morisTokens },
                tokensUsedThisPeriod: { increment: morisTokens },
            },
        }),
        // Log usage
        prisma.tokenUsage.create({
            data: {
                userId,
                projectId,
                action,
                model,
                promptTokens,
                completionTokens,
                morisTokensCharged: morisTokens,
                multiplier,
            },
        }),
    ]);

    // Invalidate cached balance
    await invalidateCache(`tokens:${userId}`);

    return { morisTokensCharged: morisTokens };
}

/**
 * Reset token balance for a new billing period
 */
export async function resetTokenBalance(userId: string): Promise<void> {
    const sub = await prisma.userSubscription.findUnique({
        where: { userId },
        select: { monthlyTokenLimit: true },
    });

    if (!sub) return;

    await prisma.userSubscription.update({
        where: { userId },
        data: {
            tokenBalance: sub.monthlyTokenLimit,
            tokensUsedThisPeriod: 0n,
            billingPeriodStart: new Date(),
            billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    });

    await invalidateCache(`tokens:${userId}`);
}

/** Plan token limits */
export const PLAN_TOKEN_LIMITS: Record<string, bigint> = {
    free: 500_000n,
    pro: 5_000_000n,
    pro_plus: 15_000_000n,
    team: 25_000_000n,
};

/**
 * Upgrade a user's plan
 */
export async function upgradePlan(
    userId: string,
    newPlan: string,
    razorpaySubscriptionId?: string
): Promise<void> {
    const tokenLimit = PLAN_TOKEN_LIMITS[newPlan] ?? PLAN_TOKEN_LIMITS.free;

    await prisma.userSubscription.upsert({
        where: { userId },
        update: {
            plan: newPlan,
            monthlyTokenLimit: tokenLimit,
            tokenBalance: tokenLimit,
            tokensUsedThisPeriod: 0n,
            razorpaySubscriptionId,
            billingPeriodStart: new Date(),
            billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        create: {
            userId,
            plan: newPlan,
            monthlyTokenLimit: tokenLimit,
            tokenBalance: tokenLimit,
            razorpaySubscriptionId,
            billingPeriodStart: new Date(),
            billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    });

    await invalidateCache(`tokens:${userId}`);
}
