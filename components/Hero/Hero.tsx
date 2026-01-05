import React from "react";
import { AppMode, ImageSize } from "../../types";
import styles from "./Hero.module.scss";

interface HeroProps {
  referencesCount: number;
  generatedCount: number;
  size: ImageSize;
  mode: AppMode;
  isGenerating: boolean;
  disableGenerate: boolean;
  onUploadClick: () => void;
  onGenerate: () => void;
  usageRemaining?: number;
  usageLimit?: number;
  isUsageLoading?: boolean;
  isSubscribed: boolean;
  freeCreditsRemaining?: number;
}

const Hero: React.FC<HeroProps> = ({
  referencesCount,
  generatedCount,
  size,
  mode,
  isGenerating,
  disableGenerate,
  onUploadClick,
  onGenerate,
  usageRemaining,
  usageLimit,
  isUsageLoading,
  isSubscribed,
  freeCreditsRemaining,
}) => {
  return (
    <section className={`${styles.hero} card card--gradient`}>
      <div className={styles["hero__left"]}>
        <div className="pill pill--glow">New • Brighter workspace</div>
        <h2 className={styles["hero__title"]}>
          Design-grade layouts without the design gruntwork.
        </h2>
        <p className={styles["hero__subtitle"]}>
          Blend storyboard prompts, character references, and high-res rendering
          in one streamlined surface inspired by modern creative tools.
        </p>
        <div className={styles["hero__cta"]}>
          <button
            onClick={onUploadClick}
            className="primary-button primary-button--ghost"
          >
            Upload references
          </button>
          <button
            onClick={onGenerate}
            disabled={disableGenerate}
            className="primary-button"
          >
            {isGenerating ? "Processing..." : "Generate now"}
          </button>
        </div>
      </div>
      <div className={styles["hero__right"]}>
        <div className={styles["metric-tile"]}>
          <p className={styles["metric-tile__label"]}>Identity lock</p>
          <p className={styles["metric-tile__value"]}>
            {referencesCount > 0 ? "Ready" : "Pending"}
          </p>
          <p className={styles["metric-tile__hint"]}>
            {referencesCount > 0 ? "Consistency secured" : "Add 1-3 portraits"}
          </p>
        </div>
        <div className={styles["metric-row"]}>
          <div className={styles["metric-card"]}>
            <p className={styles["metric-card__value"]}>
              {isUsageLoading
                ? "..."
                : isSubscribed
                ? usageLimit
                  ? `${usageRemaining ?? usageLimit}/${usageLimit}`
                  : "--/--"
                : typeof freeCreditsRemaining === "number"
                ? `${freeCreditsRemaining}/3`
                : "3"}
            </p>
            <p className={styles["metric-card__label"]}>
              {isSubscribed ? "Credits left" : "Free credits"}
            </p>
          </div>
          <div className={styles["metric-card"]}>
            <p className={styles["metric-card__value"]}>{generatedCount}</p>
            <p className={styles["metric-card__label"]}>Rendered scenes</p>
          </div>
          <div className={styles["metric-card"]}>
            <p className={styles["metric-card__value"]}>{size}</p>
            <p className={styles["metric-card__label"]}>Resolution</p>
          </div>
          <div className={styles["metric-card"]}>
            <p className={styles["metric-card__value"]}>
              {mode === "slideshow" ? "Auto" : "Manual"}
            </p>
            <p className={styles["metric-card__label"]}>Mode</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
