import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseClient } from "../../../lib/supabase/server";

type SubscriptionPlan = "basic" | "pro" | "business";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    { success: true; subscription: any } | { error: string; details?: string }
  >
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

  const { sessionId, userId } = req.body as {
    sessionId?: string;
    userId?: string;
  };

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const stripeModule = await import("stripe");
  const Stripe = stripeModule.default;
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  // Create Supabase client
  const supabase = createSupabaseClient();

  try {
    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    // Verify the session is completed
    if (checkoutSession.payment_status !== "paid") {
      return res.status(400).json({
        error: "Payment not completed",
        details: `Payment status: ${checkoutSession.payment_status}`,
      });
    }

    // Verify client_reference_id matches userId
    if (checkoutSession.client_reference_id !== userId) {
      return res.status(403).json({
        error: "User mismatch",
        details: "Session does not belong to this user",
      });
    }

    // Read metadata from checkout session
    const metadata = checkoutSession.metadata || {};
    const appMetadata = metadata.app;

    // Verify this is from our app
    if (appMetadata && appMetadata !== "nanogenai") {
      console.warn(
        `Unexpected app metadata in checkout session ${checkoutSession.id}: ${appMetadata}`
      );
    }

    // Get customer ID
    const customerId =
      typeof checkoutSession.customer === "string"
        ? checkoutSession.customer
        : checkoutSession.customer?.id;

    if (!customerId) {
      return res.status(400).json({ error: "No customer ID found in session" });
    }

    // Get subscription ID
    const subscriptionId =
      typeof checkoutSession.subscription === "string"
        ? checkoutSession.subscription
        : checkoutSession.subscription?.id;

    if (!subscriptionId) {
      return res.status(400).json({
        error: "No subscription ID found in session",
      });
    }

    // Retrieve the full subscription object to get current status and metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Read plan from subscription metadata (set during checkout)
    const planType =
      (subscription.metadata?.plan as SubscriptionPlan) ||
      (metadata.plan as SubscriptionPlan) ||
      "basic";

    // Map Stripe customer → user and sync subscription data
    const { error: syncError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        is_active: subscription.status === "active",
        plan_type: planType,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (syncError) {
      console.error("Failed to sync subscription:", syncError);
      return res.status(500).json({
        error: "Failed to sync subscription",
        details: syncError.message,
      });
    }

    // Fetch the updated subscription to return
    const { data: syncedSubscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("Failed to fetch synced subscription:", fetchError);
      return res.status(500).json({
        error: "Failed to fetch synced subscription",
        details: fetchError.message,
      });
    }

    console.log(
      `Synced subscription ${subscriptionId} for user ${userId} with plan ${planType} (app: ${
        appMetadata || "unknown"
      })`
    );

    res.json({
      success: true,
      subscription: syncedSubscription,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error syncing subscription:", errorMessage);

    // Handle Stripe-specific errors
    if (
      error instanceof Error &&
      error.message.includes("No such checkout session")
    ) {
      return res.status(404).json({
        error: "Checkout session not found",
        details: errorMessage,
      });
    }

    res.status(500).json({
      error: "Failed to sync subscription",
      details: errorMessage,
    });
  }
}
