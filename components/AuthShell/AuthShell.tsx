import React from "react";
import { AuthStatus } from "../../types";
import "./AuthShell.scss";

interface AuthShellProps {
  authEmail: string;
  authMessage: string | null;
  authError: string | null;
  authStatus: AuthStatus;
  isSendingLink: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const AuthShell: React.FC<AuthShellProps> = ({
  authEmail,
  authMessage,
  authError,
  authStatus,
  isSendingLink,
  onEmailChange,
  onSubmit,
}) => {
  return (
    <div className="auth-shell">
      <div className="auth-card card card--gradient">
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

        <h2 className="auth-card__title">Sign in or create an account</h2>
        <p className="auth-card__subtitle">
          Use your email to get a Supabase magic link. We will save your account details into
          the profiles table when you sign in.
        </p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="field-label" htmlFor="auth-email">
            Work email
          </label>
          <input
            id="auth-email"
            type="email"
            value={authEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@example.com"
            className="text-input"
            required
          />
          <button type="submit" className="primary-button" disabled={isSendingLink} style={{ width: "100%" }}>
            {isSendingLink ? "Sending link..." : "Send magic link"}
          </button>
        </form>

        {authMessage && <div className="auth-alert auth-alert--success">{authMessage}</div>}
        {authError && <div className="auth-alert auth-alert--error">{authError}</div>}
        {authStatus === "checking" && !authError && (
          <p className="helper-text" style={{ marginTop: "12px" }}>
            Checking your session...
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthShell;
