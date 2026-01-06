import type { NextApiRequest, NextApiResponse } from "next";
import type Stripe from "stripe";

type SubscriptionPlan = "basic" | "pro" | "business";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ url: string } | { error: string }>
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error("STRIPE_SECRET_KEY is not set");
    return res.status(500).json({ error: "Stripe configuration missing" });
  }

  const { userId, plan } = req.body as {
    userId?: string;
    plan?: SubscriptionPlan;
  };

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  if (!plan || !["basic", "pro", "business"].includes(plan)) {
    return res
      .status(400)
      .json({ error: "Valid plan (basic/pro/business) is required" });
  }

  // Get Price ID from environment variables
  const priceIdEnvVar = `STRIPE_PRICE_ID_${plan.toUpperCase()}`;
  const priceId = process.env[priceIdEnvVar];

  if (!priceId) {
    console.error(`${priceIdEnvVar} is not set`);
    return res.status(500).json({
      error: `Stripe Price ID for ${plan} plan is not configured`,
    });
  }

  const stripeModule = await import("stripe");
  const Stripe = stripeModule.default;
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  try {
    // Get the base URL for success/cancel URLs
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3300";

    // Create Checkout Session with metadata
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      metadata: {
        app: "storyboardgen",
        plan: plan,
        user_id: userId,
      },
      subscription_data: {
        metadata: {
          app: "storyboardgen",
          plan: plan,
        },
      },
      success_url: `${baseUrl}/subscription/redirect?session_id={CHECKOUT_SESSION_ID}&paid=1&plan=${plan}`,
      cancel_url: `${baseUrl}/dashboard?canceled=1`,
    });

    if (!session.url) {
      return res
        .status(500)
        .json({ error: "Failed to create checkout session" });
    }

    res.json({ url: session.url });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating checkout session:", errorMessage);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
}
