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
}

export async function getSubscription(
  userId: string
): Promise<Subscription | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(SUBSCRIPTION_TABLE)
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
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
  };
}

export async function createOrUpdateSubscription(
  userId: string,
  subscriptionData: {
    isActive: boolean;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    currentPeriodEnd?: string;
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
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    userId: data.user_id,
    isActive: data.is_active ?? false,
    stripeSubscriptionId: data.stripe_subscription_id,
    stripeCustomerId: data.stripe_customer_id,
    currentPeriodEnd: data.current_period_end,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function activateSubscription(
  userId: string
): Promise<Subscription> {
  return createOrUpdateSubscription(userId, {
    isActive: true,
  });
}

export async function deactivateSubscription(
  userId: string
): Promise<Subscription> {
  return createOrUpdateSubscription(userId, {
    isActive: false,
  });
}
