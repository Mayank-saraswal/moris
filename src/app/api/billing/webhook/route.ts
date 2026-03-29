import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { PLAN_TOKEN_LIMITS, upgradePlan, resetTokenBalance } from "@/lib/tokens";
import { invalidateCache } from "@/lib/redis";

export async function POST(request: Request) {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

    // Verify signature
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 400 }
        );
    }

    let event;
    try {
        event = JSON.parse(body);
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON payload" },
            { status: 400 }
        );
    }
    const eventType = event.event;

    try {
        switch (eventType) {
            case "subscription.activated":
            case "subscription.authenticated": {
                // New subscription activated
                const subscription = event.payload.subscription.entity;
                const userId = subscription.notes?.userId;
                const plan = subscription.notes?.plan;

                if (userId && plan) {
                    await upgradePlan(userId, plan, subscription.id);
                    console.log(`✅ Subscription activated: ${userId} → ${plan}`);
                }
                break;
            }

            case "subscription.charged": {
                // Monthly renewal payment successful — reset tokens
                const subscription = event.payload.subscription.entity;
                const userId = subscription.notes?.userId;

                if (userId) {
                    await resetTokenBalance(userId);
                    console.log(`✅ Subscription renewed: ${userId}`);
                }
                break;
            }

            case "subscription.cancelled":
            case "subscription.completed": {
                // Subscription ended — downgrade to free
                const subscription = event.payload.subscription.entity;
                const userId = subscription.notes?.userId;

                if (userId) {
                    await prisma.userSubscription.update({
                        where: { userId },
                        data: {
                            plan: "free",
                            monthlyTokenLimit: PLAN_TOKEN_LIMITS.free,
                            tokenBalance: PLAN_TOKEN_LIMITS.free,
                            tokensUsedThisPeriod: 0n,
                            razorpaySubscriptionId: null,
                        },
                    });
                    await invalidateCache(`tokens:${userId}`);
                    console.log(`⬇️ Subscription cancelled: ${userId} → free`);
                }
                break;
            }

            case "payment.captured": {
                // One-time payment (token add-on packs)
                const payment = event.payload.payment.entity;
                const userId = payment.notes?.userId;
                const tokens = payment.notes?.tokens;

                if (userId && tokens) {
                    const tokenAmount = BigInt(tokens);

                    await prisma.$transaction([
                        prisma.userSubscription.update({
                            where: { userId },
                            data: { tokenBalance: { increment: tokenAmount } },
                        }),
                        prisma.tokenPurchase.create({
                            data: {
                                userId,
                                razorpayPaymentId: payment.id,
                                tokensPurchased: tokenAmount,
                                amountPaid: payment.amount,
                                currency: payment.currency?.toUpperCase() ?? "INR",
                            },
                        }),
                    ]);
                    await invalidateCache(`tokens:${userId}`);
                    console.log(`💰 Token purchase: ${userId} +${tokens} tokens`);
                }
                break;
            }

            default:
                console.log(`Unhandled webhook event: ${eventType}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}
