import React, { useState, useRef, useEffect } from "react";
import { AppMode, ImageSize } from "../../types";
import styles from "./AppHeader.module.scss";

interface AppHeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  displayEmail: string;
  onSignOut: () => void;
  referencesCount: number;
  totalScenes: number;
  size: ImageSize;
  onSizeChange: (size: ImageSize) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  disableGenerate: boolean;
  usageRemaining?: number;
  usageLimit?: number;
  isUsageLoading?: boolean;
  isSubscribed: boolean;
  freeCreditsRemaining?: number;
  subscriptionLabel?: string;
  subscriptionPrice?: string | null;
  subscriptionStatus?: string | null;
  onOpenBilling?: () => void;
  onCancelSubscription?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  mode,
  onModeChange,
  displayEmail,
  onSignOut,
  referencesCount,
  totalScenes,
  size,
  onSizeChange,
  isGenerating,
  onGenerate,
  disableGenerate,
  usageRemaining,
  usageLimit,
  isUsageLoading,
  isSubscribed,
  freeCreditsRemaining,
  subscriptionLabel,
  subscriptionPrice,
  subscriptionStatus,
  onOpenBilling,
  onCancelSubscription,
}) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };

    if (isAccountMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAccountMenuOpen]);

  return (
    <header className={styles["app__header"]}>
      <div className={styles["app__header-content"]}>
        <div className="brand">
          <div className="brand__icon">
            <img
              src="/assets/images/logo.png"
              alt="StoryboardGen Logo"
              className="brand__icon-image"
            />
          </div>
          <h1 className="brand__title">StoryboardGen</h1>
        </div>

        <div className={styles["mode-toggle"]}>
          <div className={styles["mode-toggle__inner"]}>
            <button
              onClick={() => onModeChange("slideshow")}
              className={`${styles["mode-toggle__button"]} ${
                mode === "slideshow" ? styles["is-active"] : ""
              }`}
              title="Slideshow Mode"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => onModeChange("manual")}
              className={`${styles["mode-toggle__button"]} ${
                mode === "manual" ? styles["is-active"] : ""
              }`}
              title="Manual Generation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles["header-actions"]}>
          <div className={styles["header-actions__meta"]}>
            <span className="pill pill--ghost" title="Reference images">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ marginRight: "4px" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {referencesCount || "0"}
            </span>
            <span className="pill pill--ghost" title="Scenes">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ marginRight: "4px" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              {totalScenes || "0"}
            </span>
            {isSubscribed ? (
              <span className="pill pill--ghost" title="Monthly credits">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ marginRight: "4px" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {isUsageLoading
                  ? "..."
                  : usageLimit
                  ? `${usageRemaining ?? usageLimit}/${usageLimit}`
                  : "--/--"}
              </span>
            ) : (
              <span className="pill pill--ghost" title="Free credits">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ marginRight: "4px" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {typeof freeCreditsRemaining === "number"
                  ? `${freeCreditsRemaining}/3`
                  : "3 free"}
              </span>
            )}
          </div>
          <button
            onClick={onGenerate}
            disabled={disableGenerate}
            className="primary-button"
          >
            {isGenerating ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{
                    marginRight: "6px",
                    animation: "spin 1s linear infinite",
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Processing
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ marginRight: "6px" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generate
              </>
            )}
          </button>
          {displayEmail && (
            <div className={styles["account-menu"]} ref={accountMenuRef}>
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className={styles["account-menu__trigger"]}
                title="Account menu"
                aria-label="Account menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
              {isAccountMenuOpen && (
                <div className={styles["account-menu__dropdown"]}>
                  <div className={styles["account-menu__email"]}>
                    {displayEmail}
                  </div>
                  <div className={styles["account-menu__subscription"]}>
                    <p className={styles["account-menu__sub-label"]}>
                      {subscriptionLabel ||
                        (isSubscribed ? "Subscribed" : "Free")}
                    </p>
                    {isSubscribed && subscriptionPrice ? (
                      <p className={styles["account-menu__sub-price"]}>
                        {subscriptionPrice}
                      </p>
                    ) : (
                      <p className={styles["account-menu__sub-price"]}>
                        3 credits included
                      </p>
                    )}
                    <div className={styles["account-menu__sub-actions"]}>
                      {isSubscribed && subscriptionStatus !== "unsubscribed" ? (
                        <button onClick={onCancelSubscription}>
                          Cancel subscription
                        </button>
                      ) : !isSubscribed ? (
                        <button onClick={onOpenBilling}>Upgrade</button>
                      ) : null}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSignOut();
                      setIsAccountMenuOpen(false);
                    }}
                    className={styles["account-menu__signout"]}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
