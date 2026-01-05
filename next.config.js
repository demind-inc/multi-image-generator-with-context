/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Note: For client-side access, use NEXT_PUBLIC_ prefix in .env.local
  // The env property here makes server-side env vars available to client
  env: {
    SUPABASE_URL:
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY:
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    STRIPE_LINK_BASIC:
      process.env.STRIPE_LINK_BASIC ||
      process.env.NEXT_PUBLIC_STRIPE_LINK_BASIC,
    STRIPE_LINK_PRO:
      process.env.STRIPE_LINK_PRO || process.env.NEXT_PUBLIC_STRIPE_LINK_PRO,
    STRIPE_LINK_BUSINESS:
      process.env.STRIPE_LINK_BUSINESS ||
      process.env.NEXT_PUBLIC_STRIPE_LINK_BUSINESS,
  },
};

module.exports = nextConfig;
