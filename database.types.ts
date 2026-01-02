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
          id: string; // uuid, primary key, FOREIGN KEY references auth.users(id)
          email: string | null;
          full_name: string | null;
          last_sign_in_at: string | null; // timestamptz
          has_generated_free_image: boolean | null; // default false
          created_at?: string | null; // timestamptz
        };
        Insert: {
          id: string; // uuid, FOREIGN KEY references auth.users(id)
          email?: string | null;
          full_name?: string | null;
          last_sign_in_at?: string | null; // timestamptz
          has_generated_free_image?: boolean | null; // default false
          created_at?: string | null; // timestamptz
        };
        Update: {
          id?: string; // uuid, FOREIGN KEY references auth.users(id)
          email?: string | null;
          full_name?: string | null;
          last_sign_in_at?: string | null; // timestamptz
          has_generated_free_image?: boolean | null;
          created_at?: string | null; // timestamptz
        };
      };
      usage_limits: {
        Row: {
          user_id: string; // uuid, FOREIGN KEY references auth.users(id), part of primary key
          period_start: string; // date (first day of month), part of primary key
          used: number; // integer, default 0
          monthly_limit: number; // integer, monthly credit allotment, default 60
        };
        Insert: {
          user_id: string; // uuid, FOREIGN KEY references auth.users(id)
          period_start: string; // date (first day of month)
          used?: number; // integer, default 0
          monthly_limit?: number; // integer, monthly credit allotment, default 60
        };
        Update: {
          user_id?: string; // uuid, FOREIGN KEY references auth.users(id)
          period_start?: string; // date (first day of month)
          used?: number; // integer
          monthly_limit?: number; // integer, monthly credit allotment
        };
      };
      subscriptions: {
        Row: {
          user_id: string; // uuid, primary key, FOREIGN KEY references auth.users(id)
          is_active: boolean; // default false
          plan_type: string | null; // text, one of basic/pro/business
          stripe_subscription_id: string | null; // text
          stripe_customer_id: string | null; // text
          current_period_end: string | null; // timestamptz
          created_at: string; // timestamptz, default now()
          updated_at: string; // timestamptz, default now()
        };
        Insert: {
          user_id: string; // uuid, FOREIGN KEY references auth.users(id)
          is_active?: boolean; // default false
          plan_type?: string | null; // text
          stripe_subscription_id?: string | null; // text
          stripe_customer_id?: string | null; // text
          current_period_end?: string | null; // timestamptz
          created_at?: string; // timestamptz, default now()
          updated_at?: string; // timestamptz, default now()
        };
        Update: {
          user_id?: string; // uuid, FOREIGN KEY references auth.users(id)
          is_active?: boolean;
          plan_type?: string | null; // text
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
          user_id: string; // uuid, FOREIGN KEY references auth.users(id)
          set_id: string; // uuid, groups multiple images into a set
          label: string | null; // text, optional name (set name, shared across images in set)
          file_path: string; // text, path to file in Supabase Storage
          mime_type: string; // text, image mime type
          created_at: string; // timestamptz, default now()
        };
        Insert: {
          id?: string; // uuid
          user_id: string; // uuid, FOREIGN KEY references auth.users(id)
          set_id: string; // uuid, groups multiple images into a set
          label?: string | null; // text
          file_path: string; // text, path to file in Supabase Storage
          mime_type: string; // text
          created_at?: string; // timestamptz
        };
        Update: {
          id?: string; // uuid
          user_id?: string; // uuid, FOREIGN KEY references auth.users(id)
          set_id?: string; // uuid
          label?: string | null; // text
          file_path?: string; // text
          mime_type?: string; // text
          created_at?: string | null; // timestamptz
        };
      };
      prompt_library: {
        Row: {
          id: string; // uuid, primary key
          user_id: string; // uuid, FOREIGN KEY references auth.users(id)
          title: string; // text
          prompt_text: string; // text
          created_at: string; // timestamptz, default now()
        };
        Insert: {
          id?: string; // uuid
          user_id: string; // uuid, FOREIGN KEY references auth.users(id)
          title: string; // text
          prompt_text: string; // text
          created_at?: string; // timestamptz
        };
        Update: {
          id?: string; // uuid
          user_id?: string; // uuid, FOREIGN KEY references auth.users(id)
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
