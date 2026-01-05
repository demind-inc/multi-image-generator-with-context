# API Documentation

This document explains how to access the backend API routes in this Next.js application.

## API Routes Overview

All API routes are located in `pages/api/` and are automatically exposed as endpoints:

- `GET /api/health` - Health check endpoint
- `POST /api/subscription/redirect` - Subscription activation
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Local Development

When running locally with `npm run dev`, the API is available at:

```
http://localhost:3300/api/*
```

### Example: Health Check

```bash
# Using curl
curl http://localhost:3300/api/health

# Using fetch in JavaScript
fetch('http://localhost:3300/api/health')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Example: Subscription Redirect

```bash
# Using curl
curl -X POST http://localhost:3300/api/subscription/redirect \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-here",
    "plan": "basic",
    "sessionId": "stripe-session-id-optional"
  }'
```

```javascript
// Using fetch in JavaScript
const response = await fetch(
  "http://localhost:3300/api/subscription/redirect",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: "user-id-here",
      plan: "basic",
      sessionId: "stripe-session-id-optional",
    }),
  }
);

const data = await response.json();
console.log(data);
```

## Production

When deployed to Vercel (or another hosting platform), the API routes are available at:

```
https://your-domain.com/api/*
```

For example:

- `https://your-app.vercel.app/api/health`
- `https://your-app.vercel.app/api/subscription/redirect`
- `https://your-app.vercel.app/api/webhooks/stripe`

## API Endpoints

### 1. Health Check

**Endpoint:** `GET /api/health`

**Description:** Simple health check to verify the API is running.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "environment": "development"
}
```

**Example:**

```bash
curl http://localhost:3300/api/health
```

---

### 2. Subscription Redirect

**Endpoint:** `POST /api/subscription/redirect`

**Description:** Activates a user's subscription after payment.

**Request Body:**

```json
{
  "userId": "string (required)",
  "plan": "basic" | "pro" | "business" (optional, defaults to "basic"),
  "sessionId": "string (optional - Stripe session ID)"
}
```

**Success Response:**

```json
{
  "success": true,
  "subscription": {
    "userId": "user-id",
    "isActive": true,
    "planType": "basic",
    "stripeSubscriptionId": "sub_xxx",
    "stripeCustomerId": "cus_xxx"
  }
}
```

**Error Response:**

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

**Example:**

```javascript
const response = await fetch("/api/subscription/redirect", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    userId: session.user.id,
    plan: "basic",
    sessionId: "cs_test_xxx",
  }),
});

if (response.ok) {
  const result = await response.json();
  console.log("Subscription activated:", result);
} else {
  const error = await response.json();
  console.error("Error:", error);
}
```

---

### 3. Stripe Webhook

**Endpoint:** `POST /api/webhooks/stripe`

**Description:** Handles Stripe webhook events for subscription management.

**Note:** This endpoint should be configured in your Stripe Dashboard to receive webhook events.

**Stripe Configuration:**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` environment variable

**Response:**

```json
{
  "received": true
}
```

---

## Testing APIs

### Using curl

```bash
# Health check
curl http://localhost:3300/api/health

# Subscription redirect (replace with actual values)
curl -X POST http://localhost:3300/api/subscription/redirect \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-id","plan":"basic"}'
```

### Using Postman or Insomnia

1. Create a new request
2. Set method (GET for health, POST for others)
3. Set URL: `http://localhost:3300/api/endpoint-name`
4. For POST requests, add JSON body in the Body tab
5. Set Content-Type header to `application/json`

### Using JavaScript/TypeScript

```typescript
// Health check
const healthCheck = async () => {
  const response = await fetch("/api/health");
  const data = await response.json();
  return data;
};

// Subscription activation
const activateSubscription = async (
  userId: string,
  plan: string,
  sessionId?: string
) => {
  const response = await fetch("/api/subscription/redirect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      plan,
      sessionId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to activate subscription");
  }

  return await response.json();
};
```

---

## Environment Variables

Make sure these environment variables are set:

**For API routes (server-side):**

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

**For client-side (optional):**

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL (if needed on client)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (if needed on client)

---

## CORS and External Access

By default, Next.js API routes can be accessed from:

- Same origin (your frontend)
- Any origin (unless you add CORS restrictions)

To restrict access, you can add CORS middleware or authentication checks in your API routes.

---

## Notes

- All API routes run server-side only
- Environment variables without `NEXT_PUBLIC_` prefix are only available in API routes
- API routes automatically handle TypeScript compilation
- On Vercel, API routes are deployed as serverless functions
