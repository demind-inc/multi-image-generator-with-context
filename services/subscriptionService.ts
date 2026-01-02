import { SubscriptionPlan } from "../types";
import { getSupabaseClient } from "./supabaseClient";

const SUBSCRIPTION_TABLE = "subscriptions";

export interface Subscription {
  userId: string;
  isActive: boolean;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  currentPeriodEnd?: string | null;
  createdAt?: string;
  updatedAt?: string;
  planType?: SubscriptionPlan | null;
}

export async function getSubscription(
  userId: string
): Promise<Subscription | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(SUBSCRIPTION_TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    userId: data.user_id,
    isActive: data.is_active ?? false,
    stripeSubscriptionId: data.stripe_subscription_id,
    stripeCustomerId: data.stripe_customer_id,
    currentPeriodEnd: data.current_period_end,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    planType: (data.plan_type as SubscriptionPlan | null) ?? null,
  };
}

export async function createOrUpdateSubscription(
  userId: string,
  subscriptionData: {
    isActive: boolean;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    currentPeriodEnd?: string;
    planType?: SubscriptionPlan | null;
  }
): Promise<Subscription> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(SUBSCRIPTION_TABLE)
    .upsert(
      {
        user_id: userId,
        is_active: subscriptionData.isActive,
        stripe_subscription_id: subscriptionData.stripeSubscriptionId || null,
        stripe_customer_id: subscriptionData.stripeCustomerId || null,
        current_period_end: subscriptionData.currentPeriodEnd || null,
        plan_type: subscriptionData.planType || null,
        updated_at: new Date().toISOString(),
      } as any,
      {
        onConflict: "user_id",
      }
    )
    .select()
    .maybeSingle(); // Use maybeSingle() to handle cases where upsert might not return data

  if (error) {
    throw error;
  }

  // If upsert didn't return data, try to fetch it
  if (!data) {
    const subscription = await getSubscription(userId);
    if (subscription) {
      return subscription;
    }
    // If still no data, throw an error
    throw new Error("Failed to create or retrieve subscription");
  }

  return {
    userId: data.user_id,
    isActive: data.is_active ?? false,
    stripeSubscriptionId: data.stripe_subscription_id,
    stripeCustomerId: data.stripe_customer_id,
    currentPeriodEnd: data.current_period_end,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    planType: (data.plan_type as SubscriptionPlan | null) ?? null,
  };
}

export async function activateSubscription(
  userId: string,
  planType: SubscriptionPlan | null = null
): Promise<Subscription> {
  return createOrUpdateSubscription(userId, {
    isActive: true,
    planType,
  });
}

export async function deactivateSubscription(
  userId: string
): Promise<Subscription> {
  return createOrUpdateSubscription(userId, {
    isActive: false,
  });
}

export async function cancelStripeSubscription(
  stripeSubscriptionId?: string | null
): Promise<void> {
  if (!stripeSubscriptionId) return;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const endpoint = `https://api.stripe.com/v1/subscriptions/${stripeSubscriptionId}`;

  if (!stripeKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to your server environment."
    );
  }

  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Stripe cancel failed: ${response.status} ${message}`);
  }
}
