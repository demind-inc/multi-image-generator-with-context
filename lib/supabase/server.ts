import { createServerClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for server-side API routes
 * Uses service role key to bypass RLS policies for backend operations
 *
 * @returns Supabase client configured for SSR
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ROLE_KEY."
    );
  }

  // Create server client with service role key to bypass RLS policies
  // For API routes without cookie handling, we provide no-op cookie handlers
  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get() {
        return undefined;
      },
      set() {
        // No-op for API routes
      },
      remove() {
        // No-op for API routes
      },
    },
  });
}
