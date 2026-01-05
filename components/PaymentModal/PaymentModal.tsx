import React, { useState } from "react";
import { SubscriptionPlan } from "../../types";
import styles from "./PaymentModal.module.scss";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: SubscriptionPlan;
  paymentUrls?: Partial<Record<SubscriptionPlan, string>>;
  onPlanSelect?: (plan: SubscriptionPlan) => void;
  userId?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  planType,
  paymentUrls,
  onPlanSelect,
  userId,
}) => {
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);

  if (!isOpen) return null;

  const handlePlanClick = async (plan: SubscriptionPlan) => {
    onPlanSelect?.(plan);

    // If userId is provided, use the new Checkout Session API
    if (userId) {
      setLoadingPlan(plan);
      try {
        const response = await fetch("/api/subscription/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            plan,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("Failed to create checkout session:", error);
          alert(`Failed to start checkout: ${error.error || "Unknown error"}`);
          setLoadingPlan(null);
          return;
        }

        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        }
      } catch (error) {
        console.error("Error creating checkout session:", error);
        alert("Failed to start checkout. Please try again.");
        setLoadingPlan(null);
      }
    } else {
      // Fallback to static payment URLs if userId is not provided
      const planUrl = paymentUrls?.[plan];
      if (planUrl) {
        window.location.href = planUrl;
      }
    }
  };

  const plans = [
    {
      plan: "basic" as SubscriptionPlan,
      badge: "Basic",
      price: "$9/mo",
      credits: "60 credits/month",
    },
    {
      plan: "pro" as SubscriptionPlan,
      badge: "Pro",
      price: "$29/mo",
      credits: "180 credits/month",
    },
    {
      plan: "business" as SubscriptionPlan,
      badge: "Business",
      price: "$79/mo",
      credits: "600 credits/month",
    },
  ];

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles["payment-modal__backdrop"]}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={handleBackdropClick}
    >
      <div className={styles["payment-modal"]}>
        <button
          className={styles["payment-modal__close"]}
          aria-label="Close payment modal"
          onClick={onClose}
        >
          ×
        </button>
        <div className={styles["payment-modal__badge"]}>Upgrade</div>
        <h3 id="payment-modal-title">Choose a credit plan</h3>
        <p className={styles["payment-modal__lead"]}>
          Your first render is on us. Pick a monthly credit pack to keep
          generating scene-consistent images all month long.
        </p>
        <div className={styles["payment-modal__feature-grid"]}>
          <div className={styles["payment-modal__feature"]}>
            <span>⚡</span>
            <div>
              <strong>Flexible credits</strong>
              <p>Credits reset monthly—1 credit equals 1 image.</p>
            </div>
          </div>
          <div className={styles["payment-modal__feature"]}>
            <span>🖼️</span>
            <div>
              <strong>High-res exports</strong>
              <p>Keep 1K, 2K, or 4K scenes ready to ship.</p>
            </div>
          </div>
          <div className={styles["payment-modal__feature"]}>
            <span>📌</span>
            <div>
              <strong>Character lock</strong>
              <p>Stay on-model across every prompt and storyboard.</p>
            </div>
          </div>
        </div>
        <div className={styles["payment-modal__plans"]}>
          {plans.map((planOption) => {
            const planUrl = paymentUrls?.[planOption.plan];
            const isSelected = planType === planOption.plan;
            return (
              <div
                key={planOption.plan}
                className={`${styles["payment-modal__plan-card"]} ${
                  isSelected ? styles["is-selected"] : ""
                }`}
              >
                <p className={styles["payment-modal__plan-badge"]}>
                  {planOption.badge}
                </p>
                <p className={styles["payment-modal__plan-price"]}>
                  {planOption.price}
                </p>
                <p className={styles["payment-modal__plan-credits"]}>
                  {planOption.credits}
                </p>
                {(() => {
                  const isLoading = loadingPlan === planOption.plan;
                  const planUrl = paymentUrls?.[planOption.plan];

                  if (userId) {
                    // Use new Checkout Session API
                    return (
                      <button
                        className={`primary-button ${styles["payment-modal__plan-button"]}`}
                        onClick={() => handlePlanClick(planOption.plan)}
                        disabled={isLoading}
                      >
                        {isLoading
                          ? "Loading..."
                          : `Choose ${planOption.badge}`}
                      </button>
                    );
                  } else if (planUrl) {
                    // Fallback to static payment URLs
                    return (
                      <a
                        className={`primary-button ${styles["payment-modal__plan-button"]}`}
                        href={planUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onPlanSelect?.(planOption.plan)}
                      >
                        Choose {planOption.badge}
                      </a>
                    );
                  } else {
                    return (
                      <div className={styles["payment-modal__plan-error"]}>
                        Link not configured
                      </div>
                    );
                  }
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
