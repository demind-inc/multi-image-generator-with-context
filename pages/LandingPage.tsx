import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { SubscriptionPlan } from "../types";
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
  {
    title: "Upload once",
    detail: "1–3 clear reference shots to lock the look.",
  },
  {
    title: "List scenes",
    detail: "Coffee shop, stage, study desk—add the scenes, not the ref.",
  },
  {
    title: "Generate a set",
    detail: "We keep the same character and illustration across every scene.",
  },
];

const valuePoints = [
  {
    title: "Scene-consistent sets",
    detail: "Same character, outfit, and illustration style in every render.",
  },
  {
    title: "No copy/paste loops",
    detail: "Upload once—your reference follows each scene automatically.",
  },
  {
    title: 'Better than "one upload"',
    detail:
      "The value is keeping scenes aligned, not just saving an extra click.",
  },
];

const problems = [
  {
    title: "Style drifts without a reference",
    detail:
      "Faces, outfits, and illustration style change scene to scene when you prompt from scratch.",
  },
  {
    title: "Re-upload, re-prompt, repeat",
    detail:
      "Copying prompts and uploading the same image for every scene wastes time.",
  },
  {
    title: "Stories break when scenes don’t match",
    detail:
      "Slides, comics, or lesson plans look disjointed when characters keep changing.",
  },
];

const pricingPlans = [
  {
    badge: "Free",
    title: "Try it out",
    price: "$0",
    credits: "3 credits",
    note: "Sign up and test 3 images for free.",
    perks: ["3 free images", "No card required", "Keep your references"],
    cta: "Start free",
  },
  {
    badge: "Basic",
    title: "For trying the workflow",
    price: "$9/mo",
    credits: "60 credits / month",
    note: "1 credit = 1 image. Credits reset monthly.",
    perks: [
      "60 images each month",
      "Scene-consistent renders",
      "Email support",
    ],
    cta: "Choose Basic",
  },
  {
    badge: "Pro",
    title: "For weekly storytellers",
    price: "$29/mo",
    credits: "180 credits / month",
    note: "1 credit = 1 image. Credits reset monthly.",
    perks: [
      "180 images each month",
      "Priority rendering",
      "Reference libraries saved",
    ],
    cta: "Choose Pro",
    highlight: true,
  },
  {
    badge: "Business",
    title: "For teams and volume",
    price: "$79/mo",
    credits: "600 credits / month",
    note: "1 credit = 1 image. Credits reset monthly.",
    perks: [
      "600 images each month",
      "Team-friendly storage",
      "Fastest support response",
    ],
    cta: "Choose Business",
  },
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

  const handlePlanStart = (plan: SubscriptionPlan) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("preferred_plan", plan);
      window.localStorage.setItem("start_payment_flow", "1");
    }
    if (authStatus === "signed_in") {
      navigate(`/dashboard?plan=${plan}&openPayment=1`);
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
              <span className="brand__eyebrow">Scene aware</span>
              <span className="brand__subtitle-text">
                Multi-image generator
              </span>
            </div>
          </div>
        </div>

        <nav className="landing__nav">
          <button onClick={() => scrollToSection("gallery")}>Examples</button>
          <button onClick={() => scrollToSection("problem")}>Why scenes</button>
          <button onClick={() => scrollToSection("flow")}>Flow</button>
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
            <div className="landing__badge">Scene-consistent illustration</div>
            <h1>Same character. Same illustration. New scenes in one click.</h1>
            <p className="landing__lead">
              Generate matching scenes without re-uploading references or
              copy-pasting prompts. We carry your character across every scene.
            </p>
            <div className="landing__cta">
              <button className="primary-button" onClick={handleStart}>
                Start with your scene
              </button>
              <button
                className="landing__ghost-button"
                onClick={() => scrollToSection("gallery")}
              >
                View examples
              </button>
            </div>
            <div className="landing__proof">
              {valuePoints.map((point) => (
                <div className="proof-item" key={point.title}>
                  <div className="proof-item__icon" aria-hidden="true">
                    <span />
                  </div>
                  <div className="proof-item__copy">
                    <p className="proof-item__title">{point.title}</p>
                    <p className="proof-item__detail">{point.detail}</p>
                  </div>
                </div>
              ))}
              <div className="proof-item proof-item--note">
                <div className="proof-item__icon" aria-hidden="true">
                  <span />
                </div>
                <div className="proof-item__copy">
                  <p className="proof-item__title">1 free render after login</p>
                  <p className="proof-item__detail">
                    Test a scene set before upgrading.
                  </p>
                </div>
              </div>
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
                <div className="landing__label">Scene prompt</div>
                <div className="landing__prompt landing__prompt--textarea">
                  Same boy, same illustration. Listening closely in a busy café
                  with warm light and soft blur behind him.
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
            <h2>Same character, multiple scenes</h2>
            <p className="landing__section-subhead">
              Built from a single reference—each scene holds the same face,
              outfit, and illustration style.
            </p>
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
                We keep this character locked while scenes change.
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

        <div className="landing__section-divider" aria-hidden="true" />

        <section
          id="problem"
          className="landing__section landing__section--problem"
        >
          <div className="landing__section-head">
            <p className="landing__eyebrow">The usual pain</p>
            <h2>Scene consistency is hard to keep</h2>
            <p className="landing__section-subhead">
              Here is what happens when you generate scene-by-scene without a
              persistent reference.
            </p>
          </div>
          <div className="landing__problem-grid">
            {problems.map((problem) => (
              <div className="problem-card" key={problem.title}>
                <div className="problem-card__icon" aria-hidden="true">
                  <span />
                </div>
                <div className="problem-card__body">
                  <p className="problem-card__title">{problem.title}</p>
                  <p className="problem-card__detail">{problem.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="flow" className="landing__section landing__section--flow">
          <div className="landing__section-head">
            <p className="landing__eyebrow">How it works</p>
            <h2>Three steps to a scene set</h2>
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
            <h2>Pick a plan, get monthly credits</h2>
          </div>
          <div className="pricing-grid">
            {pricingPlans.map((plan) => (
              <div
                className={`pricing-card ${
                  plan.highlight ? "pricing-card--highlight" : ""
                }`}
                key={plan.badge}
              >
                <div className="pricing-card__badge">{plan.badge}</div>
                <h3>{plan.title}</h3>
                <p className="pricing-card__price">{plan.price}</p>
                <p className="pricing-card__credits">{plan.credits}</p>
                <p className="pricing-card__note">{plan.note}</p>
                <ul className="pricing-card__list">
                  {plan.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
                <button
                  className="primary-button"
                  onClick={() =>
                    handlePlanStart(
                      plan.badge.toLowerCase() as SubscriptionPlan
                    )
                  }
                >
                  {plan.cta}
                </button>
              </div>
            ))}
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
                Yes—start from the suggested prompt or type your own scene.
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
