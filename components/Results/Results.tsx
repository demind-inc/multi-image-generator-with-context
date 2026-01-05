import React from "react";
import { AppMode, SceneResult } from "../../types";
import styles from "./Results.module.scss";

interface ResultsProps {
  mode: AppMode;
  results: SceneResult[];
  isGenerating: boolean;
  onRegenerate: (index: number) => void;
}

const Results: React.FC<ResultsProps> = ({
  mode,
  results,
  isGenerating,
  onRegenerate,
}) => {
  return (
    <div className={styles["app__results"]}>
      <div className={styles["results-card"]}>
        <div className={styles["results-card__header"]}>
          <span>
            {mode === "slideshow" ? "Slideshow Timeline" : "Generated Scenes"}
          </span>
          {isGenerating && <span className={styles.badge}>Rendering set...</span>}
        </div>

        <div className={styles["results-card__body"]}>
          {results.length === 0 ? (
            <div className={styles["empty-state"]}>
              <div className={styles["empty-state__icon"]}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p
                className="brand__title"
                style={{ fontSize: "18px", color: "#475569" }}
              >
                No Content Ready
              </p>
              <p className="text text--helper" style={{ margin: 0 }}>
                Upload references and{" "}
                {mode === "slideshow" ? "create a storyboard" : "input prompts"}
              </p>
            </div>
          ) : (
            <div className={`${styles["results-scroll"]} custom-scrollbar`}>
              <div className={styles["results-list"]}>
                {results.map((result, idx) => {
                  const isFirstSlide = mode === "slideshow" && idx === 0;
                  return (
                    <div
                      key={idx}
                      className={`${styles["slide-card"]} ${
                        result.isCTA ? styles["slide-card--cta"] : ""
                      }`}
                    >
                      {!result.isCTA && (
                        <div className={styles["slide-card__media"]}>
                          {result.isLoading ? (
                            <div className={`${styles["slide-card__overlay"]} ${styles["slide-card__overlay--loading"]}`}>
                              <div className="spinner" />
                              <p
                                className="text text--helper"
                                style={{ margin: 0, color: "#2563eb" }}
                              >
                                Illustrating...
                              </p>
                            </div>
                          ) : result.imageUrl ? (
                            <>
                              <img
                                src={result.imageUrl}
                                alt={`Result ${idx + 1}`}
                                className={styles["slide-card__image"]}
                              />
                              <div className={styles["slide-card__actions"]}>
                                <button
                                  onClick={() => onRegenerate(idx)}
                                  className="icon-button"
                                  title="Regenerate this scene"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                  </svg>
                                </button>
                                <a
                                  href={result.imageUrl}
                                  download={`scene-${idx + 1}.png`}
                                  className="icon-button"
                                  title="Download PNG"
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
                                      d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4-4 4m0 0-4-4m4 4V4"
                                    />
                                  </svg>
                                </a>
                              </div>
                            </>
                          ) : result.error ? (
                            <div className={`${styles["slide-card__overlay"]} ${styles["slide-card__overlay--error"]}`}>
                              <p
                                className="text text--helper"
                                style={{ margin: 0, color: "#b91c1c" }}
                              >
                                Error
                              </p>
                              <p
                                className={styles["slide-card__prompt"]}
                                style={{
                                  color: "#ef4444",
                                  fontStyle: "italic",
                                }}
                              >
                                "{result.error}"
                              </p>
                              <button
                                onClick={() => onRegenerate(idx)}
                                className="button button--storyboard"
                                style={{
                                  background: "#ef4444",
                                  boxShadow:
                                    "0 12px 22px rgba(239, 68, 68, 0.26)",
                                }}
                              >
                                Retry
                              </button>
                            </div>
                          ) : (
                            <div className={`${styles["slide-card__overlay"]} ${styles["slide-card__overlay--placeholder"]}`}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="1"
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <div
                                className="text text--helper"
                                style={{ margin: 0, color: "#cbd5e1" }}
                              >
                                Awaiting Generation
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {result.isCTA && (
                        <div className={styles["cta-placeholder"]}>
                          <div>
                            <div style={{ marginBottom: "12px" }}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="42"
                                height="42"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4-4 4m0 0-4-4m4 4V4"
                                />
                              </svg>
                            </div>
                            <div>Action Slide</div>
                          </div>
                        </div>
                      )}

                      <div className={styles["slide-card__meta"]}>
                        <span className={styles["slide-card__index"]}>{idx + 1}</span>
                        <h3 className={styles["slide-card__title"]}>
                          {result.title ||
                            (mode === "manual"
                              ? `Scene ${idx + 1}`
                              : `Slide ${idx + 1}`)}
                        </h3>
                      </div>

                      {!isFirstSlide && result.description && (
                        <p className={styles["slide-card__description"]}>
                          {result.description}
                        </p>
                      )}

                      {mode === "manual" && (
                        <p className={styles["slide-card__description"]}>
                          {result.prompt}
                        </p>
                      )}

                      {!result.isCTA && (
                        <div className={styles["slide-card__foot"]}>
                          <div className={styles["slide-card__foot-label"]}>
                            Character Guidance
                          </div>
                          <p className={styles["slide-card__foot-text"]}>
                            "{result.prompt}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results;
