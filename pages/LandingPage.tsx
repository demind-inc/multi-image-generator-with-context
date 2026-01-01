import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import AuthShell from "../components/AuthShell/AuthShell";
import "./LandingPage.scss";

const referenceImage = {
  src: "/assets/showcase/reference.png",
  alt: "Reference upload",
};

const generatedImages = [
  {
    src: "/assets/showcase/output-1.png",
    prompt: "Boy with a question mark around him",
  },
  {
    src: "/assets/showcase/output-2.png",
    prompt: "Boy writing in a notebook",
  },
  {
    src: "/assets/showcase/output-3.png",
    prompt: "Boy feeling annoyed at a noisy cafe",
  },
];

const quickSteps = [
  { title: "Upload one face", detail: "Use 1–3 clear shots. No setup." },
  { title: "Pick contexts", detail: "Drop prompts: coffee, stage, notes." },
  { title: "Get your set", detail: "We keep the style and features aligned." },
];

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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden-input"
        onChange={handleFileChange}
      />

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
            <div className="brand__subtitle">
              <span className="brand__eyebrow">Context aware</span>
              <span className="brand__subtitle-text">
                Multi-image generator
              </span>
            </div>
          </div>
        </div>

        <nav className="landing__nav">
          <button onClick={() => scrollToSection("gallery")}>Examples</button>
          <button onClick={() => scrollToSection("flow")}>Flow</button>
          <button onClick={() => scrollToSection("try")}>Try it</button>
          <button onClick={() => scrollToSection("pricing")}>Pricing</button>
          <button onClick={() => scrollToSection("faq")}>FAQ</button>
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
            <div className="landing__badge">Input ➝ four matching outputs</div>
            <h1>Drop one photo. Leave with a whole set.</h1>
            <p className="landing__lead">
              Real results from one upload—warm, consistent, and ready for any
              scene you describe.
            </p>
            <div className="landing__cta">
              <button className="primary-button" onClick={handleStart}>
                Start with your photo
              </button>
              <button
                className="landing__ghost-button"
                onClick={() => scrollToSection("gallery")}
              >
                View examples
              </button>
            </div>
            <div className="landing__meta">
              <span className="pill">1 free image after login</span>
              <span className="pill pill--ghost">Context-aware prompts</span>
              <span className="pill pill--ghost">No watermarks</span>
            </div>
          </div>

          <div className="landing__hero-panel">
            <div className="landing__form-card">
              <div className="landing__form-row">
                <div className="landing__label">Upload</div>
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
                      <strong>Click to upload</strong>
                      <span className="landing__hint">
                        1–3 clear shots, PNG or JPG.
                      </span>
                    </div>
                  </div>
                  {uploadedFileName && (
                    <div className="landing__upload-file">
                      <span className="landing__upload-file-name">
                        {uploadedFileName}
                      </span>
                      <span className="landing__upload-file-tag">Ready</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="landing__form-row">
                <div className="landing__label">Prompt</div>
                <div className="landing__prompt landing__prompt--textarea">
                  Listening closely in a busy café with warm light and soft blur
                  behind me.
                </div>
              </div>

              <button className="primary-button" onClick={handleStart}>
                Generate
              </button>
            </div>
          </div>
        </section>

        <section
          id="gallery"
          className="landing__section landing__section--gallery"
        >
          <div className="landing__section-head">
            <p className="landing__eyebrow">Real outputs</p>
            <h2>One upload, multiple moods</h2>
          </div>
          <div className="landing__mosaic">
            <div className="mosaic__reference">
              <div className="landing__card-label">Reference</div>
              <div className="landing__image-frame">
                <img
                  src={referenceImage.src}
                  alt={referenceImage.alt}
                  loading="lazy"
                />
              </div>
              <p className="landing__hint">
                We reuse this face in every scene.
              </p>
            </div>
            {generatedImages.map((image) => (
              <div className="mosaic__tile" key={image.prompt}>
                <div className="landing__image-frame landing__image-frame--glow">
                  <img src={image.src} alt={image.prompt} loading="lazy" />
                </div>
                <div className="mosaic__label">{image.prompt}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="flow" className="landing__section landing__section--flow">
          <div className="landing__section-head">
            <p className="landing__eyebrow">How it works</p>
            <h2>Three quick steps</h2>
          </div>
          <div className="landing__flow-grid">
            {quickSteps.map((step, index) => (
              <div className="flow-step" key={step.title}>
                <div className="flow-step__number">0{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="pricing"
          className="landing__section landing__section--pricing"
        >
          <div className="landing__section-head">
            <p className="landing__eyebrow">Pricing</p>
            <h2>Start free, unlock unlimited sets</h2>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-card__badge">Starter</div>
              <h3>First image</h3>
              <p className="pricing-card__price">$0</p>
              <p className="pricing-card__note">
                Sign in and generate one image on us.
              </p>
              <ul className="pricing-card__list">
                <li>1 free render</li>
                <li>No watermark</li>
                <li>Keep your look for later</li>
              </ul>
              <button className="primary-button" onClick={handleStart}>
                Claim free image
              </button>
            </div>
            <div className="pricing-card pricing-card--highlight">
              <div className="pricing-card__badge">Creator</div>
              <h3>After the first</h3>
              <p className="pricing-card__price">$20/mo</p>
              <p className="pricing-card__note">
                Unlimited generation after your free try.
              </p>
              <ul className="pricing-card__list">
                <li>Unlimited outputs</li>
                <li>Fast rendering queue</li>
                <li>Consistent faces across prompts</li>
              </ul>
              <button className="primary-button" onClick={handleStart}>
                Start generating
              </button>
            </div>
          </div>
        </section>

        <section id="faq" className="landing__section landing__section--faq">
          <div className="landing__section-head">
            <p className="landing__eyebrow">FAQ</p>
            <h2>Quick answers</h2>
          </div>
          <div className="faq">
            <div className="faq__item">
              <div className="faq__question">
                Do I need to sign in to generate?
              </div>
              <div className="faq__answer">
                Yes—sign in or create an account to unlock your first free
                image.
              </div>
            </div>
            <div className="faq__item">
              <div className="faq__question">
                How many photos should I upload?
              </div>
              <div className="faq__answer">
                Upload 1–3 clear shots with good lighting to lock your look.
              </div>
            </div>
            <div className="faq__item">
              <div className="faq__question">Are the outputs watermarked?</div>
              <div className="faq__answer">
                No—download your generated images without watermarks.
              </div>
            </div>
            <div className="faq__item">
              <div className="faq__question">Can I edit the prompt?</div>
              <div className="faq__answer">
                Yes—start from the suggested prompt or type your own context.
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
