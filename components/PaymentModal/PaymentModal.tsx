import React from "react";
import { SubscriptionPlan } from "../../types";
import "./PaymentModal.scss";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  planType: SubscriptionPlan;
  paymentUrls?: Partial<Record<SubscriptionPlan, string>>;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
  planType,
  paymentUrls,
}) => {
  if (!isOpen) return null;

  const planUrl = paymentUrls?.[planType];
  const planLabel =
    planType === "pro"
      ? "Pro ($29/mo)"
      : planType === "business"
      ? "Business ($79/mo)"
      : "Basic ($9/mo)";

  return (
    <div
      className="payment-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
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
        {planUrl ? (
          <a
            className="primary-button payment-modal__cta"
            href={planUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Subscribe to {planLabel}
          </a>
        ) : (
          <div className="payment-modal__error">
            Add plan links (e.g. <code>STRIPE_LINK_BASIC</code>,{" "}
            <code>STRIPE_LINK_PRO</code>, <code>STRIPE_LINK_BUSINESS</code>) to
            your .env to enable the subscription button.
          </div>
        )}
        <button className="payment-modal__ghost" onClick={onUnlock}>
          I already subscribed
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;
