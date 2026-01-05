# Deployment Guide for Vercel

This guide explains how to deploy the multi-image generator app with backend API to Vercel.

## Project Structure

The project is configured as a Next.js application with API routes:

```
/
├── pages/
│   ├── api/               # Next.js API routes (Vercel Functions)
│   │   ├── health.ts      # GET /api/health
│   │   ├── subscription/
│   │   │   └── redirect.ts # POST /api/subscription/redirect
│   │   └── webhooks/
│   │       └── stripe.ts  # POST /api/webhooks/stripe
│   ├── _app.tsx           # Next.js app wrapper
│   ├── index.tsx          # Landing page (/)
│   ├── auth.tsx           # Auth page (/auth)
│   ├── dashboard.tsx      # Dashboard (/dashboard)
│   └── subscription/
│       └── redirect.tsx   # Subscription redirect (/subscription/redirect)
├── next.config.js         # Next.js configuration
├── vercel.json            # Vercel configuration (optional)
└── ...
```

## Quick Deploy

### Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Using Vercel Dashboard

1. Push code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Vercel auto-detects Next.js configuration
6. Add environment variables (see below)
7. Click "Deploy"

**Note**: Vercel has first-class support for Next.js, so no additional configuration is needed!

## Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

### Frontend Build Variables

These are used during the build process:

```bash
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_LINK_BASIC=https://buy.stripe.com/basic_payment_link
STRIPE_LINK_PRO=https://buy.stripe.com/pro_payment_link
STRIPE_LINK_BUSINESS=https://buy.stripe.com/business_payment_link
```

### Backend API Variables

These are used by serverless functions at runtime:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key  # Important: Use service role key, not anon key
STRIPE_SECRET_KEY=sk_live_...  # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from Stripe Dashboard → Webhooks
```

**Important:**

- `SUPABASE_SERVICE_ROLE_KEY` is required for backend operations (bypasses RLS)
- Set variables for Production, Preview, and Development environments as needed

## API Endpoints

After deployment, your API endpoints will be available at:

- `https://yourdomain.com/api/health` - Health check
- `https://yourdomain.com/api/subscription/redirect` - Subscription activation
- `https://yourdomain.com/api/webhooks/stripe` - Stripe webhook handler

## Stripe Webhook Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret
6. Add it to `STRIPE_WEBHOOK_SECRET` in Vercel environment variables

## How Next.js API Routes Work

Next.js automatically:

- Detects API route files in `/pages/api` directory
- Compiles TypeScript to JavaScript
- Creates serverless functions for each route
- Maps file paths to API routes:
  - `pages/api/health.ts` → `/api/health`
  - `pages/api/subscription/redirect.ts` → `/api/subscription/redirect`
  - `pages/api/webhooks/stripe.ts` → `/api/webhooks/stripe`

Vercel automatically detects Next.js projects and handles all the deployment configuration.

## Testing Locally

You can test serverless functions locally using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Run development server
vercel dev
```

This will:

- Start the frontend dev server
- Run serverless functions locally
- Use environment variables from `.env.local`

## Troubleshooting

### Functions not working

- Check that files are in `/api` directory
- Verify files export a default function
- Check Vercel function logs in dashboard
- Ensure environment variables are set correctly

### TypeScript errors

- Vercel automatically compiles TypeScript
- Make sure `tsconfig.json` is configured correctly
- Check build logs in Vercel dashboard

### Environment variables not available

- Variables must be set in Vercel Dashboard
- Re-deploy after adding new variables
- Check variable names match exactly (case-sensitive)

## Build Configuration

Next.js handles everything automatically:

- Build command: `next build` (auto-detected)
- Framework: `nextjs` (auto-detected)
- TypeScript compilation: Built into Next.js
- API routes: Automatically deployed as serverless functions

The `vercel.json` file is optional and only needed for custom configuration. For most Next.js projects, Vercel auto-detects everything!
