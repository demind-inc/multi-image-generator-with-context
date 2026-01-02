import React, { useEffect, useRef, useState } from "react";
import { AppMode } from "../../types";
import Footer from "../Footer/Footer";
import "./Sidebar.scss";

export type PanelKey = "saved" | "references" | "storyboard" | "manual";

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
    <div className="sidebar custom-scrollbar">
      <div className="sidebar__header">
        <div className="brand brand--compact">
          <div className="brand__icon">
            <img
              src="/assets/images/logo.png"
              alt="NanoGen AI Logo"
              className="brand__icon-image"
            />
          </div>
          <div className="brand__text">
            <p className="brand__eyebrow">Workspace</p>
            <h3 className="brand__title">NanoGen AI</h3>
          </div>
        </div>
        <div className="sidebar__header-actions">
          <div className="sidebar__profile" ref={accountMenuRef}>
            <button
              className="sidebar__profile-btn"
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
              <div className="sidebar__profile-menu">
                <div className="sidebar__profile-email">{displayEmail}</div>
                <div className="sidebar__profile-sub">
                  <p className="sidebar__profile-label">
                    {subscriptionLabel ||
                      (isSubscribed ? "Subscribed" : "Free")}
                  </p>
                  <p className="sidebar__profile-meta">
                    {isSubscribed
                      ? subscriptionPrice || "Active"
                      : "3 credits included"}
                  </p>
                  <div className="sidebar__profile-actions">
                    {isSubscribed ? (
                      <button onClick={onCancelSubscription}>
                        Cancel subscription
                      </button>
                    ) : (
                      <button onClick={onOpenBilling}>Upgrade</button>
                    )}
                  </div>
                </div>
                <button
                  className="sidebar__profile-signout"
                  onClick={onSignOut}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sidebar__section">
        <p className="sidebar__eyebrow">Mode</p>
        <div className="sidebar__mode-toggle">
          <button
            className={`sidebar__mode-link ${
              mode === "manual" && activePanel === "manual" ? "is-active" : ""
            }`}
            onClick={() => {
              onModeChange("manual");
              onPanelChange("manual");
            }}
          >
            Multi image generation
          </button>
          <button
            className={`sidebar__mode-link ${
              mode === "slideshow" && activePanel === "storyboard"
                ? "is-active"
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

      <div className="sidebar__section">
        <p className="sidebar__eyebrow">Saved</p>
        <nav className="sidebar__nav">
          <button
            className={`sidebar__nav-item ${
              activePanel === "saved" ? "is-active" : ""
            }`}
            onClick={() => onPanelChange("saved")}
          >
            Images
          </button>
          <button
            className={`sidebar__nav-item ${
              activePanel === "references" ? "is-active" : ""
            }`}
            onClick={() => onPanelChange("references")}
          >
            Prompts
          </button>
        </nav>
      </div>

      <div className="sidebar__footer">
        <div className="sidebar__plan-info">
          <div className="sidebar__plan-row">
            <span className="sidebar__plan-label">Plan</span>
            <span className="sidebar__plan-value">
              {isSubscribed && planType ? planType.toUpperCase() : "Free"}
            </span>
          </div>
          <div className="sidebar__plan-row">
            <span className="sidebar__plan-label">Credits</span>
            <span className="sidebar__plan-value">
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
          <button className="sidebar__upgrade-btn" onClick={onOpenBilling}>
            Upgrade
          </button>
        )}
      </div>

      <div className="sidebar__footer-section">
        <Footer />
      </div>
    </div>
  );
};

export default Sidebar;
