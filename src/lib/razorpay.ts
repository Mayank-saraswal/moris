import Razorpay from "razorpay";

let razorpayInstance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
    if (razorpayInstance) return razorpayInstance;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error("Missing Razorpay environment variables");
    }

    razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });

    return razorpayInstance;
}

/**
 * Razorpay Plan IDs — set these after creating plans in Razorpay Dashboard
 */
export const RAZORPAY_PLANS = {
    pro: process.env.RAZORPAY_PLAN_PRO_ID ?? "",
    pro_plus: process.env.RAZORPAY_PLAN_PRO_PLUS_ID ?? "",
    team: process.env.RAZORPAY_PLAN_TEAM_ID ?? "",
};

/**
 * Pricing in paise (INR) and cents (USD)
 */
export const PRICING = {
    pro: { inr: 74900, usd: 900 }, // ₹749 / $9
    pro_plus: { inr: 149900, usd: 1900 }, // ₹1,499 / $19
    team: { inr: 249900, usd: 2900 }, // ₹2,499 / $29
    token_packs: {
        starter: { tokens: 1_000_000n, inr: 20000, usd: 200 }, // ₹200 / $2
        builder: { tokens: 3_000_000n, inr: 50000, usd: 500 }, // ₹500 / $5
        power: { tokens: 8_000_000n, inr: 100000, usd: 1000 }, // ₹1,000 / $10
    },
};

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
): boolean {
    const crypto = require("crypto");
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
    return expectedSignature === signature;
}
