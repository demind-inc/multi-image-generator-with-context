import React, { useEffect, useRef, useState } from "react";
import { AppMode } from "../../types";
import Footer from "../Footer/Footer";
import styles from "./Sidebar.module.scss";

export type PanelKey = "saved" | "references" | "storyboard" | "manual";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  return `${year} ${month} ${day}`;
};

interface SidebarProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  activePanel: PanelKey;
  onPanelChange: (panel: PanelKey) => void;
  onOpenSettings: () => void;
  displayEmail: string;
  isSubscribed: boolean;
  subscriptionLabel?: string;
  subscriptionPrice?: string | null;
  planType?: string;
  remainingCredits?: number;
  totalCredits?: number;
  expiredAt?: string | null;
  unsubscribedAt?: string | null;
  subscriptionStatus?: string | null;
  onOpenBilling?: () => void;
  onCancelSubscription?: () => void;
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  mode,
  onModeChange,
  activePanel,
  onPanelChange,
  onOpenSettings,
  displayEmail,
  isSubscribed,
  subscriptionLabel,
  subscriptionPrice,
  planType,
  remainingCredits,
  totalCredits,
  expiredAt,
  unsubscribedAt,
  subscriptionStatus,
  onOpenBilling,
  onCancelSubscription,
  onSignOut,
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
    <div className={`${styles.sidebar} custom-scrollbar`}>
      <div className={styles["sidebar__header"]}>
        <div className="brand brand--compact">
          <div className="brand__icon">
            <img
              src="/assets/images/logo.png"
              alt="StoryboardGen Logo"
              className="brand__icon-image"
            />
          </div>
          <div className="brand__text">
            <p className="brand__eyebrow">Workspace</p>
            <h3 className="brand__title">StoryboardGen</h3>
          </div>
        </div>
        <div className={styles["sidebar__header-actions"]}>
          <div className={styles["sidebar__profile"]} ref={accountMenuRef}>
            <button
              className={styles["sidebar__profile-btn"]}
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              title="Account"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
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
              <div className={styles["sidebar__profile-menu"]}>
                <div className={styles["sidebar__profile-email"]}>
                  {displayEmail}
                </div>
                <div className={styles["sidebar__profile-sub"]}>
                  <p className={styles["sidebar__profile-label"]}>
                    {subscriptionLabel ||
                      (isSubscribed ? "Subscribed" : "Free")}
                  </p>
                  <p className={styles["sidebar__profile-meta"]}>
                    {isSubscribed
                      ? subscriptionPrice || "Active"
                      : "3 credits included"}
                  </p>
                  {isSubscribed && expiredAt && (
                    <p
                      className={styles["sidebar__profile-meta"]}
                      style={{ fontSize: "0.75rem", color: "#ff6b6b" }}
                    >
                      Expired: {formatDate(expiredAt)}
                    </p>
                  )}
                  {isSubscribed && unsubscribedAt && (
                    <p
                      className={styles["sidebar__profile-meta"]}
                      style={{ fontSize: "0.75rem", color: "#ffa500" }}
                    >
                      Unsubscribed: {formatDate(unsubscribedAt)}
                    </p>
                  )}
                  <div className={styles["sidebar__profile-actions"]}>
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
                  className={styles["sidebar__profile-signout"]}
                  onClick={onSignOut}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles["sidebar__section"]}>
        <p className={styles["sidebar__eyebrow"]}>Mode</p>
        <div className={styles["sidebar__mode-toggle"]}>
          <button
            className={`${styles["sidebar__mode-link"]} ${
              mode === "manual" && activePanel === "manual"
                ? styles["is-active"]
                : ""
            }`}
            onClick={() => {
              onModeChange("manual");
              onPanelChange("manual");
            }}
          >
            Multi image generation
          </button>
          <button
            className={`${styles["sidebar__mode-link"]} ${
              mode === "slideshow" && activePanel === "storyboard"
                ? styles["is-active"]
                : ""
            }`}
            onClick={() => {
              onModeChange("slideshow");
              onPanelChange("storyboard");
            }}
          >
            Slideshow
          </button>
        </div>
      </div>

      <div className={styles["sidebar__section"]}>
        <p className={styles["sidebar__eyebrow"]}>Saved</p>
        <nav className={styles["sidebar__nav"]}>
          <button
            className={`${styles["sidebar__nav-item"]} ${
              activePanel === "saved" ? styles["is-active"] : ""
            }`}
            onClick={() => onPanelChange("saved")}
          >
            Images
          </button>
          <button
            className={`${styles["sidebar__nav-item"]} ${
              activePanel === "references" ? styles["is-active"] : ""
            }`}
            onClick={() => onPanelChange("references")}
          >
            Prompts
          </button>
        </nav>
      </div>

      <div className={styles["sidebar__footer"]}>
        <div className={styles["sidebar__plan-info"]}>
          <div className={styles["sidebar__plan-row"]}>
            <span className={styles["sidebar__plan-label"]}>Plan</span>
            <span className={styles["sidebar__plan-value"]}>
              {isSubscribed && planType ? planType.toUpperCase() : "Free"}
            </span>
          </div>
          <div className={styles["sidebar__plan-row"]}>
            <span className={styles["sidebar__plan-label"]}>Credits</span>
            <span className={styles["sidebar__plan-value"]}>
              {isSubscribed
                ? remainingCredits !== undefined && totalCredits !== undefined
                  ? `${remainingCredits}/${totalCredits}`
                  : "--/--"
                : remainingCredits !== undefined
                ? `${remainingCredits}/3`
                : "3"}
            </span>
          </div>
        </div>
        {!isSubscribed && onOpenBilling && (
          <button
            className={styles["sidebar__upgrade-btn"]}
            onClick={onOpenBilling}
          >
            Upgrade
          </button>
        )}
      </div>

      <div className={styles["sidebar__footer-section"]}>
        <Footer />
      </div>
    </div>
  );
};

export default Sidebar;
