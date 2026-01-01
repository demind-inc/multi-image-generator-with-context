import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    root: ".",
    server: {
      port: 3300,
      host: "0.0.0.0",
    },
    plugins: [react()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.SUPABASE_URL": JSON.stringify(env.SUPABASE_URL),
      "process.env.SUPABASE_ANON_KEY": JSON.stringify(env.SUPABASE_ANON_KEY),
      "process.env.STRIPE_SUBSCRIPTION_LINK": JSON.stringify(
        env.STRIPE_SUBSCRIPTION_LINK
      ),
      "import.meta.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "import.meta.env.SUPABASE_URL": JSON.stringify(env.SUPABASE_URL),
      "import.meta.env.SUPABASE_ANON_KEY": JSON.stringify(
        env.SUPABASE_ANON_KEY
      ),
      "import.meta.env.STRIPE_SUBSCRIPTION_LINK": JSON.stringify(
        env.STRIPE_SUBSCRIPTION_LINK
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
