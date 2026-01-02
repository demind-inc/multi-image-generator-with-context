<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1_OMZ0ZGdgsH2MdvJO7Z08fxJztPjrbSx

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

2. Create a `.env` file in the root directory and add your Gemini API key:

   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

   Get your API key from: https://ai.google.dev/

3. Add your Supabase project keys for authentication and the `profiles` table:

   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Ensure you have a `profiles` table with `id uuid primary key`, `email text`, `full_name text`, `last_sign_in_at timestamptz`, and `has_generated_free_image boolean default false`:

   ```sql
   create table public.profiles (
     id uuid references auth.users not null primary key,
     email text,
     full_name text,
     last_sign_in_at timestamptz,
     has_generated_free_image boolean default false,
     created_at timestamptz default now()
   );
   ```

   Add a `usage_limits` table to track monthly image credits (1 credit = 1 image):

   ```sql
   create table public.usage_limits (
     user_id uuid references auth.users not null,
     period_start date not null,
     used integer not null default 0,
     monthly_limit integer not null default 60,
     constraint usage_limits_pkey primary key (user_id, period_start)
   );
   ```

   The app reads `monthly_limit` as the monthly credit balance and defaults to 60 credits when inserting the current month's row (using the first day of the month as the period key).

   Add a `subscriptions` table to track user subscription status:

   ```sql
   create table public.subscriptions (
     user_id uuid references auth.users not null primary key,
     is_active boolean not null default false,
     plan_type text check (plan_type in ('basic','pro','business')),
     stripe_subscription_id text,
     stripe_customer_id text,
     current_period_end timestamptz,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   );
   ```

   The app will check this table to determine if a user has an active subscription. When a user completes payment, their subscription status is automatically updated in this table.

   Credit defaults per plan are:

   - basic: 60 credits/month
   - pro: 180 credits/month
   - business: 600 credits/month

   Add tables to store saved reference images and prompt presets:

   ```sql
   create table public.reference_library (
     id uuid primary key default uuid_generate_v4(),
     user_id uuid references auth.users not null,
     set_id uuid not null,
     label text,
     file_path text not null,
     mime_type text not null,
     created_at timestamptz not null default now()
   );

   -- Create index on set_id for faster grouping queries
   create index idx_reference_library_set_id on public.reference_library(set_id);
   ```

   **Create Supabase Storage bucket for reference images:**

   1. Go to your Supabase project dashboard → Storage
   2. Create a new bucket named `reference-images`
   3. Keep it **private** (the app uses signed URLs for secure access)
   4. Run the SQL file `supabase-storage-setup.sql` in your Supabase SQL editor to set up storage policies, or copy and paste the contents of that file.

   create table public.prompt_library (
   id uuid primary key default uuid_generate_v4(),
   user_id uuid references auth.users not null,
   title text not null,
   prompt_text text not null,
   created_at timestamptz not null default now()
   );

   ```

   **Important:** Enable Row-Level Security (RLS) and create policies for all tables. Run the SQL file `supabase-rls-policies.sql` in your Supabase SQL editor, or copy and paste the contents of that file.

   ```

4. Connect Stripe subscription checkout links per plan:

   ```bash
   STRIPE_LINK_BASIC=https://buy.stripe.com/basic_payment_link
   STRIPE_LINK_PRO=https://buy.stripe.com/pro_payment_link
   STRIPE_LINK_BUSINESS=https://buy.stripe.com/business_payment_link
   STRIPE_SECRET_KEY=SECRET_KEY
   ```

   Create Stripe Payment Links for each plan price and drop them into these env vars. The paywall modal will pick the correct link based on the selected plan. If you include `?paid=true` or `?session_id=...` in your return URL, the dashboard will automatically activate the subscription in the database.

5. Run the app:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The app will be available at `http://localhost:3300`
