import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../providers/AuthProvider";
import { SubscriptionPlan } from "../types";
import { getSubscription } from "../services/subscriptionService";
import { getMonthlyUsage } from "../services/usageService";

const POLL_INTERVAL_MS = 1000; // Poll every 1 second
const FALLBACK_TIMEOUT_MS = 15000; // 15 seconds total

const SubscriptionRedirectPage: React.FC = () => {
  const { session, authStatus } = useAuth();
  const router = useRouter();
  const { paid, plan: urlPlan, session_id } = router.query;
  const [status, setStatus] = useState<
    "processing" | "success" | "error" | "unauthorized"
  >("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [planType, setPlanType] = useState<SubscriptionPlan | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Redirect to auth if not signed in
    if (authStatus === "signed_out") {
      router.replace("/auth");
      return;
    }

    // Wait for auth check or router to be ready
    if (authStatus === "checking" || !session?.user?.id || !router.isReady) {
      return;
    }

    const fetchSubscriptionWithFallback = async () => {
      startTimeRef.current = Date.now();

      const pollSubscription = async (): Promise<void> => {
        try {
          const subscription = await getSubscription(session.user.id);

          // Check if subscription is active
          if (subscription?.isActive) {
            // Success! Subscription found and active
            setPlanType(subscription.planType || null);
            setStatus("success");

            // Refresh usage to reflect new subscription
            if (subscription.planType) {
              await getMonthlyUsage(session.user.id, subscription.planType);
            }

            // Redirect to dashboard after showing success message
            setTimeout(() => {
              router.replace("/dashboard");
            }, 3000);
            return;
          }

          // Check if we've exceeded the fallback timeout
          const elapsed = Date.now() - (startTimeRef.current || 0);
          if (elapsed >= FALLBACK_TIMEOUT_MS) {
            // Timeout reached - show error
            setStatus("error");
            setErrorMessage(
              "Subscription not found. Please check your payment status or contact support."
            );
            setTimeout(() => {
              router.replace("/dashboard");
            }, 5000);
            return;
          }

          // Continue polling
          pollTimeoutRef.current = setTimeout(
            pollSubscription,
            POLL_INTERVAL_MS
          );
        } catch (error: any) {
          console.error("Error fetching subscription:", error);

          // Check if we've exceeded the fallback timeout
          const elapsed = Date.now() - (startTimeRef.current || 0);
          if (elapsed >= FALLBACK_TIMEOUT_MS) {
            // Timeout reached - show error
            setStatus("error");
            setErrorMessage(
              error.message ||
                "Failed to fetch subscription. Please contact support."
            );
            setTimeout(() => {
              router.replace("/dashboard");
            }, 5000);
            return;
          }

          // Continue polling even on error (might be transient)
          pollTimeoutRef.current = setTimeout(
            pollSubscription,
            POLL_INTERVAL_MS
          );
        }
      };

      // Start polling
      pollSubscription();
    };

    // Check for payment confirmation parameters
    const paidFlag = paid === "1" || paid === "true" || session_id;

    if (!paidFlag) {
      setStatus("error");
      setErrorMessage("No payment confirmation found.");
      setTimeout(() => {
        router.replace("/dashboard");
      }, 3000);
      return;
    }

    // Get plan from URL if available (for display purposes)
    const plan: SubscriptionPlan | null =
      urlPlan &&
      typeof urlPlan === "string" &&
      ["basic", "pro", "business"].includes(urlPlan)
        ? (urlPlan as SubscriptionPlan)
        : null;

    if (plan) {
      setPlanType(plan);
    }

    // Start fetching subscription
    fetchSubscriptionWithFallback();

    // Cleanup function to clear timeout on unmount
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [authStatus, session?.user?.id, router, paid, urlPlan, session_id]);

  // Show loading state while checking auth
  if (authStatus === "checking") {
    return (
      <div className="subscription-redirect">
        <div className="subscription-redirect__content">
          <div className="subscription-redirect__spinner" />
          <p>Checking your session...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized state
  if (authStatus === "signed_out") {
    return (
      <div className="subscription-redirect">
        <div className="subscription-redirect__content">
          <div className="subscription-redirect__icon subscription-redirect__icon--error">
            ⚠️
          </div>
          <h2>Authentication Required</h2>
          <p>Please sign in to complete your subscription.</p>
          <button
            className="primary-button"
            onClick={() => router.replace("/auth")}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-redirect">
      <div className="subscription-redirect__content">
        {status === "processing" && (
          <>
            <div className="subscription-redirect__spinner" />
            <h2>Activating Your Subscription</h2>
            <p>Please wait while we activate your subscription...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="subscription-redirect__icon subscription-redirect__icon--success">
              ✓
            </div>
            <h2>Subscription Activated!</h2>
            <p>
              Your {planType ? planType.toUpperCase() : ""} plan has been
              successfully activated.
            </p>
            <p className="subscription-redirect__redirect">
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="subscription-redirect__icon subscription-redirect__icon--error">
              ✕
            </div>
            <h2>Activation Failed</h2>
            <p>
              {errorMessage ||
                "An error occurred while activating your subscription."}
            </p>
            <p className="subscription-redirect__redirect">
              Redirecting to dashboard...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionRedirectPage;
