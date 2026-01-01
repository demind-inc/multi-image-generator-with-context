import React from "react";
import "./PaymentModal.scss";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  paymentUrl?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
  paymentUrl,
}) => {
  if (!isOpen) return null;

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
        <h3 id="payment-modal-title">Subscribe to keep generating</h3>
        <p className="payment-modal__lead">
          Your first render is on us. Subscribe for $20/month to unlock
          unlimited generations and keep creating consistent, high-res shots
          without limits.
        </p>
        <div className="payment-modal__feature-grid">
          <div className="payment-modal__feature">
            <span>⚡</span>
            <div>
              <strong>Unlimited runs</strong>
              <p>Generate without waiting for the next free window.</p>
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
        {paymentUrl ? (
          <a
            className="primary-button payment-modal__cta"
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Subscribe for $20/month
          </a>
        ) : (
          <div className="payment-modal__error">
            Add <code>STRIPE_SUBSCRIPTION_LINK</code> to your .env to enable the
            subscription button.
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
