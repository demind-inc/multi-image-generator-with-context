import { getSupabaseClient } from "./supabaseClient";
import { AccountProfile } from "../types";

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

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: sessionUser.id,
        email: sessionUser.email ?? null,
        full_name,
        last_sign_in_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Profile upsert error", error);
    return null;
  }

  return data as AccountProfile;
}
