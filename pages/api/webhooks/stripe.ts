import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseClient } from "../../../../lib/supabase/server";
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

  if (!stripeSecretKey) {
    console.error("STRIPE_SECRET_KEY is not set");
    return res.status(500).json({ error: "Stripe configuration missing" });
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

    const event = req.body as Stripe.Event;

    // Handle subscription deleted event
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      // Only process events where metadata.app = "nanogenai"
      if (subscription.metadata?.app !== "nanogenai") {
        console.log(
          `Skipping subscription ${subscription.id} - app metadata is not "nanogenai"`
        );
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

      // Update database to mark subscription as inactive
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          is_active: false,
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

      console.log(
        `Subscription ${subscription.id} canceled for user ${dbSubscription.user_id}`
      );
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
