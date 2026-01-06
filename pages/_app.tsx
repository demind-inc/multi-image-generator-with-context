import type { AppProps } from "next/app";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AuthProvider } from "../providers/AuthProvider";
import "../App.scss";
// Import page-level styles here (Next.js requires global CSS in _app.tsx)
import "./LandingPage.scss";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </AuthProvider>
  );
}
