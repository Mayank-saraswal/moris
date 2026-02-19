import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getRazorpay, PRICING } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { rateLimiters } from "@/lib/redis";

type PackName = keyof typeof PRICING.token_packs;

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit billing actions
    const limiter = rateLimiters.billing();
    const { success: withinLimit } = await limiter.limit(userId);
    if (!withinLimit) {
        return NextResponse.json(
            { error: "Too many requests" },
            { status: 429 }
        );
    }

    const { pack, currency = "INR" } = await request.json();

    const packInfo = PRICING.token_packs[pack as PackName];
    if (!packInfo) {
        return NextResponse.json(
            { error: "Invalid token pack" },
            { status: 400 }
        );
    }

    const razorpay = getRazorpay();

    try {
        const amount = currency === "INR" ? packInfo.inr : packInfo.usd;
        const currencyCode = currency === "INR" ? "INR" : "USD";

        // Create Razorpay order for one-time payment
        const order = await razorpay.orders.create({
            amount,
            currency: currencyCode,
            notes: {
                userId,
                pack,
                tokens: packInfo.tokens.toString(),
            },
        });

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error("Failed to create token purchase order:", error);
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
        );
    }
}
