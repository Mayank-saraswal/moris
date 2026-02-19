"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ---- Types ----
export interface UsageData {
    plan: string;
    tokenBalance: string;
    monthlyTokenLimit: string;
    tokensUsedThisPeriod: string;
    billingPeriodEnd?: string;
    usageByAction: { action: string; count: number; tokens: string }[];
    usageByModel: { model: string; count: number; tokens: string }[];
    dailyUsage: { day: string; tokens: string }[];
}

// ---- API helpers ----
async function fetchAPI<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

async function mutateAPI<T>(url: string, data: unknown): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

// ---- Hooks ----

/** Fetch user's token usage, balance, and billing info */
export const useUsage = () => {
    return useQuery({
        queryKey: ["billing", "usage"],
        queryFn: () => fetchAPI<UsageData>("/api/billing/usage"),
        staleTime: 30_000, // 30 seconds
    });
};

/** Subscribe to a plan */
export const useSubscribe = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (plan: string) =>
            mutateAPI<{ subscriptionId: string; razorpayKeyId: string }>(
                "/api/billing/subscribe",
                { plan }
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing"] });
        },
    });
};

/** Purchase token packs */
export const usePurchaseTokens = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { pack: string; currency?: string }) =>
            mutateAPI<{ orderId: string; amount: number; currency: string }>(
                "/api/billing/purchase-tokens",
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing"] });
        },
    });
};
