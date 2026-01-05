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

4. Configure Stripe for subscription checkout:

   ```bash
   # Stripe API Keys
   STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
   STRIPE_WEBHOOK_SECRET=whsec_... (optional, but recommended for production)

   # Stripe Price IDs (required for Checkout Sessions API)
   # Get these from Stripe Dashboard → Products → select product → select price → Price ID (starts with price_)
   STRIPE_PRICE_ID_BASIC=price_xxxxx
   STRIPE_PRICE_ID_PRO=price_xxxxx
   STRIPE_PRICE_ID_BUSINESS=price_xxxxx

   # Optional: Base URL for checkout redirects (defaults to VERCEL_URL or localhost:3000)
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com

   # Legacy: Payment Links (optional, used as fallback if Price IDs not set)
   STRIPE_LINK_BASIC=https://buy.stripe.com/basic_payment_link
   STRIPE_LINK_PRO=https://buy.stripe.com/pro_payment_link
   STRIPE_LINK_BUSINESS=https://buy.stripe.com/business_payment_link
   ```

   **Getting Stripe Price IDs:**

   1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Products
   2. Select your product (or create one for each plan: Basic, Pro, Business)
   3. Click on the price you want to use
   4. Copy the Price ID (starts with `price_`)
   5. Add it to the corresponding environment variable

   The app uses Stripe Checkout Sessions API to create payment links dynamically with metadata. The subscription redirect page will automatically sync the subscription data from Stripe and activate it.

5. **Backend Server Configuration (Next.js API Routes):**

   The app uses Next.js API routes (automatically deployed as Vercel serverless functions). The backend handles:

   - Creating Stripe Checkout Sessions (`/api/subscription/checkout`)
   - Syncing subscription data after payment (`/api/subscription/sync`)
   - Canceling subscriptions (`/api/subscription/cancel`)
   - Stripe webhook events (`/api/webhooks/stripe`) - for ongoing subscription events
   - Health check endpoint (`/api/health`)

   **Environment Variables for Backend (set in Vercel Dashboard):**

   ```bash
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_ROLE_KEY=your_supabase_service_role_key  # Required for backend operations

   # Stripe
   STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
   STRIPE_WEBHOOK_SECRET=whsec_... (get from Stripe Dashboard → Webhooks)
   STRIPE_PRICE_ID_BASIC=price_xxxxx
   STRIPE_PRICE_ID_PRO=price_xxxxx
   STRIPE_PRICE_ID_BUSINESS=price_xxxxx
   STRIPE_WEBHOOK_SECRET=xxxxx

   # Optional
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com  # For checkout redirect URLs
   ```

   **Setting up Stripe Webhook:**

   1. Go to your Stripe Dashboard → Developers → Webhooks
   2. Click "Add endpoint"
   3. Set the endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
   4. Select the following events to listen to:
      - `checkout.session.completed`
      - `customer.subscription.updated`
      - `customer.subscription.deleted`
      - `invoice.payment_succeeded`
      - `invoice.payment_failed`
   5. Copy the webhook signing secret and add it to `STRIPE_WEBHOOK_SECRET` in Vercel

   **Note:** The backend uses Supabase Service Role Key (not the anon key) to bypass RLS and update subscriptions. Make sure to set `SUPABASE_SERVICE_ROLE_KEY` in your Vercel environment variables.

6. **Deploy to Vercel:**

   The project is now a Next.js application with API routes. Vercel has first-class support for Next.js!

   **Option 1: Using Vercel CLI**

   ```bash
   # Install Vercel CLI globally
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Deploy (follow the prompts)
   vercel

   # Deploy to production
   vercel --prod
   ```

   **Option 2: Using Vercel Dashboard**

   1. Push your code to GitHub/GitLab/Bitbucket
   2. Go to [vercel.com](https://vercel.com) and sign in
   3. Click "New Project"
   4. Import your repository
   5. Vercel will automatically detect it's a Next.js project
   6. Configure environment variables (see below)
   7. Click "Deploy"

   **Note**: Vercel automatically detects Next.js and configures everything. No additional setup needed!

   **Required Environment Variables in Vercel:**

   Set these in your Vercel project settings (Settings → Environment Variables):

   ```bash
   # Frontend (for build)
   GEMINI_API_KEY=your_gemini_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com  # Optional, for checkout redirects

   # Backend API (for serverless functions)
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
   STRIPE_WEBHOOK_SECRET=whsec_... (optional but recommended)
   STRIPE_PRICE_ID_BASIC=price_xxxxx
   STRIPE_PRICE_ID_PRO=price_xxxxx
   STRIPE_PRICE_ID_BUSINESS=price_xxxxx

   # Legacy: Payment Links (optional, used as fallback)
   STRIPE_LINK_BASIC=https://buy.stripe.com/basic_payment_link
   STRIPE_LINK_PRO=https://buy.stripe.com/pro_payment_link
   STRIPE_LINK_BUSINESS=https://buy.stripe.com/business_payment_link
   ```

   **Important Notes:**

   - The `/pages/api` directory contains Next.js API routes that Vercel will automatically deploy as serverless functions
   - API routes are available at: `https://yourdomain.com/api/*`
   - Make sure to set environment variables for both Production and Preview environments if needed
   - Next.js API routes automatically use Node.js runtime on Vercel

7. Run the app locally:
   ```bash
   npm install
   npm run dev
   # or
   yarn install
   yarn dev
   ```

The app will be available at `http://localhost:3300`

**Note**: This project has been migrated from Vite to Next.js. See `MIGRATION.md` for details about the changes.
