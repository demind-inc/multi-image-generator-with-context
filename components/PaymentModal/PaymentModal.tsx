import React from "react";
import { SubscriptionPlan } from "../../types";
import "./PaymentModal.scss";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: SubscriptionPlan;
  paymentUrls?: Partial<Record<SubscriptionPlan, string>>;
  onPlanSelect?: (plan: SubscriptionPlan) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  planType,
  paymentUrls,
  onPlanSelect,
}) => {
  if (!isOpen) return null;

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
      className="payment-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={handleBackdropClick}
    >
      <div className="payment-modal">
        <button
          className="payment-modal__close"
          aria-label="Close payment modal"
          onClick={onClose}
        >
          ×
        </button>
        <div className="payment-modal__badge">Upgrade</div>
        <h3 id="payment-modal-title">Choose a credit plan</h3>
        <p className="payment-modal__lead">
          Your first render is on us. Pick a monthly credit pack to keep
          generating scene-consistent images all month long.
        </p>
        <div className="payment-modal__feature-grid">
          <div className="payment-modal__feature">
            <span>⚡</span>
            <div>
              <strong>Flexible credits</strong>
              <p>Credits reset monthly—1 credit equals 1 image.</p>
            </div>
          </div>
          <div className="payment-modal__feature">
            <span>🖼️</span>
            <div>
              <strong>High-res exports</strong>
              <p>Keep 1K, 2K, or 4K scenes ready to ship.</p>
            </div>
          </div>
          <div className="payment-modal__feature">
            <span>📌</span>
            <div>
              <strong>Character lock</strong>
              <p>Stay on-model across every prompt and storyboard.</p>
            </div>
          </div>
        </div>
        <div className="payment-modal__plans">
          {plans.map((planOption) => {
            const planUrl = paymentUrls?.[planOption.plan];
            const isSelected = planType === planOption.plan;
            return (
              <div
                key={planOption.plan}
                className={`payment-modal__plan-card ${
                  isSelected ? "is-selected" : ""
                }`}
              >
                <p className="payment-modal__plan-badge">{planOption.badge}</p>
                <p className="payment-modal__plan-price">{planOption.price}</p>
                <p className="payment-modal__plan-credits">
                  {planOption.credits}
                </p>
                {planUrl ? (
                  <a
                    className="primary-button payment-modal__plan-button"
                    href={planUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onPlanSelect?.(planOption.plan)}
                  >
                    Choose {planOption.badge}
                  </a>
                ) : (
                  <div className="payment-modal__plan-error">
                    Link not configured
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
