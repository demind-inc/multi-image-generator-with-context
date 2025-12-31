import { DailyUsage } from "../types";
import { getSupabaseClient } from "./supabaseClient";

const USAGE_TABLE = "usage_limits";
export const DEFAULT_DAILY_LIMIT = 10;

const getTodayDate = () => new Date().toISOString().split("T")[0];

const normalizeUsage = (record: any): DailyUsage => {
  const dailyLimit = record?.daily_limit ?? DEFAULT_DAILY_LIMIT;
  const used = record?.used ?? 0;

  return {
    userId: record.user_id,
    usageDate: record.usage_date,
    used,
    dailyLimit,
    remaining: Math.max(dailyLimit - used, 0),
  };
};

export async function getDailyUsage(userId: string): Promise<DailyUsage> {
  const supabase = getSupabaseClient();
  const today = getTodayDate();

  const { data, error } = await supabase
    .from(USAGE_TABLE)
    .select("user_id, usage_date, used, daily_limit")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (data) {
    return normalizeUsage(data);
  }

  const { data: inserted, error: insertError } = await supabase
    .from(USAGE_TABLE)
    .insert({
      user_id: userId,
      usage_date: today,
      used: 0,
      daily_limit: DEFAULT_DAILY_LIMIT,
    })
    .select("user_id, usage_date, used, daily_limit")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return getDailyUsage(userId);
    }
    throw insertError;
  }

  return normalizeUsage(inserted);
}

export async function recordGeneration(
  userId: string,
  amount = 1
): Promise<DailyUsage> {
  const supabase = getSupabaseClient();
  const currentUsage = await getDailyUsage(userId);

  if (currentUsage.used + amount > currentUsage.dailyLimit) {
    const limitError = new Error("DAILY_LIMIT_REACHED");
    (limitError as any).remaining = currentUsage.remaining;
    throw limitError;
  }

  const { data, error } = await supabase
    .from(USAGE_TABLE)
    .update({ used: currentUsage.used + amount })
    .eq("user_id", userId)
    .eq("usage_date", currentUsage.usageDate)
    .select("user_id, usage_date, used, daily_limit")
    .single();

  if (error) {
    throw error;
  }

  return normalizeUsage(data);
}
