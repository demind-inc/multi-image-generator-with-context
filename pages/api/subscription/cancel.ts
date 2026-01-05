import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseClient } from "../../../lib/supabase/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    { success: true; message: string } | { error: string; details?: string }
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

  const { userId } = req.body as {
    userId?: string;
  };

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
    // Get subscription from database
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("Failed to fetch subscription:", fetchError);
      return res.status(500).json({
        error: "Failed to fetch subscription",
        details: fetchError.message,
      });
    }

    if (!subscription) {
      return res.status(404).json({
        error: "No subscription found",
        details: "User does not have an active subscription",
      });
    }

    if (!subscription.stripe_subscription_id) {
      // No Stripe subscription ID, just update database
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "unsubscribed",
          unsubscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Failed to update subscription:", updateError);
        return res.status(500).json({
          error: "Failed to update subscription",
          details: updateError.message,
        });
      }

      return res.json({
        success: true,
        message: "Subscription canceled successfully",
      });
    }

    // Cancel subscription in Stripe
    let expiredAt: string | null = null;
    try {
      const canceledSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        }
      );

      // Set expired_at to the current_period_end from Stripe response
      if (canceledSubscription.current_period_end) {
        expiredAt = new Date(
          canceledSubscription.current_period_end * 1000
        ).toISOString();
      }
    } catch (stripeError: any) {
      // If subscription is already canceled or doesn't exist in Stripe,
      // still update our database
      if (
        stripeError?.code === "resource_missing" ||
        stripeError?.message?.includes("No such subscription")
      ) {
        console.warn(
          `Subscription ${subscription.stripe_subscription_id} not found in Stripe, updating database only`
        );
        // Use existing current_period_end from database if available
        if (subscription.current_period_end) {
          expiredAt = subscription.current_period_end;
        }
      } else {
        console.error("Failed to cancel subscription in Stripe:", stripeError);
        return res.status(500).json({
          error: "Failed to cancel subscription in Stripe",
          details: stripeError.message,
        });
      }
    }

    // Update database to mark subscription as unsubscribed
    const updateData: any = {
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Set expired_at if we have it from Stripe response or database
    if (expiredAt) {
      updateData.expired_at = expiredAt;
    }

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Failed to update subscription in database:", updateError);
      return res.status(500).json({
        error: "Failed to update subscription in database",
        details: updateError.message,
      });
    }

    res.json({
      success: true,
      message: "Subscription canceled successfully",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error canceling subscription:", errorMessage);
    res.status(500).json({
      error: "Failed to cancel subscription",
      details: errorMessage,
    });
  }
}
