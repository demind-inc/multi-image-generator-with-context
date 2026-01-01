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

   Ensure you have a `profiles` table with `id uuid primary key`, `email text`, `full_name text`, and `last_sign_in_at timestamptz`.

   Add a `usage_limits` table to track daily image generation limits:

   ```sql
   create table public.usage_limits (
     user_id uuid references auth.users not null,
     usage_date date not null,
     used integer not null default 0,
     daily_limit integer not null default 10,
     constraint usage_limits_pkey primary key (user_id, usage_date)
   );
   ```

   The app will read the `daily_limit` from this table and defaults to 10 generations per day when inserting the current day's row.

   Add a `subscriptions` table to track user subscription status:

   ```sql
   create table public.subscriptions (
     user_id uuid references auth.users not null primary key,
     is_active boolean not null default false,
     stripe_subscription_id text,
     stripe_customer_id text,
     current_period_end timestamptz,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   );
   ```

   The app will check this table to determine if a user has an active subscription. When a user completes payment, their subscription status is automatically updated in this table.

4. Connect Stripe subscription checkout ($20/month) for paid generations after the first image:

   ```bash
   STRIPE_SUBSCRIPTION_LINK=https://buy.stripe.com/your_subscription_link_here
   ```

   Create a Stripe Subscription Payment Link for $20/month and use its URL here. The app will show a paywall modal after the first successful image and direct users to this link. If you include `?paid=true` or `?session_id=...` in your return URL, the dashboard will automatically activate the subscription in the database.

5. Run the app:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The app will be available at `http://localhost:3300`
