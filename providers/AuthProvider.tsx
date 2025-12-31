import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { AuthStatus } from "../types";
import { signOut } from "../services/authService";
import { getSupabaseClient } from "../services/supabaseClient";

interface AuthContextType {
  session: Session | null;
  profile: User | null;
  authStatus: AuthStatus;
  authEmail: string;
  authPassword: string;
  authMessage: string | null;
  authError: string | null;
  isLoading: boolean;
  isSignUpMode: boolean;
  setAuthEmail: (email: string) => void;
  setAuthPassword: (password: string) => void;
  toggleAuthMode: () => void;
  signIn: (e: React.FormEvent) => Promise<void>;
  signUp: (e: React.FormEvent) => Promise<void>;
  signOut: () => Promise<void>;
  displayEmail: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(true); // Default to signup

  const displayEmail = profile?.email || session?.user?.email || "";

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      try {
        const supabase = getSupabaseClient();
        console.log("Supabase client initialized");

        // Promise to track when initial session is handled
        let resolveInitialSession: (() => void) | null = null;
        let initializationComplete = false;
        const initialSessionPromise = new Promise<void>((resolve) => {
          resolveInitialSession = resolve;
        });

        // Set up auth state change listener - this will fire immediately with current session
        // and handle auto-signin for persisted sessions. Supabase automatically restores
        // sessions from localStorage when persistSession is enabled.
        // It also fires when a user clicks the magic link and gets redirected back.
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log("Auth state changed:", event, newSession?.user?.email);

            // Handle initial session restoration and subsequent auth changes
            if (newSession?.user) {
              setSession(newSession);
              setProfile(newSession.user);
              setAuthStatus("signed_in");

              // Clear any auth messages when successfully signed in
              setAuthMessage(null);
              setAuthError(null);

              // Clear URL hash after processing the redirect
              if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                window.history.replaceState(
                  null,
                  "",
                  window.location.pathname + window.location.search
                );
              }
            } else {
              // Set to signed_out if no session
              // For INITIAL_SESSION with no user, we should set signed_out immediately
              if (
                initializationComplete ||
                event === "SIGNED_OUT" ||
                event === "INITIAL_SESSION"
              ) {
                setSession(null);
                setProfile(null);
                setAuthStatus("signed_out");
              }
            }

            // Mark initialization as complete after handling INITIAL_SESSION or first event
            if (
              !initializationComplete &&
              (event === "INITIAL_SESSION" ||
                event === "SIGNED_IN" ||
                event === "SIGNED_OUT")
            ) {
              initializationComplete = true;
              resolveInitialSession?.();
            }
          }
        );
        unsubscribe = () => authListener?.subscription.unsubscribe();

        // Wait for initial session to be handled (with timeout as fallback)
        await Promise.race([
          initialSessionPromise,
          new Promise((resolve) => setTimeout(resolve, 500)),
        ]);
      } catch (error) {
        console.error("Auth initialization error:", error);
        setAuthError(
          "Unable to connect to authentication. Check Supabase keys."
        );
        setAuthStatus("signed_out");
      }
    };

    initialize();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    setAuthError(null);

    if (!authEmail.trim()) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    if (!authPassword.trim()) {
      setAuthError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });

      if (error) {
        throw error;
      }

      // Update auth state immediately after successful sign in
      if (data.session?.user) {
        setSession(data.session);
        setProfile(data.session.user);
        setAuthStatus("signed_in");
        setAuthMessage(null);
        setAuthError(null);
      }
    } catch (error: any) {
      console.error("Sign-in error:", error);
      setAuthError(
        error.message || "Failed to sign in. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    setAuthError(null);

    if (!authEmail.trim()) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    if (!authPassword.trim()) {
      setAuthError("Please enter a password.");
      return;
    }

    if (authPassword.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
      });

      if (error) {
        throw error;
      }

      // Update auth state immediately after successful sign up
      if (data.session?.user) {
        setSession(data.session);
        setProfile(data.session.user);
        setAuthStatus("signed_in");
        setAuthMessage("Account created successfully! You are now signed in.");
        setAuthError(null);
      } else if (data.user) {
        // If session is null but user exists (email confirmation required)
        // Still set the user but keep status as signed_out until confirmed
        setProfile(data.user);
        setAuthMessage("Account created! Please check your email to confirm.");
      }
    } catch (error: any) {
      console.error("Sign-up error:", error);
      setAuthError(
        error.message || "Failed to create account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setAuthMessage(null);
    setAuthError(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setAuthMessage(null);
    } catch (error: any) {
      console.error("Sign-out error:", error);
      setAuthError(error.message || "Unable to sign out.");
    }
  };

  const value: AuthContextType = {
    session,
    profile,
    authStatus,
    authEmail,
    authPassword,
    authMessage,
    authError,
    isLoading,
    isSignUpMode,
    setAuthEmail,
    setAuthPassword,
    toggleAuthMode,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    displayEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
