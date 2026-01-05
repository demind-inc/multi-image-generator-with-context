import { getSupabaseClient } from "./supabaseClient";
import { AccountProfile } from "../types";
import type { Database } from "../database.types";

export async function getCurrentSession() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function upsertProfile(sessionUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): Promise<AccountProfile | null> {
  const supabase = getSupabaseClient();
  const full_name =
    (sessionUser.user_metadata?.full_name as string | undefined) ?? null;

  // Try with id as UUID first (standard Supabase pattern)
  let result = await supabase
    .from("profiles")
    .upsert(
      {
        id: sessionUser.id,
        email: sessionUser.email ?? null,
        full_name,
        last_sign_in_at: new Date().toISOString(),
      } as any,
      { onConflict: "id" }
    )
    .select()
    .single();

  // If id is bigint, try using user_id instead (fallback for different schema)
  if (
    result.error &&
    (result.error.message?.includes("bigint") ||
      result.error.message?.includes("invalid input syntax"))
  ) {
    // Use type assertion for fallback schema that may have user_id
    const fallbackData = {
      user_id: sessionUser.id,
      email: sessionUser.email ?? null,
      full_name,
      last_sign_in_at: new Date().toISOString(),
    } as any;

    result = await supabase
      .from("profiles")
      .upsert(fallbackData, { onConflict: "user_id" })
      .select()
      .single();
  }

  if (result.error) {
    console.error("Profile upsert error", result.error);
    console.error(
      "Make sure your profiles table has either:\n" +
        "1. id uuid primary key (references auth.users.id), OR\n" +
        "2. id bigint primary key (auto-increment) and user_id uuid (references auth.users.id)"
    );
    return null;
  }

  return result.data as AccountProfile;
}

export async function getHasGeneratedFreeImage(
  userId: string
): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("has_generated_free_image")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch has_generated_free_image:", error);
    return false;
  }

  return (
    (data as unknown as Database["public"]["Tables"]["profiles"]["Row"])
      ?.has_generated_free_image ?? false
  );
}

export async function setHasGeneratedFreeImage(
  userId: string,
  value: boolean
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await (supabase.from("profiles") as any)
    .update({ has_generated_free_image: value })
    .eq("id", userId);

  if (error) {
    // If update fails, try upsert instead
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        has_generated_free_image: value,
      } as any,
      { onConflict: "id" }
    );

    if (upsertError) {
      console.error("Failed to set has_generated_free_image:", upsertError);
      throw upsertError;
    }
  }
}
