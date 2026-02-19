"use client";

import Link from "next/link";
import { useUsage } from "@/features/billing/hooks/use-billing";
import {
    ArrowLeftIcon,
    ActivityIcon,
    CoinsIcon,
    TrendingUpIcon,
    CpuIcon,
    ZapIcon,
    LayersIcon,
    LoaderIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function formatTokens(value: string | number): string {
    const num = Number(value);
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
    return num.toLocaleString();
}

function getUsagePercent(used: string, limit: string): number {
    const usedNum = Number(used);
    const limitNum = Number(limit);
    if (limitNum === 0) return 0;
    return Math.min(Math.round((usedNum / limitNum) * 100), 100);
}

function getBarColor(percent: number): string {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 70) return "bg-amber-500";
    return "bg-indigo-500";
}

export default function DashboardPage() {
    const { data: usage, isLoading } = useUsage();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!usage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground">Unable to load usage data.</p>
            </div>
        );
    }

    const usagePercent = getUsagePercent(usage.tokensUsedThisPeriod, usage.monthlyTokenLimit);
    const barColor = getBarColor(usagePercent);
    const daysRemaining = usage.billingPeriodEnd
        ? Math.max(0, Math.ceil((new Date(usage.billingPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeftIcon className="size-4" />
                        <span className="text-sm">Back to Editor</span>
                    </Link>
                    <div className="flex-1" />
                    <Link href="/pricing">
                        <Button variant="outline" size="sm">View Plans</Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold mb-8">Usage Dashboard</h1>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                            <LayersIcon className="size-4" />
                            <span>Current Plan</span>
                        </div>
                        <p className="text-2xl font-bold capitalize">{usage.plan.replace("_", " ")}</p>
                    </div>

                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                            <CoinsIcon className="size-4" />
                            <span>Token Balance</span>
                        </div>
                        <p className="text-2xl font-bold">{formatTokens(usage.tokenBalance)}</p>
                    </div>

                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                            <TrendingUpIcon className="size-4" />
                            <span>Used This Period</span>
                        </div>
                        <p className="text-2xl font-bold">{formatTokens(usage.tokensUsedThisPeriod)}</p>
                    </div>

                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                            <ZapIcon className="size-4" />
                            <span>Monthly Limit</span>
                        </div>
                        <p className="text-2xl font-bold">{formatTokens(usage.monthlyTokenLimit)}</p>
                    </div>
                </div>

                {/* Usage Bar */}
                <div className="rounded-xl border bg-card p-6 mb-10">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold">Token Usage This Period</h2>
                        <span className="text-sm text-muted-foreground">
                            {usagePercent}% used
                            {daysRemaining !== null && ` • ${daysRemaining} days remaining`}
                        </span>
                    </div>
                    <div className="h-3 rounded-full bg-accent overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${usagePercent}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>{formatTokens(usage.tokensUsedThisPeriod)} used</span>
                        <span>{formatTokens(usage.monthlyTokenLimit)} limit</span>
                    </div>
                </div>

                {/* Usage by Action & Model */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    {/* Usage by Action */}
                    <div className="rounded-xl border bg-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <ActivityIcon className="size-4 text-muted-foreground" />
                            <h2 className="font-semibold">Usage by Action</h2>
                        </div>
                        {usage.usageByAction.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">No usage recorded yet</p>
                        ) : (
                            <div className="space-y-3">
                                {usage.usageByAction.map((item) => {
                                    const totalTokens = Number(item.tokens);
                                    const maxTokens = Math.max(...usage.usageByAction.map((a) => Number(a.tokens)));
                                    const width = maxTokens > 0 ? (totalTokens / maxTokens) * 100 : 0;

                                    return (
                                        <div key={item.action}>
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="capitalize">{item.action.replaceAll("_", " ")}</span>
                                                <span className="text-muted-foreground">
                                                    {formatTokens(item.tokens)} • {item.count} calls
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-accent overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-indigo-500/70 transition-all duration-500"
                                                    style={{ width: `${width}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Usage by Model */}
                    <div className="rounded-xl border bg-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <CpuIcon className="size-4 text-muted-foreground" />
                            <h2 className="font-semibold">Usage by Model</h2>
                        </div>
                        {usage.usageByModel.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">No usage recorded yet</p>
                        ) : (
                            <div className="space-y-3">
                                {usage.usageByModel.map((item) => {
                                    const totalTokens = Number(item.tokens);
                                    const maxTokens = Math.max(...usage.usageByModel.map((m) => Number(m.tokens)));
                                    const width = maxTokens > 0 ? (totalTokens / maxTokens) * 100 : 0;
                                    const modelName = item.model.split("/").pop() ?? item.model;

                                    return (
                                        <div key={item.model}>
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="font-mono text-xs">{modelName}</span>
                                                <span className="text-muted-foreground">
                                                    {formatTokens(item.tokens)} • {item.count} calls
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-accent overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-emerald-500/70 transition-all duration-500"
                                                    style={{ width: `${width}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Daily Usage Chart */}
                {usage.dailyUsage.length > 0 && (
                    <div className="rounded-xl border bg-card p-6">
                        <h2 className="font-semibold mb-4">Daily Token Usage (Last 30 Days)</h2>
                        <div className="flex items-end gap-1 h-40">
                            {usage.dailyUsage.map((day) => {
                                const maxDaily = Math.max(...usage.dailyUsage.map((d) => Number(d.tokens)));
                                const height = maxDaily > 0 ? (Number(day.tokens) / maxDaily) * 100 : 0;
                                const date = new Date(day.day);
                                const label = `${date.getMonth() + 1}/${date.getDate()}`;

                                return (
                                    <div
                                        key={day.day}
                                        className="flex-1 flex flex-col items-center gap-1 group"
                                        title={`${label}: ${formatTokens(day.tokens)} tokens`}
                                    >
                                        <div className="w-full flex flex-col justify-end h-32">
                                            <div
                                                className="w-full rounded-t bg-indigo-500/60 group-hover:bg-indigo-500 transition-colors"
                                                style={{ height: `${Math.max(height, 2)}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] text-muted-foreground hidden lg:block">
                                            {label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
