import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import AuthShell from "../components/AuthShell/AuthShell";
import "./LandingPage.scss";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    authStatus,
    authEmail,
    authPassword,
    authMessage,
    authError,
    isLoading,
    isSignUpMode,
    setAuthEmail,
    setAuthPassword,
    toggleAuthMode,
    signIn,
    signUp,
  } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authStatus === "signed_in") {
      setShowAuthModal(false);
    }
  }, [authStatus]);

  const handleStart = () => {
    if (authStatus === "signed_in") {
      navigate("/dashboard");
      return;
    }
    setShowAuthModal(true);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setShowAuthModal(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="landing">
      <div className="landing__background">
        <span className="landing__orb landing__orb--one" />
        <span className="landing__orb landing__orb--two" />
        <span className="landing__orb landing__orb--three" />
      </div>

      <header className="landing__header">
        <div className="landing__brand brand">
          <div className="brand__icon">
            <img
              src="/assets/images/logo.png"
              alt="NanoGen AI Logo"
              className="brand__icon-image"
            />
          </div>
          <div className="brand__text">
            <p className="brand__title">NanoGen AI</p>
            <p className="brand__subtitle">
              <p className="brand__eyebrow">Context aware</p>Multi-image
              generator
            </p>
          </div>
        </div>

        <nav className="landing__nav">
          <button onClick={() => scrollToSection("how-it-works")}>
            How it works
          </button>
          <button onClick={() => scrollToSection("try")}>Try generate</button>
          <button onClick={() => scrollToSection("pricing")}>Pricing</button>
        </nav>

        <div className="landing__actions">
          <button
            className="landing__link"
            onClick={() =>
              authStatus === "signed_in"
                ? navigate("/dashboard")
                : setShowAuthModal(true)
            }
          >
            {authStatus === "signed_in" ? "Dashboard" : "Login"}
          </button>
          <button className="primary-button" onClick={handleStart}>
            Start free
          </button>
        </div>
      </header>

      <main className="landing__main">
        <section className="landing__hero">
          <div className="landing__hero-copy">
            <h1>
              Show up in any context with consistent, professional AI shots.
            </h1>
            <p className="landing__lead">
              Upload a couple of reference photos, describe the scenario, and
              let NanoGen produce LinkedIn-ready images that match your face,
              outfit, and energy.
            </p>
            <div className="landing__cta">
              <button className="primary-button" onClick={handleStart}>
                Try it free
              </button>
              <button
                className="landing__ghost-button"
                onClick={() => scrollToSection("how-it-works")}
              >
                See the flow
              </button>
            </div>
          </div>

          <div className="landing__hero-panel">
            <div className="panel">
              <div className="panel__header">
                <div>
                  <p className="panel__label">Try generate</p>
                </div>
              </div>
              <div className="panel__body">
                <div className="panel__row panel__row--stack">
                  <div className="panel__mini-label">Upload image</div>
                  <div
                    className="landing__solid-upload"
                    role="button"
                    tabIndex={0}
                    onClick={handleUploadClick}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleUploadClick();
                      }
                    }}
                  >
                    <div className="landing__solid-top">
                      <span className="landing__drop-icon">+</span>
                      <div className="landing__drop-text">
                        <strong>Click to upload</strong> a reference
                        <p className="landing__drop-hint">
                          We’ll prompt you to sign in/up before generating.
                        </p>
                      </div>
                    </div>
                    {uploadedFileName && (
                      <div className="landing__upload-file">
                        <span className="landing__upload-file-name">
                          {uploadedFileName}
                        </span>
                        <span className="landing__upload-file-tag">
                          Ready after sign in
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="panel__row">
                  <div className="panel__mini-label">Prompt</div>
                  <div className="panel__prompt panel__prompt--textarea">
                    Confident LinkedIn banner photo in a bright office with a
                    laptop. Keep the same face and outfit, add a soft teal
                    accent in the background.
                  </div>
                </div>

                <button className="panel__cta" onClick={handleStart}>
                  Sign in to generate
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="landing__section landing__section--consistency">
          <div className="landing__section-head">
            <p className="landing__eyebrow">Consistent across prompts</p>
            <h2>Upload once, generate multiple matching shots</h2>
            <p className="landing__section-copy">
              Drop a reference image and a handful of prompts. We keep your face
              and vibe locked while creating multiple scenes in one go—perfect
              for LinkedIn profiles, banners, and slide covers.
            </p>
          </div>
          <div className="landing__consistency-grid">
            <div className="consistency__reference">
              <div className="consistency__label">Reference</div>
              <div className="mock-image mock-image--reference">
                <span>Your upload</span>
              </div>
              <p className="consistency__hint">
                We extract your look once and carry it into every prompt below.
              </p>
            </div>
            <div className="consistency__results">
              <div className="consistency__header">
                <p className="consistency__title">Generated set</p>
                <span className="pill">3 variations</span>
              </div>
              <div className="consistency__prompts">
                <div className="consistency__prompt">
                  <span className="consistency__dot" />
                  Casual coffee chat banner
                </div>
                <div className="consistency__prompt">
                  <span className="consistency__dot" />
                  Confident notebook shot for LinkedIn
                </div>
                <div className="consistency__prompt">
                  <span className="consistency__dot" />
                  Speaking on stage with warm lights
                </div>
              </div>
              <div className="consistency__samples">
                <div className="sample-card">
                  <div className="sample-card__thumb mock-image mock-image--free">
                    <span>Scene 1</span>
                  </div>
                  <p className="sample-card__caption">Matches your upload</p>
                </div>
                <div className="sample-card">
                  <div className="sample-card__thumb mock-image mock-image--paid">
                    <span>Scene 2</span>
                  </div>
                  <p className="sample-card__caption">Same face, new prompt</p>
                </div>
                <div className="sample-card">
                  <div className="sample-card__thumb mock-image mock-image--accent">
                    <span>Scene 3</span>
                  </div>
                  <p className="sample-card__caption">Consistent styling</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="landing__section">
          <div className="landing__section-head">
            <p className="landing__eyebrow">How it works</p>
            <h2>From headshot to contextual shots in minutes</h2>
            <p className="landing__section-copy">
              Stay consistent across profile photos, banners, and presentation
              covers. First render is free once you sign in. Every additional
              image is billed.
            </p>
          </div>
          <div className="landing__steps">
            <div className="step-card">
              <span className="step-card__number">01</span>
              <h3>Sign in or create an account</h3>
              <p>
                Access the generator with your account. We unlock one free
                render so you can see the quality before paying.
              </p>
            </div>
            <div className="step-card">
              <span className="step-card__number">02</span>
              <h3>Upload reference images</h3>
              <p>
                Add 1-3 clear photos to lock in your look. We keep your face,
                lighting, and vibe consistent across every scene.
              </p>
            </div>
            <div className="step-card">
              <span className="step-card__number">03</span>
              <h3>Describe the context</h3>
              <p>
                Tell us the setting: LinkedIn headshot, conference stage, or
                casual coffee chat. We generate prompts for you or let you edit
                manually.
              </p>
            </div>
            <div className="step-card">
              <span className="step-card__number">04</span>
              <h3>Generate and upgrade</h3>
              <p>
                Your first image is free. The second and beyond are billed per
                image, and you can download everything right from your
                dashboard.
              </p>
            </div>
          </div>
        </section>

        <section id="pricing" className="landing__section">
          <div className="landing__section-head">
            <p className="landing__eyebrow">Pricing</p>
            <h2>Simple, usage-based pricing</h2>
            <p className="landing__section-copy">
              The first image is free once you sign in. Every additional render
              is billed per image so you only pay for what you use.
            </p>
          </div>
          <div className="pricing">
            <div className="pricing__card">
              <div className="pricing__tag">Starter</div>
              <div className="pricing__price">$0</div>
              <p className="pricing__description">
                One free image once you sign in. Perfect for testing the
                quality.
              </p>
              <ul className="pricing__list">
                <li>1 free render</li>
                <li>Reference image storage</li>
                <li>Download without watermarks</li>
              </ul>
              <button className="pricing__button" onClick={handleStart}>
                Claim free render
              </button>
            </div>
            <div className="pricing__card pricing__card--highlight">
              <div className="pricing__tag">Creator</div>
              <div className="pricing__price">Pay per image</div>
              <p className="pricing__description">
                Second image and beyond billed per render. Ideal for LinkedIn
                updates and presentation decks.
              </p>
              <ul className="pricing__list">
                <li>Consistent faces across scenes</li>
                <li>Context-aware prompts</li>
                <li>Priority rendering</li>
              </ul>
              <button
                className="pricing__button pricing__button--primary"
                onClick={handleStart}
              >
                Start generating
              </button>
            </div>
          </div>
        </section>

        <section id="faq" className="landing__section">
          <div className="landing__section-head">
            <p className="landing__eyebrow">FAQ</p>
            <h2>Answers before you start</h2>
            <p className="landing__section-copy">
              Quick hits on the most common questions about generating
              contextual images with NanoGen.
            </p>
          </div>
          <div className="faq">
            <div className="faq__item">
              <div className="faq__question">
                How does it differ from ChatGPT?
              </div>
              <div className="faq__answer">
                We generate multiple images from your reference and prompts,
                keeping your look consistent across every shot—ChatGPT is
                text-first.
              </div>
            </div>
            <div className="faq__item">
              <div className="faq__question">
                Do I need to sign in to generate?
              </div>
              <div className="faq__answer">
                Yes. Sign in/up to unlock your first free render; additional
                images are billed per render.
              </div>
            </div>
            <div className="faq__item">
              <div className="faq__question">
                How many reference images should I upload?
              </div>
              <div className="faq__answer">
                Upload 1–3 clear photos with good lighting. We use them to lock
                your face, outfit, and style for all generated scenes.
              </div>
            </div>
            <div className="faq__item">
              <div className="faq__question">Can I edit prompts manually?</div>
              <div className="faq__answer">
                Yes. Start with our suggested prompts or type your own to
                control the setting, mood, and props.
              </div>
            </div>
          </div>
        </section>
      </main>

      {showAuthModal && (
        <div
          className="landing__modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="landing__modal">
            <button
              className="landing__modal-close"
              onClick={() => setShowAuthModal(false)}
            >
              ×
            </button>
            <AuthShell
              authEmail={authEmail}
              authPassword={authPassword}
              authMessage={authMessage}
              authError={authError}
              authStatus={authStatus}
              isLoading={isLoading}
              isSignUpMode={isSignUpMode}
              onEmailChange={setAuthEmail}
              onPasswordChange={setAuthPassword}
              onToggleAuthMode={toggleAuthMode}
              onSignIn={signIn}
              onSignUp={signUp}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
