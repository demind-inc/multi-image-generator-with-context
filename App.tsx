import React, { useState, useRef } from "react";
import { ImageSize, SceneResult, ReferenceImage } from "./types";
import {
  generateCharacterScene,
  generateSlideshowStructure,
} from "./services/geminiService";
import "./App.scss";

type AppMode = "slideshow" | "manual";

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>("slideshow");
  const [topic, setTopic] = useState<string>("");
  const [manualPrompts, setManualPrompts] = useState<string>(
    "Boy looking confused with question marks around him\nBoy feeling lonely at a cafe table\nBoy looking angry while listening to something"
  );
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [slideshowResults, setSlideshowResults] = useState<SceneResult[]>([]);
  const [manualResults, setManualResults] = useState<SceneResult[]>([]);
  const [size, setSize] = useState<ImageSize>("1K");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingStoryboard, setIsCreatingStoryboard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeResults = mode === "slideshow" ? slideshowResults : manualResults;
  const generatedCount = activeResults.filter((item) => item.imageUrl).length;
  const totalScenes = activeResults.length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferences((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            data: reader.result as string,
            mimeType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReference = (id: string) => {
    setReferences((prev) => prev.filter((r) => r.id !== id));
  };

  const handleGenerateStoryboard = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic first.");
      return;
    }
    setIsCreatingStoryboard(true);
    try {
      const slides = await generateSlideshowStructure(topic);
      if (slides.length > 0) {
        const newResults: SceneResult[] = slides.map((slide, idx) => ({
          title: slide.title,
          description: slide.description,
          prompt: slide.prompt,
          isLoading: false,
          isCTA: idx === slides.length - 1,
        }));
        setSlideshowResults(newResults);
      }
    } catch (error) {
      console.error("Storyboard error:", error);
      alert("Failed to generate storyboard. Check your connection/key.");
    } finally {
      setIsCreatingStoryboard(false);
    }
  };

  const handleRegenerate = async (index: number) => {
    if (references.length === 0) {
      alert(
        "Please upload at least one reference image for character consistency."
      );
      return;
    }

    const setter =
      mode === "slideshow" ? setSlideshowResults : setManualResults;
    const currentList = mode === "slideshow" ? slideshowResults : manualResults;
    const targetResult = currentList[index];

    if (!targetResult || targetResult.isCTA) return;

    setter((prev) =>
      prev.map((res, idx) =>
        idx === index ? { ...res, isLoading: true, error: undefined } : res
      )
    );

    try {
      const imageUrl = await generateCharacterScene(
        targetResult.prompt,
        references,
        size
      );
      setter((prev) =>
        prev.map((res, idx) =>
          idx === index ? { ...res, imageUrl, isLoading: false } : res
        )
      );
    } catch (error: any) {
      console.error("Regeneration error:", error);
      setter((prev) =>
        prev.map((res, idx) =>
          idx === index
            ? {
                ...res,
                error: error.message || "Generation failed",
                isLoading: false,
              }
            : res
        )
      );
    }
  };

  const startGeneration = async () => {
    if (references.length === 0) {
      alert(
        "Please upload at least one reference image for character consistency."
      );
      return;
    }

    setIsGenerating(true);

    if (mode === "manual") {
      const promptList = manualPrompts
        .split("\n")
        .filter((p) => p.trim() !== "");
      if (promptList.length === 0) {
        alert("Please enter some manual prompts.");
        setIsGenerating(false);
        return;
      }

      const initialManualResults = promptList.map(
        (p) => ({ prompt: p, isLoading: true } as SceneResult)
      );
      setManualResults(initialManualResults);

      for (let i = 0; i < initialManualResults.length; i++) {
        try {
          const imageUrl = await generateCharacterScene(
            promptList[i],
            references,
            size
          );
          setManualResults((prev) =>
            prev.map((res, idx) =>
              idx === i ? { ...res, imageUrl, isLoading: false } : res
            )
          );
        } catch (error: any) {
          console.error("Manual generation error:", error);
          setManualResults((prev) =>
            prev.map((res, idx) =>
              idx === i
                ? { ...res, error: error.message, isLoading: false }
                : res
            )
          );
        }
      }
    } else {
      if (slideshowResults.length === 0) {
        alert("Please create a storyboard first.");
        setIsGenerating(false);
        return;
      }

      setSlideshowResults((prev) =>
        prev.map((res) => ({ ...res, isLoading: !res.isCTA && !res.imageUrl }))
      );

      for (let i = 0; i < slideshowResults.length; i++) {
        const currentRes = slideshowResults[i];
        if (currentRes.isCTA || currentRes.imageUrl) continue;

        try {
          const imageUrl = await generateCharacterScene(
            currentRes.prompt,
            references,
            size
          );
          setSlideshowResults((prev) =>
            prev.map((res, idx) =>
              idx === i ? { ...res, imageUrl, isLoading: false } : res
            )
          );
        } catch (error: any) {
          console.error("Slideshow generation error:", error);
          setSlideshowResults((prev) =>
            prev.map((res, idx) =>
              idx === i
                ? { ...res, error: error.message, isLoading: false }
                : res
            )
          );
        }
      }
    }

    setIsGenerating(false);
  };

  return (
    <div className="app">
      <div className="app__background">
        <span className="app__orb app__orb--left" />
        <span className="app__orb app__orb--right" />
      </div>

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
            <h1 className="brand__title">Consistency Studio</h1>
          </div>

          <div className="mode-toggle">
            <div className="mode-toggle__inner">
              <button
                onClick={() => setMode("slideshow")}
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
                onClick={() => setMode("manual")}
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
                {references.length || "0"}
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
                {(["1K", "2K", "4K"] as ImageSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    disabled={isGenerating}
                    className={`size-picker__option ${
                      size === s ? "is-active" : ""
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={startGeneration}
              disabled={isGenerating || references.length === 0}
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

      <main className="app__body">
        <section className="hero card card--gradient">
          <div className="hero__left">
            <div className="pill pill--glow">New • Brighter workspace</div>
            <h2 className="hero__title">
              Design-grade layouts without the design gruntwork.
            </h2>
            <p className="hero__subtitle">
              Blend storyboard prompts, character references, and high-res
              rendering in one streamlined surface inspired by modern creative
              tools.
            </p>
            <div className="hero__cta">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="primary-button primary-button--ghost"
              >
                Upload references
              </button>
              <button
                onClick={startGeneration}
                disabled={isGenerating || references.length === 0}
                className="primary-button"
              >
                {isGenerating ? "Processing..." : "Generate now"}
              </button>
            </div>
          </div>
          <div className="hero__right">
            <div className="metric-tile">
              <p className="metric-tile__label">Identity lock</p>
              <p className="metric-tile__value">
                {references.length > 0 ? "Ready" : "Pending"}
              </p>
              <p className="metric-tile__hint">
                {references.length > 0
                  ? "Consistency secured"
                  : "Add 1-3 portraits"}
              </p>
            </div>
            <div className="metric-row">
              <div className="metric-card">
                <p className="metric-card__value">{generatedCount}</p>
                <p className="metric-card__label">Rendered scenes</p>
              </div>
              <div className="metric-card">
                <p className="metric-card__value">{size}</p>
                <p className="metric-card__label">Resolution</p>
              </div>
              <div className="metric-card">
                <p className="metric-card__value">
                  {mode === "slideshow" ? "Auto" : "Manual"}
                </p>
                <p className="metric-card__label">Mode</p>
              </div>
            </div>
          </div>
        </section>

        <div className="sidebar custom-scrollbar">
          <section className="card">
            <div className="card__header">
              <h3 className="card__title">References</h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="card__action"
              >
                Upload
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden-input"
              accept="image/*"
              onChange={handleFileUpload}
            />
            {references.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="references__placeholder"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <div>Add Character Images</div>
              </div>
            ) : (
              <div className="references__grid">
                {references.map((ref) => (
                  <div key={ref.id} className="reference-thumb">
                    <img src={ref.data} alt="Reference" />
                    <button
                      onClick={() => removeReference(ref.id)}
                      className="reference-thumb__remove"
                      aria-label="Remove reference"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            className="card"
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            {mode === "slideshow" ? (
              <>
                <h3 className="card__title">Slideshow Story</h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    flex: 1,
                  }}
                >
                  <div>
                    <label className="field-label">Overall Topic</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Benefits of Yoga"
                      className="text-input"
                    />
                  </div>
                  <button
                    onClick={handleGenerateStoryboard}
                    disabled={isCreatingStoryboard || !topic.trim()}
                    className="storyboard-button"
                  >
                    {isCreatingStoryboard
                      ? "Creating Script..."
                      : "Generate Storyboard"}
                  </button>
                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: "12px",
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    <p className="helper-text">
                      This will automatically create a title slide, informative
                      slides, and a CTA slide.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="card__title">Manual Scenarios</h3>
                <textarea
                  value={manualPrompts}
                  onChange={(e) => setManualPrompts(e.target.value)}
                  placeholder="One scene prompt per line..."
                  className="textarea-input"
                />
                <p className="helper-text">
                  Describe actions, emotions, and props.
                </p>
              </>
            )}
          </section>
        </div>

        <div className="app__results">
          <div className="results-card">
            <div className="results-card__header">
              <span>
                {mode === "slideshow"
                  ? "Slideshow Timeline"
                  : "Generated Scenes"}
              </span>
              {isGenerating && <span className="badge">Rendering set...</span>}
            </div>

            <div className="results-card__body">
              {(mode === "slideshow" ? slideshowResults : manualResults)
                .length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">
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
                  <p className="helper-text" style={{ margin: 0 }}>
                    Upload references and{" "}
                    {mode === "slideshow"
                      ? "create a storyboard"
                      : "input prompts"}
                  </p>
                </div>
              ) : (
                <div className="results-scroll custom-scrollbar">
                  <div className="results-list">
                    {(mode === "slideshow"
                      ? slideshowResults
                      : manualResults
                    ).map((result, idx) => {
                      const isFirstSlide = mode === "slideshow" && idx === 0;
                      return (
                        <div
                          key={idx}
                          className={`slide-card ${
                            result.isCTA ? "slide-card--cta" : ""
                          }`}
                        >
                          {!result.isCTA && (
                            <div className="slide-card__media">
                              {result.isLoading ? (
                                <div className="slide-card__overlay slide-card__overlay--loading">
                                  <div className="spinner" />
                                  <p
                                    className="helper-text"
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
                                    className="slide-card__image"
                                  />
                                  <div className="slide-card__actions">
                                    <button
                                      onClick={() => handleRegenerate(idx)}
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
                                <div className="slide-card__overlay slide-card__overlay--error">
                                  <p
                                    className="helper-text"
                                    style={{ margin: 0, color: "#b91c1c" }}
                                  >
                                    Error
                                  </p>
                                  <p
                                    className="slide-card__prompt"
                                    style={{
                                      color: "#ef4444",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    "{result.error}"
                                  </p>
                                  <button
                                    onClick={() => handleRegenerate(idx)}
                                    className="storyboard-button"
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
                                <div className="slide-card__overlay slide-card__overlay--placeholder">
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
                                    className="helper-text"
                                    style={{ margin: 0, color: "#cbd5e1" }}
                                  >
                                    Awaiting Generation
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {result.isCTA && (
                            <div className="cta-placeholder">
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

                          <div className="slide-card__meta">
                            <span className="slide-card__index">{idx + 1}</span>
                            <h3 className="slide-card__title">
                              {result.title ||
                                (mode === "manual"
                                  ? `Scene ${idx + 1}`
                                  : `Slide ${idx + 1}`)}
                            </h3>
                          </div>

                          {!isFirstSlide && result.description && (
                            <p className="slide-card__description">
                              {result.description}
                            </p>
                          )}

                          {mode === "manual" && (
                            <p className="slide-card__description">
                              {result.prompt}
                            </p>
                          )}

                          {!result.isCTA && (
                            <div className="slide-card__foot">
                              <div className="slide-card__foot-label">
                                Character Guidance
                              </div>
                              <p className="slide-card__foot-text">
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
      </main>

      <footer className="footer">
        <div className="footer__content">
          <p>© 2024 Consistency Studio — Gemini 3 Pro Engine</p>
          <div className="footer__status">
            <span>
              <span className="status-dot status-dot--green" />
              Character Identity Locked
            </span>
            <span>
              <span className="status-dot status-dot--blue" />
              Lifestack Slideshow Optimized
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
