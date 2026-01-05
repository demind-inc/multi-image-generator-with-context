import React from "react";
import { AuthStatus } from "../../types";
import styles from "./AuthShell.module.scss";

interface AuthShellProps {
  authEmail: string;
  authPassword: string;
  authMessage: string | null;
  authError: string | null;
  authStatus: AuthStatus;
  isLoading: boolean;
  isSignUpMode: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onToggleAuthMode: () => void;
  onSignIn: (event: React.FormEvent<HTMLFormElement>) => void;
  onSignUp: (event: React.FormEvent<HTMLFormElement>) => void;
}

const AuthShell: React.FC<AuthShellProps> = ({
  authEmail,
  authPassword,
  authMessage,
  authError,
  authStatus,
  isLoading,
  isSignUpMode,
  onEmailChange,
  onPasswordChange,
  onToggleAuthMode,
  onSignIn,
  onSignUp,
}) => {
  return (
    <div className={styles["auth-shell"]}>
      <div className={`${styles["auth-card"]} card card--gradient`}>
        <div className="brand">
          <div className="brand__icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="brand__title">NanoGen AI</h1>
        </div>

        <h2 className={styles["auth-card__title"]}>
          {isSignUpMode ? "Create your account" : "Sign in to your account"}
        </h2>
        <p className={styles["auth-card__subtitle"]}>
          {isSignUpMode
            ? "Enter your email and password to create an account. We will save your account details into the profiles table when you sign up."
            : "Enter your email and password to sign in. We will save your account details into the profiles table when you sign in."}
        </p>

        <form
          className={styles["auth-form"]}
          onSubmit={isSignUpMode ? onSignUp : onSignIn}
        >
          <label className="label" htmlFor="auth-email">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            value={authEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@example.com"
            className="input"
            required
            autoComplete="email"
          />
          <label
            className="label"
            htmlFor="auth-password"
            style={{ marginTop: "16px" }}
          >
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            value={authPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder={
              isSignUpMode
                ? "Create a password (min. 6 characters)"
                : "Enter your password"
            }
            className="input"
            required
            autoComplete={isSignUpMode ? "new-password" : "current-password"}
            minLength={6}
          />
          <button
            type="submit"
            className="primary-button"
            disabled={isLoading}
            style={{ width: "100%", marginTop: "16px" }}
          >
            {isLoading
              ? isSignUpMode
                ? "Creating account..."
                : "Signing in..."
              : isSignUpMode
              ? "Sign up"
              : "Sign in"}
          </button>
        </form>

        <div style={{ marginTop: "16px", textAlign: "center" }}>
          {isSignUpMode ? (
            <p className="text text--helper">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onToggleAuthMode}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  font: "inherit",
                }}
              >
                Sign in
              </button>
            </p>
          ) : (
            <p className="text text--helper">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onToggleAuthMode}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  font: "inherit",
                }}
              >
                Sign up
              </button>
            </p>
          )}
        </div>

        {authMessage && (
          <div className={`${styles["auth-alert"]} ${styles["auth-alert--success"]}`}>{authMessage}</div>
        )}
        {authError && (
          <div className={`${styles["auth-alert"]} ${styles["auth-alert--error"]}`}>{authError}</div>
        )}
        {authStatus === "checking" && !authError && (
          <p className="text text--helper" style={{ marginTop: "12px" }}>
            Checking your session...
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthShell;
