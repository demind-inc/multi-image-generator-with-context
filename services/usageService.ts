import { MonthlyUsage, SubscriptionPlan } from "../types";
import { getSupabaseClient } from "./supabaseClient";

const USAGE_TABLE = "usage_limits";
export const DEFAULT_MONTHLY_CREDITS = 60;
export const PLAN_CREDITS: Record<SubscriptionPlan, number> = {
  basic: 60,
  pro: 180,
  business: 600,
};

const getCurrentPeriodStart = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return startOfMonth.toISOString().split("T")[0];
};

const getPlanCredits = (planType?: SubscriptionPlan | null) =>
  PLAN_CREDITS[planType || "basic"] ?? DEFAULT_MONTHLY_CREDITS;

const normalizeUsage = (record: any, fallbackLimit: number): MonthlyUsage => {
  const monthlyLimit = Math.max(
    record?.monthly_limit ?? fallbackLimit,
    fallbackLimit
  );
  const used = record?.used ?? 0;

  return {
    userId: record.user_id,
    periodStart: record.period_start,
    used,
    monthlyLimit,
    remaining: Math.max(monthlyLimit - used, 0),
  };
};

export async function getMonthlyUsage(
  userId: string,
  planType?: SubscriptionPlan | null
): Promise<MonthlyUsage> {
  const supabase = getSupabaseClient();
  const periodStart = getCurrentPeriodStart();
  const fallbackLimit = getPlanCredits(planType);

  const { data, error } = await supabase
    .from(USAGE_TABLE)
    .select("user_id, period_start, used, monthly_limit")
    .eq("user_id", userId)
    .eq("period_start", periodStart)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

  if (error) {
    throw error;
  }

  if (data) {
    return normalizeUsage(data, fallbackLimit);
  }

  // If no record exists (404), return default values
  return {
    userId,
    periodStart,
    used: 0,
    monthlyLimit: fallbackLimit,
    remaining: fallbackLimit,
  };
}

export async function recordGeneration(
  userId: string,
  amount = 1,
  planType?: SubscriptionPlan | null
): Promise<MonthlyUsage> {
  const supabase = getSupabaseClient();
  const currentUsage = await getMonthlyUsage(userId, planType);

  if (currentUsage.used + amount > currentUsage.monthlyLimit) {
    const limitError = new Error("MONTHLY_LIMIT_REACHED");
    (limitError as any).remaining = currentUsage.remaining;
    throw limitError;
  }

  // Use upsert to create the record if it doesn't exist, or update if it does
  // Supabase will automatically use the primary key constraint (usage_limits_pkey)
  const { data, error } = await supabase
    .from(USAGE_TABLE)
    .upsert({
      user_id: userId,
      period_start: currentUsage.periodStart,
      used: currentUsage.used + amount,
      monthly_limit: currentUsage.monthlyLimit,
    } as any)
    .select("user_id, period_start, used, monthly_limit")
    .single();

  if (error) {
    // If upsert returns no rows (PGRST116), try to fetch the record
    if (error.code === "PGRST116") {
      // Record might have been created but not returned, fetch it
      const { data: fetchedData, error: fetchError } = await supabase
        .from(USAGE_TABLE)
        .select("user_id, period_start, used, monthly_limit")
        .eq("user_id", userId)
        .eq("period_start", currentUsage.periodStart)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (fetchedData) {
        return normalizeUsage(fetchedData, currentUsage.monthlyLimit);
      }

      // If still no data, return the expected values
      return {
        userId,
        periodStart: currentUsage.periodStart,
        used: currentUsage.used + amount,
        monthlyLimit: currentUsage.monthlyLimit,
        remaining: Math.max(
          currentUsage.monthlyLimit - (currentUsage.used + amount),
          0
        ),
      };
    }
    throw error;
  }

  if (!data) {
    // Fallback if data is null
    return {
      userId,
      periodStart: currentUsage.periodStart,
      used: currentUsage.used + amount,
      monthlyLimit: currentUsage.monthlyLimit,
      remaining: Math.max(
        currentUsage.monthlyLimit - (currentUsage.used + amount),
        0
      ),
    };
  }

  return normalizeUsage(data, currentUsage.monthlyLimit);
}

/**
 * Resets the monthly usage limit for the current month when subscribing to a new plan.
 * This sets used to 0 and updates monthly_limit to match the new plan's credits.
 */
export async function resetMonthlyUsageForNewPlan(
  userId: string,
  planType: SubscriptionPlan
): Promise<MonthlyUsage> {
  const supabase = getSupabaseClient();
  const periodStart = getCurrentPeriodStart();
  const newLimit = getPlanCredits(planType);

  // Upsert the usage record with used=0 and the new monthly_limit
  const { data, error } = await supabase
    .from(USAGE_TABLE)
    .upsert({
      user_id: userId,
      period_start: periodStart,
      used: 0,
      monthly_limit: newLimit,
    } as any)
    .select("user_id, period_start, used, monthly_limit")
    .single();

  if (error) {
    // If upsert returns no rows (PGRST116), try to fetch the record
    if (error.code === "PGRST116") {
      // Record might have been created but not returned, fetch it
      const { data: fetchedData, error: fetchError } = await supabase
        .from(USAGE_TABLE)
        .select("user_id, period_start, used, monthly_limit")
        .eq("user_id", userId)
        .eq("period_start", periodStart)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (fetchedData) {
        return normalizeUsage(fetchedData, newLimit);
      }
    }
    throw error;
  }

  if (!data) {
    // Fallback if data is null
    return {
      userId,
      periodStart,
      used: 0,
      monthlyLimit: newLimit,
      remaining: newLimit,
    };
  }

  return normalizeUsage(data, newLimit);
}
