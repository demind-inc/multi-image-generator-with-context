import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../providers/AuthProvider";
import { SubscriptionPlan } from "../types";
import { getMonthlyUsage } from "../services/usageService";
import { trackSubscriptionCompleted } from "../lib/analytics";
import styles from "./SubscriptionRedirectPage.module.scss";

const SubscriptionRedirectPage: React.FC = () => {
  const { session, authStatus } = useAuth();
  const router = useRouter();
  const { paid, plan: urlPlan, session_id } = router.query;
  const [status, setStatus] = useState<
    "processing" | "success" | "error" | "unauthorized"
  >("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [planType, setPlanType] = useState<SubscriptionPlan | null>(null);

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

    // Sync subscription data from Stripe
    const syncSubscription = async () => {
      if (!session_id || typeof session_id !== "string") {
        setStatus("error");
        setErrorMessage("Invalid session ID.");
        setTimeout(() => {
          router.replace("/dashboard");
        }, 3000);
        return;
      }

      try {
        const response = await fetch("/api/subscription/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: session_id,
            userId: session.user.id,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          setStatus("error");
          setErrorMessage(
            error.error ||
              "Failed to sync subscription. Please contact support."
          );
          setTimeout(() => {
            router.replace("/dashboard");
          }, 5000);
          return;
        }

        const result = await response.json();
        const syncedSubscription = result.subscription;

        // Success! Subscription synced
        const finalPlan = syncedSubscription.plan_type || plan;
        setPlanType(finalPlan);
        setStatus("success");

        // Track successful subscription completion
        if (finalPlan) {
          // Map plan to price for tracking
          const planPrices: Record<SubscriptionPlan, number> = {
            basic: 9,
            pro: 29,
            business: 79,
          };
          trackSubscriptionCompleted(
            finalPlan as SubscriptionPlan,
            planPrices[finalPlan as SubscriptionPlan]
          );
        }

        // Refresh usage to reflect new subscription
        if (syncedSubscription.plan_type) {
          await getMonthlyUsage(
            session.user.id,
            syncedSubscription.plan_type as SubscriptionPlan
          );
        }

        // Redirect to dashboard after showing success message
        setTimeout(() => {
          router.replace("/dashboard");
        }, 3000);
      } catch (error: any) {
        console.error("Error syncing subscription:", error);
        setStatus("error");
        setErrorMessage(
          error.message ||
            "Failed to sync subscription. Please contact support."
        );
        setTimeout(() => {
          router.replace("/dashboard");
        }, 5000);
      }
    };

    // Start syncing
    syncSubscription();
  }, [authStatus, session?.user?.id, router, paid, urlPlan, session_id]);

  // Show loading state while checking auth
  if (authStatus === "checking") {
    return (
      <div className={styles["subscription-redirect"]}>
        <div className={styles["subscription-redirect__content"]}>
          <div className={styles["subscription-redirect__spinner"]} />
          <p>Checking your session...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized state
  if (authStatus === "signed_out") {
    return (
      <div className={styles["subscription-redirect"]}>
        <div className={styles["subscription-redirect__content"]}>
          <div
            className={`${styles["subscription-redirect__icon"]} ${styles["subscription-redirect__icon--error"]}`}
          >
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
    <div className={styles["subscription-redirect"]}>
      <div className={styles["subscription-redirect__content"]}>
        {status === "processing" && (
          <>
            <div className={styles["subscription-redirect__spinner"]} />
            <h2>Activating Your Subscription</h2>
            <p>Please wait while we activate your subscription...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              className={`${styles["subscription-redirect__icon"]} ${styles["subscription-redirect__icon--success"]}`}
            >
              ✓
            </div>
            <h2>Subscription Activated!</h2>
            <p>
              Your {planType ? planType.toUpperCase() : ""} plan has been
              successfully activated.
            </p>
            <p className={styles["subscription-redirect__redirect"]}>
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div
              className={`${styles["subscription-redirect__icon"]} ${styles["subscription-redirect__icon--error"]}`}
            >
              ✕
            </div>
            <h2>Activation Failed</h2>
            <p>
              {errorMessage ||
                "An error occurred while activating your subscription."}
            </p>
            <p className={styles["subscription-redirect__redirect"]}>
              Redirecting to dashboard...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionRedirectPage;
