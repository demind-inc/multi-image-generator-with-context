import type { AppProps } from "next/app";
import { AuthProvider } from "../providers/AuthProvider";
import "../App.scss";
// Import page-level styles here (Next.js requires global CSS in _app.tsx)
import "./LandingPage.scss";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
