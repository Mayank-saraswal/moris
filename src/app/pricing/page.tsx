"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useUsage, useSubscribe } from "@/features/billing/hooks/use-billing";
import { ArrowLeftIcon, CheckIcon, SparklesIcon, ZapIcon, RocketIcon, BuildingIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PLANS = [
    {
        id: "free",
        name: "Free",
        icon: SparklesIcon,
        price: { inr: 0, usd: 0 },
        tokens: "500K",
        features: [
            "500K Moris tokens/month",
            "AI coding assistant",
            "File management",
            "WebContainer preview",
            "Community support",
        ],
        cta: "Current Plan",
        highlight: false,
    },
    {
        id: "pro",
        name: "Pro",
        icon: ZapIcon,
        price: { inr: 749, usd: 9 },
        tokens: "5M",
        features: [
            "5M Moris tokens/month",
            "All Free features",
            "Premium AI models (Claude, GPT-4o)",
            "Priority code generation",
            "GitHub import/export",
            "E2B server-side sandbox",
            "Email support",
        ],
        cta: "Upgrade to Pro",
        highlight: true,
    },
    {
        id: "pro_plus",
        name: "Pro+",
        icon: RocketIcon,
        price: { inr: 1499, usd: 19 },
        tokens: "15M",
        features: [
            "15M Moris tokens/month",
            "All Pro features",
            "Ultra models (Claude Opus)",
            "Advanced code analysis",
            "Priority support",
            "Early access to new features",
        ],
        cta: "Upgrade to Pro+",
        highlight: false,
    },
    {
        id: "team",
        name: "Team",
        icon: BuildingIcon,
        price: { inr: 2499, usd: 29 },
        tokens: "25M",
        features: [
            "25M Moris tokens/month",
            "All Pro+ features",
            "Team collaboration",
            "Shared projects",
            "Admin dashboard",
            "Dedicated support",
        ],
        cta: "Upgrade to Team",
        highlight: false,
    },
];

const TOKEN_PACKS = [
    { id: "starter", name: "Starter Pack", tokens: "1M", price: { inr: 200, usd: 2 } },
    { id: "builder", name: "Builder Pack", tokens: "3M", price: { inr: 500, usd: 5 } },
    { id: "power", name: "Power Pack", tokens: "8M", price: { inr: 1000, usd: 10 } },
];

export default function PricingPage() {
    const { user } = useUser();
    const { data: usage } = useUsage();
    const subscribe = useSubscribe();
    const currentPlan = usage?.plan ?? "free";

    const handleSubscribe = async (planId: string) => {
        if (planId === "free" || planId === currentPlan) return;

        try {
            const result = await subscribe.mutateAsync(planId);
            // Open Razorpay checkout
            const options = {
                key: result.razorpayKeyId,
                subscription_id: result.subscriptionId,
                name: "Moris",
                description: `${planId.replace("_", " ").toUpperCase()} Plan`,
                handler: () => {
                    toast.success("Subscription successful! Refreshing...");
                    window.location.reload();
                },
                prefill: {
                    email: user?.primaryEmailAddress?.emailAddress,
                },
                theme: {
                    color: "#6366f1",
                },
            };
            // @ts-expect-error Razorpay is loaded via script
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch {
            toast.error("Failed to start subscription");
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeftIcon className="size-4" />
                        <span className="text-sm">Back to Editor</span>
                    </Link>
                    <div className="flex-1" />
                    {usage && (
                        <Link href="/dashboard">
                            <Button variant="outline" size="sm">View Usage Dashboard</Button>
                        </Link>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-16">
                {/* Hero */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        Simple, transparent pricing
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Start free with 500K tokens/month. Upgrade for premium AI models, more tokens, and advanced features.
                    </p>
                    {usage && (
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-sm">
                            <span>Current plan:</span>
                            <span className="font-semibold capitalize">{currentPlan.replace("_", " ")}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                                {Number(usage.tokenBalance).toLocaleString()} tokens remaining
                            </span>
                        </div>
                    )}
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                    {PLANS.map((plan) => {
                        const isCurrent = plan.id === currentPlan;
                        return (
                            <div
                                key={plan.id}
                                className={`relative flex flex-col rounded-xl border p-6 transition-all hover:shadow-lg ${plan.highlight
                                        ? "border-indigo-500/50 bg-gradient-to-b from-indigo-500/5 to-transparent shadow-md shadow-indigo-500/10"
                                        : "border-border bg-card"
                                    }`}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-medium rounded-full bg-indigo-500 text-white">
                                        Most Popular
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mb-4">
                                    <plan.icon className={`size-5 ${plan.highlight ? "text-indigo-400" : "text-muted-foreground"}`} />
                                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                                </div>

                                <div className="mb-4">
                                    <span className="text-3xl font-bold">₹{plan.price.inr}</span>
                                    {plan.price.inr > 0 && <span className="text-muted-foreground text-sm">/month</span>}
                                </div>

                                <p className="text-sm text-muted-foreground mb-6">
                                    {plan.tokens} Moris tokens/month
                                </p>

                                <ul className="space-y-2.5 mb-8 flex-1">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2 text-sm">
                                            <CheckIcon className={`size-4 shrink-0 mt-0.5 ${plan.highlight ? "text-indigo-400" : "text-emerald-400"}`} />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={isCurrent || subscribe.isPending}
                                    variant={plan.highlight ? "default" : "outline"}
                                    className={`w-full ${plan.highlight
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                            : ""
                                        }`}
                                >
                                    {isCurrent ? "Current Plan" : plan.cta}
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {/* Token Packs */}
                <div className="mb-20">
                    <h2 className="text-2xl font-bold text-center mb-2">Need More Tokens?</h2>
                    <p className="text-muted-foreground text-center mb-8">
                        Purchase token packs anytime. They never expire and stack with your monthly allowance.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                        {TOKEN_PACKS.map((pack) => (
                            <div
                                key={pack.id}
                                className="flex flex-col items-center rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all"
                            >
                                <h3 className="font-semibold text-lg mb-1">{pack.name}</h3>
                                <p className="text-3xl font-bold text-indigo-400 mb-1">{pack.tokens}</p>
                                <p className="text-sm text-muted-foreground mb-4">Moris tokens</p>
                                <p className="text-lg font-semibold mb-4">₹{pack.price.inr}</p>
                                <Button variant="outline" className="w-full">
                                    Buy Now
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ */}
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-1">What are Moris tokens?</h3>
                            <p className="text-sm text-muted-foreground">
                                Moris tokens are the universal currency for AI actions. Different models cost different amounts —
                                cheaper models like Gemini Flash use fewer tokens while premium models like Claude Opus use more.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Do unused tokens roll over?</h3>
                            <p className="text-sm text-muted-foreground">
                                Monthly plan tokens reset each billing period. Purchased token packs never expire and carry forward.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Can I cancel anytime?</h3>
                            <p className="text-sm text-muted-foreground">
                                Yes, you can cancel your subscription at any time. You&apos;ll keep access until the end of your current billing period.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Which AI models are available?</h3>
                            <p className="text-sm text-muted-foreground">
                                Free plan includes Gemini Flash and DeepSeek. Pro and above unlock Claude Sonnet, GPT-4o, Gemini Pro, and more.
                                Pro+ adds access to ultra models like Claude Opus.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
