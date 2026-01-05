# Migration to Next.js

This project has been migrated from Vite + React Router to Next.js with Vercel Functions.

## What Changed

### 1. Framework Migration
- **Before**: Vite + React Router
- **After**: Next.js 14 with App Router

### 2. API Routes
- **Before**: Custom API files in `/api` directory
- **After**: Next.js API routes in `/pages/api` directory
  - `/pages/api/health.ts` - Health check endpoint
  - `/pages/api/subscription/redirect.ts` - Subscription activation
  - `/pages/api/webhooks/stripe.ts` - Stripe webhook handler

### 3. Routing
- **Before**: React Router (`react-router-dom`)
- **After**: Next.js file-based routing
  - `/pages/index.tsx` → `/`
  - `/pages/auth.tsx` → `/auth`
  - `/pages/dashboard.tsx` → `/dashboard`
  - `/pages/subscription/redirect.tsx` → `/subscription/redirect`

### 4. Configuration Files
- **Removed**: `vite.config.ts`, `App.tsx`, `index.tsx`
- **Added**: `next.config.js`, `pages/_app.tsx`
- **Updated**: `package.json`, `tsconfig.json`, `vercel.json`

## API Routes

All API routes are now Next.js API routes using `NextApiRequest` and `NextApiResponse`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handler logic
}
```

## Environment Variables

Environment variables work the same way, but Next.js uses:
- `.env.local` for local development
- Vercel Dashboard for production

## Running Locally

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`

## Deployment

Vercel automatically detects Next.js projects. Simply:

1. Push to GitHub/GitLab/Bitbucket
2. Import to Vercel
3. Vercel will auto-detect Next.js and configure everything

No additional configuration needed!

## Benefits

1. **Better API Integration**: Native Next.js API routes
2. **Automatic Optimization**: Next.js optimizations out of the box
3. **Simpler Deployment**: Vercel has first-class Next.js support
4. **Type Safety**: Full TypeScript support for API routes
5. **Better Performance**: Server-side rendering and static generation options
