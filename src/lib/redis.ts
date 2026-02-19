import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Singleton Redis client
let redis: Redis | null = null;

export function getRedis(): Redis {
    if (redis) return redis;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        throw new Error("Missing Upstash Redis environment variables");
    }

    redis = new Redis({ url, token });
    return redis;
}

// Rate limiter for API routes
// 20 requests per 60 seconds per user
export function createRateLimiter(
    requests: number = 20,
    windowSeconds: number = 60
) {
    return new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
        analytics: true,
        prefix: "moris:ratelimit",
    });
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
    messages: () => createRateLimiter(15, 60), // 15 messages/min
    suggestions: () => createRateLimiter(60, 60), // 60 suggestions/min
    quickEdit: () => createRateLimiter(20, 60), // 20 edits/min
    billing: () => createRateLimiter(5, 60), // 5 billing actions/min
};

// Cache helpers
export async function getCached<T>(key: string): Promise<T | null> {
    const r = getRedis();
    return r.get<T>(key);
}

export async function setCache(
    key: string,
    value: unknown,
    expirySeconds: number = 120
): Promise<void> {
    const r = getRedis();
    await r.set(key, value, { ex: expirySeconds });
}

export async function invalidateCache(key: string): Promise<void> {
    const r = getRedis();
    await r.del(key);
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
    const r = getRedis();
    const keys = await r.keys(pattern);
    if (keys.length > 0) {
        await Promise.all(keys.map((key) => r.del(key)));
    }
}
