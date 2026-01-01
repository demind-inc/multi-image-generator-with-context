/**
 * Database types for Supabase schema
 * These types match the exact structure of the database tables
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // uuid, primary key, references auth.users
          email: string | null;
          full_name: string | null;
          last_sign_in_at: string | null; // timestamptz
          has_generated_free_image: boolean | null; // default false
          created_at?: string | null; // timestamptz
        };
        Insert: {
          id: string; // uuid
          email?: string | null;
          full_name?: string | null;
          last_sign_in_at?: string | null; // timestamptz
          has_generated_free_image?: boolean | null; // default false
          created_at?: string | null; // timestamptz
        };
        Update: {
          id?: string; // uuid
          email?: string | null;
          full_name?: string | null;
          last_sign_in_at?: string | null; // timestamptz
          has_generated_free_image?: boolean | null;
          created_at?: string | null; // timestamptz
        };
      };
      usage_limits: {
        Row: {
          user_id: string; // uuid, references auth.users, part of primary key
          usage_date: string; // date, part of primary key
          used: number; // integer, default 0
          daily_limit: number; // integer, default 10
        };
        Insert: {
          user_id: string; // uuid
          usage_date: string; // date
          used?: number; // integer, default 0
          daily_limit?: number; // integer, default 10
        };
        Update: {
          user_id?: string; // uuid
          usage_date?: string; // date
          used?: number; // integer
          daily_limit?: number; // integer
        };
      };
      subscriptions: {
        Row: {
          user_id: string; // uuid, primary key, references auth.users
          is_active: boolean; // default false
          stripe_subscription_id: string | null; // text
          stripe_customer_id: string | null; // text
          current_period_end: string | null; // timestamptz
          created_at: string; // timestamptz, default now()
          updated_at: string; // timestamptz, default now()
        };
        Insert: {
          user_id: string; // uuid
          is_active?: boolean; // default false
          stripe_subscription_id?: string | null; // text
          stripe_customer_id?: string | null; // text
          current_period_end?: string | null; // timestamptz
          created_at?: string; // timestamptz, default now()
          updated_at?: string; // timestamptz, default now()
        };
        Update: {
          user_id?: string; // uuid
          is_active?: boolean;
          stripe_subscription_id?: string | null; // text
          stripe_customer_id?: string | null; // text
          current_period_end?: string | null; // timestamptz
          created_at?: string | null; // timestamptz
          updated_at?: string | null; // timestamptz
        };
      };
      reference_library: {
        Row: {
          id: string; // uuid, primary key
          user_id: string; // uuid, references auth.users
          label: string | null; // text, optional name
          data: string; // text, base64 image
          mime_type: string; // text, image mime type
          created_at: string; // timestamptz, default now()
        };
        Insert: {
          id?: string; // uuid
          user_id: string; // uuid
          label?: string | null; // text
          data: string; // text
          mime_type: string; // text
          created_at?: string; // timestamptz
        };
        Update: {
          id?: string; // uuid
          user_id?: string; // uuid
          label?: string | null; // text
          data?: string; // text
          mime_type?: string; // text
          created_at?: string | null; // timestamptz
        };
      };
      prompt_library: {
        Row: {
          id: string; // uuid, primary key
          user_id: string; // uuid, references auth.users
          title: string; // text
          prompt_text: string; // text
          created_at: string; // timestamptz, default now()
        };
        Insert: {
          id?: string; // uuid
          user_id: string; // uuid
          title: string; // text
          prompt_text: string; // text
          created_at?: string; // timestamptz
        };
        Update: {
          id?: string; // uuid
          user_id?: string; // uuid
          title?: string; // text
          prompt_text?: string; // text
          created_at?: string | null; // timestamptz
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Type aliases for easier access
export type ProfilesRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfilesInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfilesUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type UsageLimitsRow =
  Database["public"]["Tables"]["usage_limits"]["Row"];
export type UsageLimitsInsert =
  Database["public"]["Tables"]["usage_limits"]["Insert"];
export type UsageLimitsUpdate =
  Database["public"]["Tables"]["usage_limits"]["Update"];

export type SubscriptionsRow =
  Database["public"]["Tables"]["subscriptions"]["Row"];
export type SubscriptionsInsert =
  Database["public"]["Tables"]["subscriptions"]["Insert"];
export type SubscriptionsUpdate =
  Database["public"]["Tables"]["subscriptions"]["Update"];

export type ReferenceLibraryRow =
  Database["public"]["Tables"]["reference_library"]["Row"];
export type ReferenceLibraryInsert =
  Database["public"]["Tables"]["reference_library"]["Insert"];
export type ReferenceLibraryUpdate =
  Database["public"]["Tables"]["reference_library"]["Update"];

export type PromptLibraryRow =
  Database["public"]["Tables"]["prompt_library"]["Row"];
export type PromptLibraryInsert =
  Database["public"]["Tables"]["prompt_library"]["Insert"];
export type PromptLibraryUpdate =
  Database["public"]["Tables"]["prompt_library"]["Update"];
