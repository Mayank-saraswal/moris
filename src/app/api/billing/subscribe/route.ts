import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getRazorpay, RAZORPAY_PLANS, PRICING } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, currency = "INR" } = await request.json();

    if (!plan || !RAZORPAY_PLANS[plan as keyof typeof RAZORPAY_PLANS]) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const razorpay = getRazorpay();

    try {
        // Ensure user has a subscription record
        let userSub = await prisma.userSubscription.findUnique({
            where: { userId },
        });

        if (!userSub) {
            userSub = await prisma.userSubscription.create({
                data: { userId, plan: "free" },
            });
        }

        // Create or get Razorpay customer
        let customerId = userSub.razorpayCustomerId;
        if (!customerId) {
            const customer = await razorpay.customers.create({
                name: userId,
                notes: { userId, plan },
            });
            customerId = customer.id;

            await prisma.userSubscription.update({
                where: { userId },
                data: { razorpayCustomerId: customerId },
            });
        }

        // Create subscription
        const planId =
            RAZORPAY_PLANS[plan as keyof typeof RAZORPAY_PLANS];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = await (razorpay.subscriptions.create as any)({
            plan_id: planId,
            customer_id: customerId,
            total_count: 12, // 12 months
            notes: { userId, plan },
        });

        return NextResponse.json({
            subscriptionId: subscription.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            // Client uses these to open Razorpay checkout
        });
    } catch (error) {
        console.error("Failed to create subscription:", error);
        return NextResponse.json(
            { error: "Failed to create subscription" },
            { status: 500 }
        );
    }
}
