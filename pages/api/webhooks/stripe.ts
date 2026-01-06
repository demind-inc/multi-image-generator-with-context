import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseClient } from "../../../lib/supabase/server";
import type Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ received: boolean } | { error: string }>
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) {
    console.error("STRIPE_SECRET_KEY is not set");
    return res.status(500).json({ error: "Stripe configuration missing" });
  }

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return res.status(500).json({ error: "Webhook secret missing" });
  }

  const stripeModule = await import("stripe");
  const Stripe = stripeModule.default;
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  // Create Supabase client
  const supabase = createSupabaseClient();

  try {
    // Get the raw body for signature verification
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return res.status(400).json({ error: "No stripe-signature header" });
    }

    // Verify webhook signature using STRIPE_WEBHOOK_SECRET
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(401).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle subscription updated event (for expiration checks)
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;

      // Only process events where metadata.app = "storyboardgen"
      if (subscription.metadata?.app !== "storyboardgen") {
        return res.json({ received: true });
      }

      // Find the subscription in database by stripe_subscription_id
      const { data: dbSubscription, error: fetchError } = await supabase
        .from("subscriptions")
        .select("user_id, status, current_period_end")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();

      if (fetchError) {
        console.error(
          "Failed to fetch subscription from database:",
          fetchError
        );
        return res.status(500).json({
          error: "Failed to fetch subscription from database",
        });
      }

      if (!dbSubscription) {
        console.warn(
          `Subscription ${subscription.id} not found in database, skipping update`
        );
        return res.json({ received: true });
      }

      // Check if subscription has expired
      const currentPeriodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      const now = new Date();
      const periodEndDate = currentPeriodEnd
        ? new Date(currentPeriodEnd)
        : null;
      const hasExpired = periodEndDate && now > periodEndDate;

      // Determine the status to set
      let newStatus: string | null = null;
      if (subscription.status === "active") {
        // If period has ended, mark as expired
        if (hasExpired) {
          newStatus = "expired";
        } else {
          newStatus = "active";
        }
      } else if (subscription.status === "canceled") {
        newStatus = "unsubscribed";
      }

      // Update database if status needs to change
      if (newStatus !== null && newStatus !== dbSubscription.status) {
        const updateData: any = {
          status: newStatus,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        };

        // Set expired_at when status becomes "expired"
        if (newStatus === "expired" && dbSubscription.status !== "expired") {
          updateData.expired_at = new Date().toISOString();
        }

        // Set unsubscribed_at when status becomes "unsubscribed"
        if (
          newStatus === "unsubscribed" &&
          dbSubscription.status !== "unsubscribed"
        ) {
          updateData.unsubscribed_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from("subscriptions")
          .update(updateData)
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          console.error(
            "Failed to update subscription in database:",
            updateError
          );
          return res.status(500).json({
            error: "Failed to update subscription in database",
          });
        }
      } else if (currentPeriodEnd !== dbSubscription.current_period_end) {
        // Update current_period_end even if status hasn't changed
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          console.error(
            "Failed to update subscription period end:",
            updateError
          );
        }
      }
    }

    // Handle subscription deleted event
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      // Only process events where metadata.app = "storyboardgen"
      if (subscription.metadata?.app !== "storyboardgen") {
        return res.json({ received: true });
      }

      // Find the subscription in database by stripe_subscription_id
      const { data: dbSubscription, error: fetchError } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();

      if (fetchError) {
        console.error(
          "Failed to fetch subscription from database:",
          fetchError
        );
        return res.status(500).json({
          error: "Failed to fetch subscription from database",
        });
      }

      if (!dbSubscription) {
        console.warn(
          `Subscription ${subscription.id} not found in database, skipping update`
        );
        return res.json({ received: true });
      }

      // Update database to mark subscription as unsubscribed
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (updateError) {
        console.error(
          "Failed to update subscription in database:",
          updateError
        );
        return res.status(500).json({
          error: "Failed to update subscription in database",
        });
      }
    }

    // Return a response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing webhook:", errorMessage);
    res.status(500).json({
      error: "Failed to process webhook",
    });
  }
}
