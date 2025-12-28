import React from "react";
import { AppMode, ImageSize } from "../../types";
import "./AppHeader.scss";

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
}) => {
  return (
    <header className="app__header">
      <div className="app__header-content">
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

        <div className="mode-toggle">
          <div className="mode-toggle__inner">
            <button
              onClick={() => onModeChange("slideshow")}
              className={`mode-toggle__button ${
                mode === "slideshow" ? "is-active" : ""
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
              className={`mode-toggle__button ${
                mode === "manual" ? "is-active" : ""
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

        <div className="header-actions">
          {displayEmail && (
            <div className="account-chip">
              <div className="account-chip__info">
                <span className="account-chip__label">Signed in</span>
                <span className="account-chip__email">{displayEmail}</span>
              </div>
              <button
                onClick={onSignOut}
                className="account-chip__logout"
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          )}
          <div className="header-actions__meta">
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
          </div>
          <div className="size-picker">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              title="Resolution"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            <div className="size-picker__options">
              {(["1K", "2K", "4K"] as ImageSize[]).map((option) => (
                <button
                  key={option}
                  onClick={() => onSizeChange(option)}
                  disabled={isGenerating}
                  className={`size-picker__option ${
                    size === option ? "is-active" : ""
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
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
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
