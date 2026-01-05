import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import type Stripe from "stripe";

type SubscriptionPlan = "basic" | "pro" | "business";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events
 *
 * Note: For production, configure the webhook endpoint in Stripe Dashboard
 * and set STRIPE_WEBHOOK_SECRET environment variable in Vercel.
 * The webhook URL should be: https://yourdomain.com/api/webhooks/stripe
 */
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

  const stripeModule = await import("stripe");
  const Stripe = stripeModule.default;
  const stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  const sig = req.headers["stripe-signature"] as string | undefined;
  let event: Stripe.Event;

  // Get raw body for signature verification
  const rawBody = await getRawBody(req);

  // Verify webhook signature if webhook secret is provided
  if (webhookSecret && sig) {
    try {
      event = stripeClient.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", errorMessage);
      // In production, reject if signature verification fails
      if (process.env.NODE_ENV === "production") {
        return res
          .status(400)
          .json({ error: `Webhook Error: ${errorMessage}` });
      }
      // In development, try to parse as JSON
      try {
        event = JSON.parse(rawBody.toString()) as Stripe.Event;
      } catch (parseErr) {
        return res
          .status(400)
          .json({ error: `Webhook Error: ${errorMessage}` });
      }
    }
  } else {
    // If no webhook secret, parse the event directly (works for development)
    try {
      event = JSON.parse(rawBody.toString()) as Stripe.Event;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to parse webhook body:", errorMessage);
      return res.status(400).json({ error: `Webhook Error: ${errorMessage}` });
    }
  }

  // Handle the event
  try {
    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;

        if (!customerId) {
          console.error("No customer ID found in subscription");
          return res.status(400).json({ error: "Missing customer identifier" });
        }

        // Find user by Stripe customer ID
        const { data: existingSubscription } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        let userId: string | undefined = existingSubscription?.user_id;

        // If not found by customer ID, try to find by subscription ID (in case customer ID wasn't set yet)
        if (!userId) {
          const { data: subBySubId } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .maybeSingle();
          userId = subBySubId?.user_id;
        }

        if (!userId) {
          console.error(
            `Could not find user for customer ${customerId} or subscription ${subscription.id}`
          );
          return res.status(400).json({ error: "User not found" });
        }

        // Determine plan type from metadata or default to 'basic'
        const planType =
          (subscription.metadata?.plan as SubscriptionPlan) || "basic";

        // Create or update subscription
        const { error: subError } = await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            is_active: subscription.status === "active",
            plan_type: planType,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

        if (subError) {
          console.error("Failed to create/update subscription:", subError);
          return res
            .status(500)
            .json({ error: "Failed to update subscription" });
        }

        console.log(
          `Subscription ${subscription.id} created for user ${userId} with plan ${planType}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Deactivate subscription
        const { error } = await supabase
          .from("subscriptions")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Failed to deactivate subscription:", error);
          return res
            .status(500)
            .json({ error: "Failed to update subscription" });
        }

        console.log(`Subscription ${subscription.id} deleted (deactivated)`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: unknown) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

// Helper function to get raw body for Next.js
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
